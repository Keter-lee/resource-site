import { $, $$, escapeHtml, getFaviconUrl, debounce } from './utils.js';
import { getCategories, getFilteredResources } from './store.js';

let currentCategory = 'all';
let currentSearch = '';

/**
 * 渲染整个浏览模式页面
 */
export function renderBrowseMode() {
  const app = $('#app');
  const categories = getCategories();

  app.innerHTML = `
    <header class="browse-header">
      <div class="header-top">
        <h1 class="site-title">🔗 资源站</h1>
        <div class="header-actions">
          <input type="text" class="search-input" id="searchInput" placeholder="搜索资源...">
          <a href="#admin" class="admin-link">管理</a>
        </div>
      </div>
      <nav class="category-tabs" id="categoryTabs">
        <button class="cat-tab active" data-cat="all">全部</button>
        ${categories.map(c => `
          <button class="cat-tab" data-cat="${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>
        `).join('')}
      </nav>
    </header>
    <section class="resource-grid" id="resourceGrid"></section>
    <p class="empty-state hidden" id="emptyState">未找到匹配的资源</p>
  `;

  bindBrowseEvents();
  renderCards();
}

function bindBrowseEvents() {
  $('#categoryTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    currentCategory = tab.dataset.cat;
    $('#categoryTabs').querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderCards();
  });

  const searchInput = $('#searchInput');
  searchInput.addEventListener('input', debounce(() => {
    currentSearch = searchInput.value;
    renderCards();
  }, 50));
}

function renderCards() {
  const grid = $('#resourceGrid');
  const emptyState = $('#emptyState');
  const resources = getFilteredResources(currentCategory, currentSearch);

  if (resources.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = resources.map(r => `
    <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="resource-card"
       title="${escapeHtml(r.description)}">
      <img src="${getFaviconUrl(r.url)}"
           alt="" class="card-favicon"
           loading="lazy"
           onerror="this.style.visibility='hidden'">
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(r.title)}</h3>
        <p class="card-desc">${escapeHtml(r.description)}</p>
      </div>
    </a>
  `).join('');
}
