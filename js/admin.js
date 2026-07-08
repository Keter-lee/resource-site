import { $, escapeHtml, showToast, sha256 } from './utils.js';
import { getState, getResource, getCategories, getDataJson,
         addResource, updateResource, deleteResource,
         addCategory, deleteCategory,
         setDataSha, resetDirtyCount } from './store.js';

// ⚠️ 修改此 hash 为你自己的密码。
// 生成方式：在浏览器控制台运行 await sha256('你的密码')
// 默认密码: "password"
const PASSWORD_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

const STORAGE_KEY_AUTH = 'resource_site_auth';
const STORAGE_KEY_TOKEN = 'resource_site_gh_token';
const STORAGE_KEY_REPO = 'resource_site_gh_repo';
const STORAGE_KEY_OWNER = 'resource_site_gh_owner';
const STORAGE_KEY_BRANCH = 'resource_site_gh_branch';
const STORAGE_KEY_PATH = 'resource_site_gh_path';

/**
 * 路由入口：判断是否已认证，展示登录页或管理面板
 */
export function handleAdminRoute() {
  if (isAuthenticated()) {
    showAdminPanel();
  } else {
    showLoginForm();
  }
}

function isAuthenticated() {
  return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true';
}

function showLoginForm() {
  const app = $('#app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <h2>🔐 管理登录</h2>
        <p class="subtitle">请输入管理密码以继续</p>
        <form id="loginForm">
          <input type="password" id="passwordInput" class="form-input"
                 placeholder="输入密码..." autofocus>
          <p class="form-error hidden" id="loginError">密码错误，请重试</p>
          <button type="submit" class="btn btn-primary btn-full">登录</button>
        </form>
        <a href="#" class="back-link">← 返回站点</a>
      </div>
    </div>
  `;

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = $('#passwordInput').value;
    const hash = await sha256(password);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
      showAdminPanel();
    } else {
      $('#loginError').classList.remove('hidden');
      $('#passwordInput').value = '';
    }
  });
}

function logout() {
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
  window.location.hash = '';
}

function bindAdminEvents() {
  $('#logoutBtn').addEventListener('click', logout);

  $('#addResourceBtn').addEventListener('click', () => showResourceModal());

  $('#addCategoryBtn').addEventListener('click', () => showCategoryModal());

  $('#categoryChips').addEventListener('click', (e) => {
    const delBtn = e.target.closest('.chip-del');
    if (delBtn) {
      const catId = delBtn.dataset.catId;
      if (confirm(`确定删除分类 "${catId}" 及其所有资源？`)) {
        deleteCategory(catId);
        showAdminPanel();
      }
    }
  });

  $('#adminResourceList').addEventListener('click', (e) => {
    const item = e.target.closest('.admin-resource-item');
    if (!item) return;
    const id = item.dataset.id;

    if (e.target.closest('.edit-btn')) {
      showResourceModal(id);
    } else if (e.target.closest('.delete-btn')) {
      if (confirm('确定删除此资源？')) {
        deleteResource(id);
        showAdminPanel();
      }
    }
  });
}

function updateDirtyBadge() {
  const state = getState();
  const badge = document.getElementById('dirtyBadge');
  if (badge) {
    if (state.dirtyCount > 0) {
      badge.textContent = `${state.dirtyCount} 处更改`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

function showResourceModal(editId = null) {
  const resource = editId ? getResource(editId) : null;
  const categories = getCategories();
  const isEdit = !!resource;

  const title = isEdit ? resource.title : '';
  const desc = isEdit ? resource.description : '';
  const url = isEdit ? resource.url : '';
  const catId = isEdit ? resource.categoryId : (categories[0]?.id || '');
  const type = isEdit ? resource.type : 'link';

  const modalHtml = `
    <div class="modal-overlay" id="resourceModal">
      <div class="modal">
        <h3>${isEdit ? '编辑资源' : '添加资源'}</h3>
        <form id="resourceForm">
          <label class="form-label">标题</label>
          <input type="text" class="form-input" id="resTitle" value="${escapeHtml(title)}" required>

          <label class="form-label">描述</label>
          <input type="text" class="form-input" id="resDesc" value="${escapeHtml(desc)}">

          <label class="form-label">URL</label>
          <input type="url" class="form-input" id="resUrl" value="${escapeHtml(url)}" required>

          <label class="form-label">分类</label>
          <select class="form-input" id="resCategory">
            ${categories.map(c => `
              <option value="${escapeHtml(c.id)}" ${c.id === catId ? 'selected' : ''}>${escapeHtml(c.name)}</option>
            `).join('')}
          </select>

          <label class="form-label">类型</label>
          <select class="form-input" id="resType">
            <option value="link" ${type === 'link' ? 'selected' : ''}>外部链接</option>
            <option value="file" ${type === 'file' ? 'selected' : ''}>可下载文件</option>
          </select>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" id="cancelModal">取消</button>
            <button type="submit" class="btn btn-primary">${isEdit ? '保存' : '添加'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  $('#resourceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      title: $('#resTitle').value.trim(),
      description: $('#resDesc').value.trim(),
      url: $('#resUrl').value.trim(),
      categoryId: $('#resCategory').value,
      type: $('#resType').value,
    };

    if (!data.title || !data.url) {
      showToast('标题和 URL 不能为空', 'error');
      return;
    }

    try { new URL(data.url); } catch {
      showToast('请输入有效的 URL', 'error');
      return;
    }

    if (isEdit) {
      updateResource(editId, data);
    } else {
      addResource(data);
    }

    closeModal();
    showAdminPanel();
  });

  $('#cancelModal').addEventListener('click', closeModal);
  $('#resourceModal').addEventListener('click', (e) => {
    if (e.target === $('#resourceModal')) closeModal();
  });
}

function showCategoryModal() {
  const modalHtml = `
    <div class="modal-overlay" id="categoryModal">
      <div class="modal">
        <h3>添加分类</h3>
        <form id="categoryForm">
          <label class="form-label">分类 ID（英文，用于数据标识）</label>
          <input type="text" class="form-input" id="catId" placeholder="例如: backend" required pattern="[a-z0-9-]+">

          <label class="form-label">分类名称</label>
          <input type="text" class="form-input" id="catName" placeholder="例如: 后端工具" required>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" id="cancelCatModal">取消</button>
            <button type="submit" class="btn btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  $('#categoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#catId').value.trim().toLowerCase();
    const name = $('#catName').value.trim();

    if (!id || !name) {
      showToast('ID 和名称不能为空', 'error');
      return;
    }

    if (!addCategory({ id, name, icon: 'folder' })) {
      showToast('分类 ID 已存在', 'error');
      return;
    }

    closeModal();
    showAdminPanel();
  });

  $('#cancelCatModal').addEventListener('click', closeModal);
  $('#categoryModal').addEventListener('click', (e) => {
    if (e.target === $('#categoryModal')) closeModal();
  });
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}

function showAdminPanel() {
  const app = $('#app');
  const state = getState();
  const categories = state.categories;
  const resources = state.resources;

  app.innerHTML = `
    <div class="admin-page">
      <header class="admin-header">
        <a href="#" class="back-link">← 返回站点</a>
        <h2>管理面板</h2>
        <div class="admin-header-actions">
          <span class="dirty-badge hidden" id="dirtyBadge">0 处更改</span>
          <button class="btn btn-primary btn-sm" id="saveBtn">提交到 GitHub</button>
          <button class="btn btn-outline btn-sm" id="logoutBtn">退出</button>
        </div>
      </header>

      <section class="admin-section">
        <h3>分类管理</h3>
        <div class="category-chips" id="categoryChips">
          ${categories.map(c => `
            <span class="chip">${escapeHtml(c.name)}
              <button class="chip-del" data-cat-id="${escapeHtml(c.id)}">&times;</button>
            </span>
          `).join('')}
          <button class="chip chip-add" id="addCategoryBtn">+ 添加分类</button>
        </div>
      </section>

      <section class="admin-section">
        <div class="section-header">
          <h3>资源列表 (${resources.length})</h3>
          <button class="btn btn-primary" id="addResourceBtn">＋ 添加资源</button>
        </div>
        <div class="admin-resource-list" id="adminResourceList">
          ${resources.map(r => {
            const cat = categories.find(c => c.id === r.categoryId);
            return `
              <div class="admin-resource-item" data-id="${escapeHtml(r.id)}">
                <div class="admin-resource-info">
                  <strong>${escapeHtml(r.title)}</strong>
                  <span class="admin-meta">
                    ${cat ? escapeHtml(cat.name) : '未分类'} · ${r.addedAt.slice(0, 10)}
                  </span>
                </div>
                <div class="admin-resource-actions">
                  <button class="btn btn-outline btn-sm edit-btn">编辑</button>
                  <button class="btn btn-danger btn-sm delete-btn">删除</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;

  bindAdminEvents();
  updateDirtyBadge();
}
