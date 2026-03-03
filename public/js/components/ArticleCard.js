/**
 * Renders a single article card with collapsible content
 * @param {Object} article
 * @param {number} index
 * @returns {string} HTML string
 */
export const renderArticle = (article, index) => {
    return `
        <article class="article-card" id="article-${index}">
            <div class="article-header" onclick="document.getElementById('content-${index}').classList.toggle('hidden')">
                <div class="meta">
                    <span class="tag">${article.source}</span>
                    <span class="tag region-tag">${article.region}</span>
                    <span class="tag sentiment-tag ${article.sentiment ? article.sentiment.toLowerCase() : 'neutral'}">${article.sentiment || 'Neutral'}</span>
                </div>
                <h4>${article.title}</h4>
                <div class="meta">${article.author ? 'By ' + article.author + ' | ' : ''}${new Date(article.publishedAt).toLocaleString()}</div>
            </div>
            <div id="content-${index}" class="article-content hidden">
                <p>${article.summary || article.description || 'No summary available.'}</p>
                <a href="${article.url}" target="_blank" rel="noopener" class="read-more">Read original article →</a>
            </div>
        </article>
    `;
};
