# 自定义字体功能 — 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现用户自定义字体导入功能，支持网站 URL（Google Fonts / 直链）和本地文件上传，持久化存储至 IndexedDB。

**架构：** 新增 `src/services/customFonts.ts` 封装 IndexedDB 操作 + FontFace API 加载 + URL 解析/下载；新增 `AddFontModal.vue` 弹窗组件；修改 `store.ts`、`App.vue`、`FontList.vue`、`FontInfo.vue` 接入自定义字体。

**技术栈：** Vue 3 + TypeScript + IndexedDB + FontFace API + crypto.randomUUID()

**验证方式：** 本项目无测试框架，用 `npm run build`（vue-tsc 类型检查 + vite build）验证正确性，用 `npm run dev` 手动验证功能。

---

### 任务 1：创建 CustomFontService — 数据类型 + IndexedDB 层

**文件：**
- 创建：`src/services/customFonts.ts`

- [ ] **步骤 1：创建服务文件，定义 CustomFont 接口和 IndexedDB 操作**

```typescript
// src/services/customFonts.ts

export interface CustomFont {
  id: string;
  name: string;
  fontFamily: string;
  source: 'url' | 'file' | 'google-fonts';
  sourceUrl?: string;
  blobData: ArrayBuffer;
  format: 'woff2' | 'ttf' | 'otf' | 'woff';
  addedAt: number;
}

const DB_NAME = 'fontcode';
const DB_VERSION = 1;
const STORE_NAME = 'custom-fonts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB 被阻塞'));
  });
}

async function saveFont(font: CustomFont): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(font);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadAllFonts(): Promise<CustomFont[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFontById(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

- [ ] **步骤 2：验证类型检查**

```bash
npx vue-tsc --noEmit src/services/customFonts.ts
```

预期：无类型错误。

- [ ] **步骤 3：Commit**

```bash
git add src/services/customFonts.ts
git commit -m "feat: add CustomFont type and IndexedDB CRUD layer"
```

---

### 任务 2：CustomFontService — 字体加载 + URL 解析 + 公共 API

**文件：**
- 修改：`src/services/customFonts.ts`（在任务 1 基础上追加代码）

- [ ] **步骤 1：添加 FontFace 加载、URL 下载、CSS 解析、格式检测函数**

在 `src/services/customFonts.ts` 文件末尾追加以下代码：

```typescript
// --- Font Loading ---

export async function loadFontToDocument(font: CustomFont): Promise<void> {
  const fontFace = new FontFace(font.fontFamily, font.blobData);
  await fontFace.load();
  document.fonts.add(fontFace);
}

// --- URL Handling ---

async function downloadFont(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`下载失败: HTTP ${res.status}`);
    return res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

function parseGoogleFontsCss(css: string): { name: string; urls: string[] } {
  const familyMatch = css.match(/font-family\s*:\s*['"]([^'"]+)['"]/);
  const name = familyMatch?.[1] ?? 'Unknown Font';
  const urlMatches = css.matchAll(/url\((https:\/\/[^)]+)\)/g);
  const urls = Array.from(urlMatches, (m) => m[1]);
  return { name, urls };
}

function detectFormat(filename: string): CustomFont['format'] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.woff2')) return 'woff2';
  if (lower.endsWith('.ttf')) return 'ttf';
  if (lower.endsWith('.otf')) return 'otf';
  if (lower.endsWith('.woff')) return 'woff';
  return 'woff2';
}

// --- Public API ---

export async function addFontFromUrl(url: string, customName?: string): Promise<CustomFont> {
  const id = crypto.randomUUID();

  if (url.includes('fonts.googleapis.com')) {
    const cssRes = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!cssRes.ok) throw new Error(`获取 CSS 失败: HTTP ${cssRes.status}`);
    const cssText = await cssRes.text();
    const { name, urls } = parseGoogleFontsCss(cssText);

    if (urls.length === 0) {
      throw new Error('未在 CSS 中找到字体文件链接，请确认链接来自 Google Fonts');
    }

    const firstUrl = urls[0];
    const blobData = await downloadFont(firstUrl);
    const format = detectFormat(firstUrl);

    const font: CustomFont = {
      id,
      name: customName || name,
      fontFamily: `"${customName || name}", monospace`,
      source: 'google-fonts',
      sourceUrl: url,
      blobData,
      format,
      addedAt: Date.now(),
    };
    await saveFont(font);
    await loadFontToDocument(font);
    return font;
  }

  // Direct URL mode
  const blobData = await downloadFont(url);
  const autoName = url.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'Custom Font';
  const format = detectFormat(url);

  const font: CustomFont = {
    id,
    name: customName || autoName,
    fontFamily: `"${customName || autoName}", monospace`,
    source: 'url',
    sourceUrl: url,
    blobData,
    format,
    addedAt: Date.now(),
  };
  await saveFont(font);
  await loadFontToDocument(font);
  return font;
}

export async function addFontFromFile(file: File, customName?: string): Promise<CustomFont> {
  const id = crypto.randomUUID();
  const autoName = file.name.replace(/\.[^.]+$/, '');
  const format = detectFormat(file.name);

  const blobData = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const font: CustomFont = {
    id,
    name: customName || autoName,
    fontFamily: `"${customName || autoName}", monospace`,
    source: 'file',
    blobData,
    format,
    addedAt: Date.now(),
  };
  await saveFont(font);
  await loadFontToDocument(font);
  return font;
}

export async function deleteFont(id: string, fontFamily: string): Promise<void> {
  await removeFontById(id);
  const fontFaces = Array.from(document.fonts.values());
  const target = fontFaces.find((f) => f.family === fontFamily);
  if (target) document.fonts.delete(target);
}
```

- [ ] **步骤 2：验证类型检查**

```bash
npx vue-tsc --noEmit src/services/customFonts.ts
```

预期：无类型错误。

- [ ] **步骤 3：Commit**

```bash
git add src/services/customFonts.ts
git commit -m "feat: add FontFace loading, URL parsing, and public API to CustomFontService"
```

---

### 任务 3：更新 Store 和 App.vue

**文件：**
- 修改：`src/store.ts`（第 1-17 行）
- 修改：`src/App.vue`（第 1-11 行）

- [ ] **步骤 1：在 store.ts 中添加 CustomFont 类型和 customFonts 字段**

将 `src/store.ts` 完整替换为：

```typescript
import { reactive, type InjectionKey } from 'vue';
import type { CustomFont } from './services/customFonts';

export interface AppState {
  selectedFont: string;
  fontSize: number;
  theme: 'dark' | 'light';
  activeSnippet: string;
  customFonts: CustomFont[];
}

export const storeKey: InjectionKey<AppState> = Symbol('store');

export const store = reactive<AppState>({
  selectedFont: 'Fira Code',
  fontSize: 14,
  theme: 'dark',
  activeSnippet: 'javascript',
  customFonts: [],
});
```

- [ ] **步骤 2：在 App.vue 中添加 onMounted 恢复自定义字体**

将 `src/App.vue` 完整替换为：

```vue
<script setup lang="ts">
import { provide, onMounted } from 'vue';
import { store, storeKey } from './store';
import { loadAllFonts, loadFontToDocument } from './services/customFonts';
import AppLayout from './components/AppLayout.vue';

provide(storeKey, store);

onMounted(async () => {
  try {
    const fonts = await loadAllFonts();
    store.customFonts = fonts;
    for (const font of fonts) {
      try {
        await loadFontToDocument(font);
      } catch {
        // 该字体加载失败（文件损坏等），跳过但保留记录
      }
    }
  } catch {
    // IndexedDB 不可用（Safari 私有模式等），降级为空列表
  }
});
</script>

<template>
  <AppLayout />
</template>
```

- [ ] **步骤 3：验证类型检查**

```bash
npx vue-tsc --noEmit
```

预期：无类型错误。

- [ ] **步骤 4：Commit**

```bash
git add src/store.ts src/App.vue
git commit -m "feat: add customFonts to store and App.vue init logic"
```

---

### 任务 4：创建 AddFontModal 组件

**文件：**
- 创建：`src/components/sidebar/AddFontModal.vue`

- [ ] **步骤 1：创建 AddFontModal.vue 组件**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported'): void;
}>();

const activeTab = ref<'url' | 'file'>('url');
const urlInput = ref('');
const nameInput = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const error = ref('');

watch(() => props.show, (val) => {
  if (val) {
    urlInput.value = '';
    nameInput.value = '';
    error.value = '';
    loading.value = false;
  }
});

function closeModal() {
  if (loading.value) return;
  emit('close');
}

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal();
}

async function handleImport() {
  error.value = '';

  if (activeTab.value === 'url') {
    const url = urlInput.value.trim();
    if (!url) {
      error.value = '请输入字体链接';
      return;
    }
    loading.value = true;
    try {
      const { addFontFromUrl } = await import('../../services/customFonts');
      const { store } = await import('../../store');
      const font = await addFontFromUrl(url, nameInput.value.trim() || undefined);
      store.customFonts.push(font);
      store.selectedFont = font.name;
      emit('imported');
      emit('close');
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '导入失败，请检查链接是否正确';
    } finally {
      loading.value = false;
    }
  } else {
    const file = fileInput.value?.files?.[0];
    if (!file) {
      error.value = '请选择字体文件';
      return;
    }
    loading.value = true;
    try {
      const { addFontFromFile } = await import('../../services/customFonts');
      const { store } = await import('../../store');
      const font = await addFontFromFile(file, nameInput.value.trim() || undefined);
      store.customFonts.push(font);
      store.selectedFont = font.name;
      emit('imported');
      emit('close');
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '导入失败，请检查文件格式';
    } finally {
      loading.value = false;
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      @click.self="closeModal"
      @keydown="handleEsc"
    >
      <div class="modal" role="dialog" aria-labelledby="modal-title">
        <h3 id="modal-title" class="modal-title">添加自定义字体</h3>

        <div class="tab-bar">
          <button
            :class="['tab', { active: activeTab === 'url' }]"
            @click="activeTab = 'url'"
          >
            网站字体
          </button>
          <button
            :class="['tab', { active: activeTab === 'file' }]"
            @click="activeTab = 'file'"
          >
            本地字体
          </button>
        </div>

        <div class="modal-body">
          <!-- URL Tab -->
          <div v-if="activeTab === 'url'" class="tab-content">
            <label class="field-label">字体链接</label>
            <input
              v-model="urlInput"
              type="url"
              class="field-input"
              placeholder="https://fonts.googleapis.com/css2?family=..."
              :disabled="loading"
            />
            <p class="field-hint">
              支持 Google Fonts 链接或直链 .woff2/.ttf/.otf 文件
            </p>
          </div>

          <!-- File Tab -->
          <div v-if="activeTab === 'file'" class="tab-content">
            <label class="field-label">字体文件</label>
            <input
              ref="fileInput"
              type="file"
              accept=".woff2,.ttf,.otf,.woff"
              class="field-input"
              :disabled="loading"
            />
            <p class="field-hint">
              支持 .woff2 / .ttf / .otf / .woff 格式
            </p>
          </div>

          <!-- Name Input (shared) -->
          <label class="field-label">字体名称（可选）</label>
          <input
            v-model="nameInput"
            type="text"
            class="field-input"
            placeholder="留空则自动检测"
            :disabled="loading"
          />

          <!-- Error -->
          <p v-if="error" class="error-msg">{{ error }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal" :disabled="loading">
            取消
          </button>
          <button class="btn-import" @click="handleImport" :disabled="loading">
            {{ loading ? '导入中...' : '导入字体' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fefcf5;
  border-radius: 20px;
  padding: 28px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #794f27;
  margin: 0;
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: #f0ebd8;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #a0936e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.tab.active {
  background: #19c8b9;
  color: #fff;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #d4c9b4;
  border-radius: 12px;
  font-size: 13px;
  color: #725d42;
  background: #fffdf7;
  transition: border-color 0.15s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: #19c8b9;
}

.field-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-hint {
  font-size: 11px;
  color: #a0936e;
  margin: 0;
}

.error-msg {
  font-size: 12px;
  color: #d95b5b;
  margin: 0;
  white-space: pre-wrap;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.btn-cancel {
  padding: 10px 20px;
  border: 2px solid #d4c9b4;
  border-radius: 50px;
  background: transparent;
  color: #a0936e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-cancel:hover:not(:disabled) {
  border-color: #19c8b9;
  color: #19c8b9;
}

.btn-import {
  padding: 10px 20px;
  border: none;
  border-radius: 50px;
  background: #19c8b9;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-import:hover:not(:disabled) {
  background: #15b0a3;
}

.btn-import:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

- [ ] **步骤 2：验证类型检查**

```bash
npx vue-tsc --noEmit
```

预期：无类型错误。

- [ ] **步骤 3：Commit**

```bash
git add src/components/sidebar/AddFontModal.vue
git commit -m "feat: add AddFontModal component with URL/file upload tabs"
```

---

### 任务 5：更新 FontList — 渲染自定义字体分组 + 添加按钮 + 删除功能

**文件：**
- 修改：`src/components/sidebar/FontList.vue`（完整替换）

- [ ] **步骤 1：完整替换 FontList.vue**

```vue
<script setup lang="ts">
import { inject } from 'vue';
import { fonts } from '../../data/fonts';
import { storeKey } from '../../store';
import { deleteFont } from '../../services/customFonts';

const store = inject(storeKey)!;

const emit = defineEmits<{
  (e: 'addFont'): void;
}>();

function selectFont(name: string) {
  store.selectedFont = name;
}

function findCustomByName(name: string) {
  return store.customFonts.find((f) => f.name === name);
}

async function handleDelete(name: string) {
  const font = findCustomByName(name);
  if (!font) return;
  try {
    await deleteFont(font.id, font.fontFamily);
  } catch {
    // IndexedDB 删除失败不影响 UI 状态
  }
  const idx = store.customFonts.findIndex((f) => f.id === font.id);
  if (idx !== -1) {
    store.customFonts.splice(idx, 1);
    if (store.selectedFont === name) {
      store.selectedFont = fonts[0].name;
    }
  }
}
</script>

<template>
  <div class="font-list">
    <!-- Custom Fonts Section -->
    <template v-if="store.customFonts.length > 0">
      <div class="section-label">自定义字体</div>
      <button
        v-for="font in store.customFonts"
        :key="font.id"
        :class="['font-item', 'custom-item', { active: store.selectedFont === font.name }]"
        @click="selectFont(font.name)"
        :aria-pressed="store.selectedFont === font.name"
      >
        <span class="font-name">{{ font.name }}</span>
        <span
          class="delete-btn"
          @click.stop="handleDelete(font.name)"
          title="删除字体"
          tabindex="0"
          @keydown.enter.prevent="handleDelete(font.name)"
          @keydown.space.prevent="handleDelete(font.name)"
        >&times;</span>
      </button>
    </template>

    <!-- Built-in Fonts Section -->
    <div class="section-label">内置字体</div>
    <button
      v-for="font in fonts"
      :key="font.id"
      :class="['font-item', { active: store.selectedFont === font.name }]"
      @click="selectFont(font.name)"
      :aria-pressed="store.selectedFont === font.name"
    >
      {{ font.name }}
    </button>

    <!-- Add Font Button -->
    <button class="add-font-btn" @click="emit('addFont')">
      + 添加字体
    </button>
  </div>
</template>

<style scoped>
.font-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 4px 2px;
  margin-top: 4px;
}

.font-item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #725d42;
  text-align: left;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.font-item:hover {
  background: rgba(25, 200, 185, 0.1);
}

.font-item.active {
  background: #19c8b9;
  color: #fff;
}

.font-item:focus-visible {
  outline: 2px solid #19c8b9;
  outline-offset: -2px;
}

.custom-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.font-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  flex-shrink: 0;
  margin-left: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  color: #a0936e;
  transition: all 0.15s ease;
}

.custom-item:not(.active) .delete-btn:hover {
  background: rgba(217, 91, 91, 0.15);
  color: #d95b5b;
}

.custom-item.active .delete-btn {
  color: rgba(255, 255, 255, 0.7);
}

.custom-item.active .delete-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.add-font-btn {
  display: block;
  width: 100%;
  border: 2px dashed #19c8b9;
  background: transparent;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #19c8b9;
  text-align: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  margin-top: 4px;
}

.add-font-btn:hover {
  background: rgba(25, 200, 185, 0.08);
}

.add-font-btn:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
```

- [ ] **步骤 2：验证类型检查**

```bash
npx vue-tsc --noEmit
```

预期：无类型错误。

- [ ] **步骤 3：Commit**

```bash
git add src/components/sidebar/FontList.vue
git commit -m "feat: add custom font section, delete, and add button to FontList"
```

---

### 任务 6：更新 Sidebar、FontInfo — 接入弹窗和自定义字体信息

**文件：**
- 修改：`src/components/sidebar/Sidebar.vue`（第 1-67 行）
- 修改：`src/components/sidebar/FontInfo.vue`（第 1-67 行）

- [ ] **步骤 1：在 Sidebar.vue 中接入 AddFontModal**

将 `src/components/sidebar/Sidebar.vue` 完整替换为：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import FontList from './FontList.vue';
import FontSizeSlider from './FontSizeSlider.vue';
import ThemeToggle from './ThemeToggle.vue';
import FontInfo from './FontInfo.vue';
import AddFontModal from './AddFontModal.vue';

const showAddModal = ref(false);
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">FontCode</div>
    <div class="sidebar-section">
      <div class="section-label">编程字体</div>
      <FontList @add-font="showAddModal = true" />
    </div>
    <div class="sidebar-section">
      <FontSizeSlider />
    </div>
    <div class="sidebar-section">
      <div class="section-label">主题</div>
      <ThemeToggle />
    </div>
    <div class="sidebar-footer">
      <FontInfo />
    </div>
  </aside>

  <AddFontModal
    :show="showAddModal"
    @close="showAddModal = false"
    @imported="showAddModal = false"
  />
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  background: #f7f3df;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 2px solid #d4c9b4;
  overflow-y: auto;
}

.sidebar-header {
  font-size: 20px;
  font-weight: 700;
  color: #794f27;
  padding: 4px 8px 12px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 4px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 8px;
}
</style>
```

- [ ] **步骤 2：在 FontInfo.vue 中支持显示自定义字体信息**

将 `src/components/sidebar/FontInfo.vue` 完整替换为：

```vue
<script setup lang="ts">
import { inject, computed } from 'vue';
import { Card } from 'animal-island-vue';
import { getFontByName } from '../../data/fonts';
import { storeKey } from '../../store';
import type { CustomFont } from '../../services/customFonts';

const store = inject(storeKey)!;

const builtInInfo = computed(() => getFontByName(store.selectedFont));

const customInfo = computed(() =>
  store.customFonts.find((f) => f.name === store.selectedFont)
);

const currentFont = computed(() => builtInInfo.value ?? customInfo.value ?? null);
</script>

<template>
  <div class="font-info" v-if="currentFont">
    <Card>
      <div class="info-card">
        <div class="info-name">{{ currentFont.name }}</div>
        <template v-if="builtInInfo">
          <div class="info-row">
            <span class="info-label">设计者</span>
            <span class="info-value">{{ builtInInfo.designer }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">许可证</span>
            <span class="info-value">{{ builtInInfo.license }}</span>
          </div>
        </template>
        <div v-else class="custom-tag">自定义字体</div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.font-info {
  width: 100%;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-name {
  font-size: 16px;
  font-weight: 700;
  color: #794f27;
}

.custom-tag {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 50px;
  background: rgba(25, 200, 185, 0.12);
  color: #19c8b9;
  font-size: 11px;
  font-weight: 600;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-label {
  font-size: 10px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 12px;
  font-weight: 500;
  color: #725d42;
  line-height: 1.4;
}
</style>
```

- [ ] **步骤 3：验证类型检查**

```bash
npx vue-tsc --noEmit
```

预期：无类型错误。

- [ ] **步骤 4：Commit**

```bash
git add src/components/sidebar/Sidebar.vue src/components/sidebar/FontInfo.vue
git commit -m "feat: wire AddFontModal into Sidebar and show custom font info"
```

---

### 任务 7：最终验证 — 完整构建

**文件：** 无新建/修改，仅验证

- [ ] **步骤 1：类型检查 + 生产构建**

```bash
npm run build
```

预期：`vue-tsc` 类型检查通过，`vite build` 成功产出 `dist/`。

- [ ] **步骤 2：手动验证清单**

启动 `npm run dev`，在浏览器中验证：

1. 侧边栏显示「内置字体」分组，底部有「+ 添加字体」按钮
2. 点击「+ 添加字体」→ 弹窗打开 → 输入 Google Fonts CSS 链接（如 `https://fonts.googleapis.com/css2?family=Noto+Sans+Mono`）→ 导入成功
3. 自定义字体出现在列表顶部「自定义字体」分组
4. 点击自定义字体 → 代码预览区切换为该字体
5. 底部 FontInfo 卡片显示「自定义字体」标签
6. 点击自定义字体旁的 × 按钮 → 字体从列表中移除
7. 刷新页面 → 自定义字体仍然存在
8. 本地文件上传：弹窗切换「本地字体」Tab → 选择 .ttf/.woff2 文件 → 导入成功

- [ ] **步骤 3：Commit（如有手动验证后的微调）**

```bash
git add -A
git commit -m "chore: final verification and tweaks for custom font feature"
```
