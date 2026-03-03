const Parser = require('rss-parser');
const BaseAdapter = require('./BaseAdapter');

class GoogleNewsAdapter extends BaseAdapter {
  constructor(sourceName, region, sourceSearchTag) {
    super(sourceName, region);
    this.sourceSearchTag = sourceSearchTag;
    this.parser = new Parser();
  }

  async fetchArticles(query, timeframe = '24h') {
    // Mapping timeframe to Google News format: 15m, 1h, 24h
    let when = '1d';
    if (timeframe === '15min') when = '15m';
    else if (timeframe === '1h') when = '1h';
    else if (timeframe === '24h') when = '1d';

    const searchQuery = encodeURIComponent(`${query} source:"${this.sourceSearchTag}" when:${when}`);
    const url = `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;

    try {
      const feed = await this.parser.parseURL(url);
      return feed.items.map(item => this.normalize(item));
    } catch (error) {
      console.error(`Error fetching from ${this.sourceName}:`, error.message);
      return [];
    }
  }
}

module.exports = GoogleNewsAdapter;
