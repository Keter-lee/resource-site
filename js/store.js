import { generateId } from './utils.js';

/**
 * 核心状态对象 —— 整个应用共享的数据源
 */
const state = {
  categories: [],
  resources: [],
  dataSha: null,        // GitHub 文件的 SHA，用于冲突检测
  loaded: false,
  dirtyCount: 0,        // 未提交的更改数
};

/**
 * 从本地路径或 GitHub API 加载数据
 */
export async function loadData(source = 'data/resources.json') {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`加载数据失败: ${response.status}`);
  const json = await response.json();
  state.categories = json.categories || [];
  state.resources = json.resources || [];
  state.dataSha = json._sha || null;
  state.loaded = true;
}

/**
 * 获取序列化后的 JSON 字符串（用于提交到 GitHub）
 */
export function getDataJson() {
  return JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    categories: state.categories,
    resources: state.resources,
  }, null, 2);
}

/**
 * 按分类和搜索词过滤资源
 */
export function getFilteredResources(categoryId = 'all', searchQuery = '') {
  let list = [...state.resources];

  if (categoryId !== 'all') {
    list = list.filter(r => r.categoryId === categoryId);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.url.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * 获取所有分类
 */
export function getCategories() {
  return state.categories;
}

/**
 * 获取单个资源
 */
export function getResource(id) {
  return state.resources.find(r => r.id === id) || null;
}

/**
 * 添加资源
 */
export function addResource({ title, description, url, categoryId, type }) {
  const resource = {
    id: generateId(),
    title,
    description,
    url,
    categoryId,
    type: type || 'link',
    addedAt: new Date().toISOString(),
  };
  state.resources.push(resource);
  state.dirtyCount++;
  return resource;
}

/**
 * 更新资源
 */
export function updateResource(id, updates) {
  const index = state.resources.findIndex(r => r.id === id);
  if (index === -1) return false;
  state.resources[index] = { ...state.resources[index], ...updates };
  state.dirtyCount++;
  return true;
}

/**
 * 删除资源
 */
export function deleteResource(id) {
  const index = state.resources.findIndex(r => r.id === id);
  if (index === -1) return false;
  state.resources.splice(index, 1);
  state.dirtyCount++;
  return true;
}

/**
 * 添加分类
 */
export function addCategory({ id, name, icon }) {
  if (state.categories.find(c => c.id === id)) return false;
  state.categories.push({ id, name, icon: icon || 'folder' });
  state.dirtyCount++;
  return true;
}

/**
 * 删除分类（同时删除该分类下的所有资源）
 */
export function deleteCategory(id) {
  const index = state.categories.findIndex(c => c.id === id);
  if (index === -1) return false;
  state.categories.splice(index, 1);
  state.resources = state.resources.filter(r => r.categoryId !== id);
  state.dirtyCount++;
  return true;
}

/**
 * 更新 dataSha（GitHub 提交成功后调用）
 */
export function setDataSha(sha) {
  state.dataSha = sha;
}

/**
 * 重置未提交更改计数
 */
export function resetDirtyCount() {
  state.dirtyCount = 0;
}

/**
 * 获取状态快照
 */
export function getState() {
  return state;
}
