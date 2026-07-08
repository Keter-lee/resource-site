// 占位文件，后续 Task 会完整实现
export function handleAdminRoute() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:16px;">
      <h2>管理面板</h2>
      <p>功能即将实现...</p>
      <a href="#">← 返回站点</a>
    </div>
  `;
}
