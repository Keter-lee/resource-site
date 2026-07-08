import { showToast } from './utils.js';
import { loadData } from './store.js';
import { renderBrowseMode } from './render.js';
import { handleAdminRoute } from './admin.js';

async function init() {
  try {
    await loadData();

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  } catch (err) {
    console.error('初始化失败:', err);
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="error-page">
        <h2>⚠️ 加载失败</h2>
        <p>无法加载资源数据，请检查网络连接后重试。</p>
        <button class="btn btn-primary" onclick="location.reload()">重试</button>
      </div>
    `;
  }
}

function handleRoute() {
  const hash = window.location.hash;

  if (hash === '#admin') {
    handleAdminRoute();
  } else {
    renderBrowseMode();
  }
}

init();
