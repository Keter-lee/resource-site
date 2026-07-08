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

// 占位函数 — 后续 Task 会完整实现
function showAdminPanel() {
  const app = $('#app');
  app.innerHTML = `
    <div class="admin-page">
      <header class="admin-header">
        <a href="#" class="back-link">← 返回站点</a>
        <h2>管理面板</h2>
        <button class="btn btn-outline btn-sm" id="logoutBtn">退出</button>
      </header>
      <p style="text-align:center;padding:40px;">管理功能即将在后续步骤中实现...</p>
    </div>
  `;
  $('#logoutBtn').addEventListener('click', logout);
}
