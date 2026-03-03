import { renderArticle } from './components/ArticleCard.js';

const elements = {
    searchInput: document.getElementById('search-input'),
    timeframeSelect: document.getElementById('timeframe-select'),
    searchBtn: document.getElementById('search-btn'),
    resultsSection: document.getElementById('results-section'),
    articlesList: document.getElementById('articles-list'),
    globalSummaryText: document.getElementById('global-summary-text'),
    sentimentVal: document.getElementById('sentiment-val'),
    sourcesCount: document.getElementById('sources-count'),
    regionalAnalysisText: document.getElementById('regional-analysis-text'),
    loader: document.getElementById('loader'),
    themeToggle: document.getElementById('theme-toggle'),
    filterSource: document.getElementById('filter-source')
};

let currentArticles = [];

const performSearch = async () => {
    const query = elements.searchInput.value.trim();
    const timeframe = elements.timeframeSelect.value;

    if (!query) return;

    // UI Reset
    elements.resultsSection.classList.add('hidden');
    elements.loader.classList.remove('hidden');
    elements.articlesList.innerHTML = '';

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&t=${timeframe}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.message || data.error);
            throw new Error(data.message || data.error);
        }

        currentArticles = data.articles;
        displayResults(data);
    } catch (error) {
        console.error('Search failed:', error);
        alert(`Failed to retrieve news intelligence: ${error.message}. Please try again.`);
    } finally {
        elements.loader.classList.add('hidden');
    }
};

const displayResults = (data) => {
    elements.resultsSection.classList.remove('hidden');
    elements.globalSummaryText.textContent = data.globalSummary;
    elements.sentimentVal.textContent = data.sentimentOverview;
    elements.sourcesCount.textContent = data.totalArticles;
    elements.regionalAnalysisText.textContent = data.regionalAnalysis;

    renderArticles(data.articles);
};

const renderArticles = (articles) => {
    elements.articlesList.innerHTML = articles.map(renderArticle).join('');
};

const handleFilter = () => {
    const filterTerm = elements.filterSource.value.toLowerCase();
    const filtered = currentArticles.filter(a =>
        a.source.toLowerCase().includes(filterTerm) ||
        a.title.toLowerCase().includes(filterTerm)
    );
    renderArticles(filtered);
};

// Event Listeners
elements.searchBtn.addEventListener('click', performSearch);
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

elements.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

elements.filterSource.addEventListener('input', handleFilter);
