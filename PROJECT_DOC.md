# Global News Radar - Project Documentation

## Executive Summary
Global News Radar is a high-performance news intelligence dashboard designed for professionals who require a consolidated, analytical view of global events. By aggregating news from 15 major international sources and applying AI-driven summarization, it provides a "single pane of glass" for topic-based news research.

## System Architecture
The application follows a clean, decoupled architecture:
- **Frontend**: A lightweight, vanilla JavaScript SPA served as static assets.
- **Backend**: Node.js Express application running on Vercel Serverless Functions.
- **Adapters**: A pluggable adapter layer for different news sources.
- **Summarization**: Integration with Groq (Llama 3 70B) for real-time analysis.
- **Caching**: Multi-level caching (Vercel edge + Redis/Memory) to ensure <4s response times.

## Data Flow Diagram
1. User enters topic -> Frontend sends request to `/api/search`.
2. Backend checks Cache. If miss:
3. NewsService invokes 15 Adapters in parallel (async/await).
4. Adapters fetch from Google News RSS (Primary) or Source RSS (Fallback).
5. Results are aggregated and deduplicated.
6. Top articles are sent to SummarizationService (Groq API).
7. AI generates Global Summary, Sentiment, and Regional Bias analysis.
8. Enriched response is cached and returned to Frontend.
9. Frontend renders dashboard with progressive disclosure.

## Backend Architecture Design
- **Modular Services**: Separate logic for fetching, summarizing, and caching.
- **Strict Error Boundaries**: Source failures are caught individually; the system remains functional even if some sources fail.
- **Timeout Control**: Every external request is wrapped in a 3-second timeout.

## Frontend Architecture Design
- **Vanilla JS Modular Pattern**: ES Modules for clean structure without framework overhead.
- **Responsive CSS**: Custom grid/flexbox layout with CSS variable-based theming (Dark/Light).
- **Accessibility**: ARIA labels and semantic HTML for professional use.

## Adapter Pattern Design
Adapters extend a `BaseAdapter` class, ensuring consistency. New sources can be added by creating a new adapter class and registering it in the index.

## Article Normalization Model
```json
{
  "id": "unique-id",
  "source": "BBC News",
  "title": "Article Title",
  "author": "John Doe",
  "publishedAt": "ISO-8601",
  "url": "https://...",
  "description": "Snippet...",
  "summary": "AI-generated short summary",
  "sentiment": "Positive/Neutral/Critical",
  "region": "Europe"
}
```

## API Specification
- **GET /api/search?q={topic}&t={timeframe}**
  - `q`: Search keyword.
  - `t`: Timeframe (`15min`, `1h`, `24h`). Default `24h`.

## Folder Structure
```
/api          # Serverless entry point
/public       # Static frontend assets
/src/backend  # Core logic (Adapters, Services, Utils)
/src/frontend # (Optional) frontend source if using build step
```

## Error Handling & Rate Limiting
- **Backend**: Helmet and CORS middleware. Request sanitization.
- **Rate Limiting**: IP-based limiting via middleware (to be added in production).
- **Fallbacks**: If Groq API is down, system returns original article descriptions.

## Performance Optimization
- **Parallelism**: Using `Promise.all` for source fetching.
- **Caching**: 30-minute TTL for search queries.
- **Lightweight Frontend**: Zero heavy JS libraries ensures instant load times.

## Deployment
Configured for **Vercel**.
- API: Serverless functions in `/api`.
- Frontend: Static hosting for `/public`.
- Env Vars: `GROQ_API_KEY`, `REDIS_URL`.
