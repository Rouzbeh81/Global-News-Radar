const adapters = require('../adapters');
const _ = require('lodash');

/**
 * Service to coordinate news fetching across multiple adapters
 */
class NewsService {
  /**
   * Search all enabled sources
   * @param {string} query - Search topic
   * @param {string} timeframe - 15min, 1h, 24h
   * @returns {Promise<Array<Object>>} Sorted, deduplicated articles
   */
  async search(query, timeframe) {
    const fetchPromises = adapters.map(adapter =>
      this.fetchWithTimeout(adapter, query, timeframe, 3000)
    );

    const results = await Promise.all(fetchPromises);
    const flattened = _.flatten(results);

    // Deduplicate by URL and fuzzy title similarity
    const uniqueArticles = this.deduplicate(flattened);

    // Sort by publish date descending
    return _.orderBy(uniqueArticles, ['publishedAt'], ['desc']);
  }

  /**
   * Deduplicate articles based on URL and title similarity
   * @param {Array} articles
   * @returns {Array}
   */
  deduplicate(articles) {
    const unique = [];
    const titles = [];

    articles.forEach(article => {
      const isDuplicateUrl = unique.some(a => a.url === article.url);
      if (isDuplicateUrl) return;

      // Simple fuzzy title match: normalized title (lowercase, no special chars)
      const normTitle = article.title.toLowerCase().replace(/[^\w\s]/gi, '').trim();
      const isDuplicateTitle = titles.some(t => {
        // If titles are 85% similar or one contains another (min length 20)
        if (t === normTitle) return true;
        if (normTitle.length > 20 && (t.includes(normTitle) || normTitle.includes(t))) return true;
        return false;
      });

      if (!isDuplicateTitle) {
        unique.push(article);
        titles.push(normTitle);
      }
    });

    return unique;
  }

  /**
   * Execute fetch with a hard timeout
   * @param {BaseAdapter} adapter - Source adapter
   * @param {string} query - Search topic
   * @param {string} timeframe - Time range
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<Array>}
   */
  async fetchWithTimeout(adapter, query, timeframe, timeout) {
    return Promise.race([
      adapter.fetchArticles(query, timeframe),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout source ${adapter.sourceName}`)), timeout))
    ]).catch(err => {
      console.warn(err.message);
      return [];
    });
  }
}

module.exports = new NewsService();
