const Groq = require('groq-sdk');

/**
 * Service for AI-powered news summarization and analysis
 */
class SummarizationService {
  constructor() {
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
    }
  }

  /**
   * Generates global and individual article summaries using LLM
   * @param {Array<Object>} articles - List of normalized articles
   * @param {string} query - Original search query
   * @returns {Promise<Object>} Enriched data with summaries and analysis
   */
  async generateSummaries(articles, query) {
    if (!articles || articles.length === 0) {
      return { globalSummary: "No articles found.", sentimentOverview: "N/A", articles: [] };
    }

    // Lazy initialization of Groq client if not already done
    if (!this.groq && process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
    }

    if (!this.groq) {
      console.warn("GROQ_API_KEY not configured. Using fallback summarization.");
      return this.fallbackSummaries(articles, "Missing API Key");
    }

    const articleData = articles.slice(0, 15).map(a => ({
      source: a.source,
      title: a.title,
      region: a.region
    }));

    const prompt = `
      You are a senior news analyst. Analyze these recent news headlines about "${query}":
      ${JSON.stringify(articleData)}

      Provide:
      1. A consolidated "globalSummary" (3-4 sentences).
      2. A "sentimentOverview" (STRICTLY one of: "Positive", "Neutral", "Critical").
      3. A "regionalAnalysis" (how sentiment/coverage varies by region: Europe, Middle East, North America).
      4. For each article, provide a 1-sentence "shortSummary", a "sentiment" label (STRICTLY one of: "Positive", "Neutral", "Critical"), and a "isRelevant" boolean (STRICTLY true/false).

      IMPORTANT: If an article is unrelated to "${query}", set "isRelevant": false.

      Return ONLY a JSON object with this structure:
      {
        "globalSummary": "...",
        "sentimentOverview": "Positive | Neutral | Critical",
        "regionalAnalysis": "...",
        "articles": [{"title": "...", "shortSummary": "...", "sentiment": "Positive | Neutral | Critical", "isRelevant": true}]
      }
    `;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      let result;
      try {
        result = JSON.parse(chatCompletion.choices[0].message.content);
      } catch (pErr) {
        console.error("JSON Parse Error from Groq:", pErr);
        return this.fallbackSummaries(articles, "Invalid AI response format");
      }

      // Merge results back to articles and filter by AI relevance
      const enrichedArticles = articles.map(art => {
        const enriched = Array.isArray(result.articles) && result.articles.find(r => r && (r.title === art.title || art.title.includes(r.title) || (typeof r.title === 'string' && art.title.includes(r.title))));

        // If LLM says not relevant, we'll mark it for removal or keep description
        const isRelevant = enriched ? enriched.isRelevant !== false : true;

        if (!isRelevant) return null;

        return {
          ...art,
          summary: enriched && typeof enriched.shortSummary === 'string' ? enriched.shortSummary : (art.description || art.title),
          sentiment: enriched && typeof enriched.sentiment === 'string' ? enriched.sentiment : 'Neutral'
        };
      }).filter(Boolean);

      // Robustly handle regionalAnalysis if it's an object
      let regionalAnalysis = result.regionalAnalysis || "Analysis not available.";
      if (regionalAnalysis && typeof regionalAnalysis === 'object') {
        try {
          regionalAnalysis = Object.entries(regionalAnalysis)
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join('. ');
        } catch (sErr) {
          regionalAnalysis = JSON.stringify(regionalAnalysis);
        }
      }

      return {
        globalSummary: typeof result.globalSummary === 'string' ? result.globalSummary : "Summary generation failed.",
        sentimentOverview: typeof result.sentimentOverview === 'string' ? result.sentimentOverview : "Mixed",
        regionalAnalysis: String(regionalAnalysis),
        articles: enrichedArticles
      };
    } catch (error) {
      console.error("Summarization failed:", error.message);
      return this.fallbackSummaries(articles, error.message);
    }
  }

  /**
   * Fallback extractive summarization if LLM is unavailable
   * @param {Array<Object>} articles
   * @param {string} reason
   * @returns {Object}
   */
  fallbackSummaries(articles, reason = "") {
    return {
      globalSummary: `Intelligence aggregation complete. (AI Summarization currently unavailable${reason ? ': ' + reason : ''})`,
      sentimentOverview: "Neutral",
      regionalAnalysis: "Geographic distribution analyzed across " + [...new Set(articles.map(a => a.region))].join(', '),
      articles: articles.map(a => ({
        ...a,
        summary: a.description || a.title,
        sentiment: 'Neutral'
      }))
    };
  }
}

module.exports = new SummarizationService();
