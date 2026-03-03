const Groq = require('groq-sdk');

/**
 * Service for AI-powered news summarization and analysis
 */
class SummarizationService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  /**
   * Generates global and individual article summaries using LLM
   * @param {Array<Object>} articles - List of normalized articles
   * @param {string} query - Original search query
   * @returns {Promise<Object>} Enriched data with summaries and analysis
   */
  async generateSummaries(articles, query) {
    if (!articles || articles.length === 0) return { globalSummary: "No articles found.", sentimentOverview: "N/A", articles: [] };

    // Group articles for efficient batch processing if needed, but for MVP we do a global summary
    // and extract individual insights in one or two calls.

    const articleData = articles.slice(0, 10).map(a => ({
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
        const enriched = result.articles.find(r => r.title === art.title);
        return {
          ...art,
          summary: enriched ? enriched.shortSummary : art.description,
          sentiment: enriched ? enriched.sentiment : 'Neutral'
        };
      });

      return {
        globalSummary: result.globalSummary,
        sentimentOverview: result.sentimentOverview,
        regionalAnalysis: result.regionalAnalysis,
        articles: enrichedArticles
      };
    } catch (error) {
      console.error("Summarization failed:", error);
      // Fallback
      return {
        globalSummary: "Summary unavailable due to technical error.",
        sentimentOverview: "Unknown",
        regionalAnalysis: "Analysis unavailable.",
        articles: articles.map(a => ({ ...a, summary: a.description, sentiment: 'Unknown' }))
      };
    }
  }
}

module.exports = new SummarizationService();
