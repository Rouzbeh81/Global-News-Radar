/**
 * Base News Adapter providing common interface and normalization
 */
class BaseAdapter {
  /**
   * @param {string} sourceName - Name of the news source
   * @param {string} region - Geographic region of the source
   */
  constructor(sourceName, region) {
    this.sourceName = sourceName;
    this.region = region;
  }

  /**
   * Fetch articles for a given query and timeframe
   * @param {string} query - Keyword or topic
   * @param {string} timeframe - Time range (15min, 1h, 24h)
   * @returns {Promise<Array<Object>>} List of normalized articles
   */
  async fetchArticles(query, timeframe) {
    throw new Error('fetchArticles must be implemented');
  }

  /**
   * Normalize raw article data to standardized format
   * @param {Object} rawArticle - Raw data from RSS item
   * @returns {Object} Normalized article object
   */
  normalize(rawArticle) {
    return {
      id: rawArticle.guid || rawArticle.link,
      source: this.sourceName,
      title: rawArticle.title,
      author: rawArticle.creator || rawArticle.author || this.sourceName,
      publishedAt: rawArticle.pubDate || rawArticle.isoDate,
      url: rawArticle.link,
      canonicalUrl: rawArticle.link,
      description: rawArticle.contentSnippet || rawArticle.content,
      content: rawArticle.content,
      summary: null,
      sentimentScore: null,
      region: this.region
    };
  }
}

module.exports = BaseAdapter;
