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
      return this.fallbackSummaries(articles);
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
      2. A "sentimentOverview" (descriptive label like "Critical", "Optimistic", "Neutral").
      3. A "regionalAnalysis" (how sentiment/coverage varies by region: Europe, Middle East, North America).
      4. For each article, provide a 1-sentence "shortSummary" and a "sentiment" label.

      Return ONLY a JSON object with this structure:
      {
        "globalSummary": "...",
        "sentimentOverview": "...",
        "regionalAnalysis": "...",
        "articles": [{"title": "...", "shortSummary": "...", "sentiment": "..."}]
      }
    `;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(chatCompletion.choices[0].message.content);

      // Merge results back to articles
      const enrichedArticles = articles.map(art => {
        const enriched = result.articles && result.articles.find(r => r.title === art.title);
        return {
          ...art,
          summary: enriched ? enriched.shortSummary : (art.description || art.title),
          sentiment: enriched ? enriched.sentiment : 'Neutral'
        };
      });

      return {
        globalSummary: result.globalSummary || "Summary generation failed.",
        sentimentOverview: result.sentimentOverview || "Mixed",
        regionalAnalysis: result.regionalAnalysis || "Analysis not available.",
        articles: enrichedArticles
      };
    } catch (error) {
      console.error("Summarization failed:", error);
      return this.fallbackSummaries(articles);
    }
  }

  /**
   * Fallback extractive summarization if LLM is unavailable
   * @param {Array<Object>} articles
   * @returns {Object}
   */
  fallbackSummaries(articles) {
    return {
      globalSummary: "Intelligence aggregation complete. (AI Summarization currently unavailable)",
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
