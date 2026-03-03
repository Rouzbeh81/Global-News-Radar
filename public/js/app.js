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
    filterSource: document.getElementById('filter-source'),
    autoRefreshToggle: document.getElementById('auto-refresh-toggle'),
    refreshInterval: document.getElementById('refresh-interval'),
    nextRefreshBox: document.getElementById('next-refresh'),
    timerVal: document.getElementById('timer-val')
};

let currentArticles = [];
let countdownTimer = null;
let timeRemaining = 0;

const performSearch = async (isAuto = false) => {
    const query = elements.searchInput.value.trim();
    const timeframe = elements.timeframeSelect.value;

    if (!query) return;

    // UI Reset if manual search
    if (!isAuto) {
        elements.resultsSection.classList.add('hidden');
        elements.articlesList.innerHTML = '';
    }
    elements.loader.classList.remove('hidden');

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

const startRefreshTimer = () => {
    stopRefreshTimer();
    if (!elements.autoRefreshToggle.checked) return;

    const interval = parseInt(elements.refreshInterval.value);
    timeRemaining = interval / 1000;

    elements.nextRefreshBox.classList.remove('hidden');
    updateTimerDisplay();

    countdownTimer = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            performSearch(true);
            timeRemaining = interval / 1000;
        }
        updateTimerDisplay();
    }, 1000);
};

const stopRefreshTimer = () => {
    if (countdownTimer) clearInterval(countdownTimer);
    elements.nextRefreshBox.classList.add('hidden');
};

const updateTimerDisplay = () => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    elements.timerVal.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Event Listeners
elements.searchBtn.addEventListener('click', () => {
    performSearch();
    if (elements.autoRefreshToggle.checked) startRefreshTimer();
});

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
        if (elements.autoRefreshToggle.checked) startRefreshTimer();
    }
});

elements.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

elements.filterSource.addEventListener('input', handleFilter);

elements.autoRefreshToggle.addEventListener('change', () => {
    elements.refreshInterval.disabled = !elements.autoRefreshToggle.checked;
    if (elements.autoRefreshToggle.checked) {
        startRefreshTimer();
    } else {
        stopRefreshTimer();
    }
});

elements.refreshInterval.addEventListener('change', startRefreshTimer);
