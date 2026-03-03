export const renderArticle = (article) => {
    return `
        <article class="article-card">
            <div class="meta">
                <span class="tag">${article.source}</span>
                <span class="tag">${article.region}</span>
                <span class="tag">${article.sentiment || 'Neutral'}</span>
            </div>
            <h4><a href="${article.url}" target="_blank" rel="noopener">${article.title}</a></h4>
            <div class="meta">${new Date(article.publishedAt).toLocaleString()}</div>
            <p>${article.summary || article.description || 'No summary available.'}</p>
        </article>
    `;
};
