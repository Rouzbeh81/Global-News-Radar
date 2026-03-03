const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const NewsService = require('../src/backend/services/NewsService');
const SummarizationService = require('../src/backend/services/SummarizationService');
const CacheService = require('../src/backend/services/CacheService');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Route
app.get('/api/search', async (req, res) => {
  const { q, t = '24h' } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const cacheKey = `search:${q}:${t}`;
  const cachedData = await CacheService.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    // 1. Fetch from sources
    const articles = await NewsService.search(q, t);

    // 2. Summarize and Analyze
    const result = await SummarizationService.generateSummaries(articles, q);

    const response = {
      query: q,
      timeframe: t,
      totalSourcesQueried: 15,
      totalArticles: articles.length,
      ...result
    };

    // 3. Cache results
    await CacheService.set(cacheKey, response, 1800); // 30 min cache

    res.json(response);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
