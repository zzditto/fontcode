# FontCode 实现计划

> **针对 agent 工作器：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 来逐任务实现本计划。各步骤使用 checkbox（`- [ ]`）语法进行跟踪。

**目标：** 构建 FontCode —— 一个采用动物森友会风格设计的开源在线编程字体预览 Web 应用。

**架构：** Vue 3 + TypeScript + Vite SPA。左侧边栏（260px 固定宽度）+ 右侧内容区 IDE 布局。通过 `provide/inject` 实现全局响应式状态。animal-island-vue 用于 UI 组件，Prism.js 用于语法高亮。

**技术栈：** Vue 3（Composition API），TypeScript，Vite，animal-island-vue，Prism.js，Google Fonts API，@font-face

---

## 任务 1：项目脚手架

**文件：**
- 创建：`package.json`
- 创建：`index.html`
- 创建：`vite.config.ts`
- 创建：`tsconfig.json`
- 创建：`tsconfig.node.json`
- 创建：`src/vite-env.d.ts`

- [ ] **步骤 1：创建 package.json**

```json
{
  "name": "fontcode",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "animal-island-vue": "^0.2.1",
    "prismjs": "^1.29.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "@types/prismjs": "^1.26.4",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^2.0.0"
  }
}
```

- [ ] **步骤 2：安装依赖**

```bash
npm install
```

- [ ] **步骤 3：创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FontCode — 编程字体预览</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Source+Code+Pro:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Inconsolata:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **步骤 4：创建 vite.config.ts**

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: './',
});
```

- [ ] **步骤 5：创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **步骤 6：创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **步骤 7：创建 src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { Component } from 'vue';
  const component: Component;
  export default component;
}
```

- [ ] **步骤 8：验证脚手架是否正常**

```bash
npx vite build
```
预期：构建成功（尽管应用可能为空）。

---

## 任务 2：全局状态

**文件：**
- 创建：`src/store.ts`

- [ ] **步骤 1：创建 src/store.ts**

```ts
import { reactive, type InjectionKey } from 'vue';

export interface AppState {
  selectedFont: string;
  fontSize: number;
  theme: 'dark' | 'light';
  activeSnippet: string;
}

export const storeKey: InjectionKey<AppState> = Symbol('store');

export const store = reactive<AppState>({
  selectedFont: 'Fira Code',
  fontSize: 14,
  theme: 'dark',
  activeSnippet: 'javascript',
});
```

---

## 任务 3：数据文件 — 字体配置

**文件：**
- 创建：`src/data/fonts.ts`

- [ ] **步骤 1：创建 src/data/fonts.ts**

```ts
export interface FontInfo {
  id: string;
  name: string;
  fontFamily: string;
  designer: string;
  license: string;
  source: 'google' | 'local' | 'system';
}

export const fonts: FontInfo[] = [
  {
    id: 'fira-code',
    name: 'Fira Code',
    fontFamily: '"Fira Code", monospace',
    designer: 'Nikita Prokopov',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    fontFamily: '"JetBrains Mono", monospace',
    designer: 'JetBrains / Philipp Nurullin',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    fontFamily: '"Cascadia Code", monospace',
    designer: 'Microsoft (Aaron Bell)',
    license: 'SIL Open Font License 1.1',
    source: 'local',
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    fontFamily: '"Source Code Pro", monospace',
    designer: 'Adobe (Paul D. Hunt)',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    fontFamily: '"IBM Plex Mono", monospace',
    designer: 'IBM / Mike Abbink',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'hack',
    name: 'Hack',
    fontFamily: '"Hack", monospace',
    designer: 'Chris Simpkins',
    license: 'MIT License',
    source: 'local',
  },
  {
    id: 'inconsolata',
    name: 'Inconsolata',
    fontFamily: '"Inconsolata", monospace',
    designer: 'Raph Levien',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'consolas',
    name: 'Consolas',
    fontFamily: 'Consolas, "Liberation Mono", "Courier New", monospace',
    designer: 'Microsoft (Lucas de Groot)',
    license: 'Proprietary（随 Windows/macOS 捆绑）',
    source: 'system',
  },
];

export function getFontByName(name: string): FontInfo | undefined {
  return fonts.find((f) => f.name === name);
}
```

---

## 任务 4：数据文件 — 代码片段

**文件：**
- 创建：`src/data/snippets.ts`

- [ ] **步骤 1：创建 src/data/snippets.ts**

```ts
export interface Snippet {
  key: string;
  label: string;
  language: string;
  code: string;
}

export const snippets: Snippet[] = [
  {
    key: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    code: `// 现代 JavaScript — 箭头函数、模板字符串、解构
const greet = (name) => \`Hello, \${name}!\`;

const user = { name: 'Alice', role: 'developer' };
const { name, role } = user;

const fetchData = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  return res.json();
};

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);

console.log(greet(name), role, doubled, evens);`,
  },
  {
    key: 'typescript',
    label: 'TypeScript',
    language: 'typescript',
    code: `// TypeScript — 类型注解、接口、泛型
interface User {
  id: number;
  name: string;
  email?: string;
}

type Role = 'admin' | 'editor' | 'viewer';

function getUser<T extends User>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}

class DataStore<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): readonly T[] {
    return this.items;
  }
}

const store = new DataStore<User>();
store.add({ id: 1, name: 'Alice', email: 'alice@example.com' });
console.log(getUser(store.getAll(), 1)?.name ?? 'Not found');`,
  },
  {
    key: 'python',
    label: 'Python',
    language: 'python',
    code: `# Python — 函数、列表推导式、with 语句
def fibonacci(n: int) -> list[int]:
    """生成前 n 个斐波那契数。"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

# 列表推导式
squares = [x ** 2 for x in range(10) if x % 2 == 0]

# With 语句（上下文管理器）
with open('config.json', 'r') as f:
    config = json.load(f)

# 装饰器
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f'{func.__name__} took {time.time() - start:.3f}s')
        return result
    return wrapper

print(fibonacci(10))
print(squares)`,
  },
  {
    key: 'json',
    label: 'JSON',
    language: 'json',
    code: `{
  "name": "fontcode",
  "version": "1.0.0",
  "description": "编程字体预览平台",
  "fonts": [
    "Fira Code",
    "JetBrains Mono",
    "Cascadia Code",
    "Source Code Pro",
    "IBM Plex Mono",
    "Hack",
    "Inconsolata",
    "Consolas"
  ],
  "theme": {
    "dark": {
      "background": "#2b2118",
      "foreground": "#e8d5bc"
    },
    "light": {
      "background": "#f8f8f0",
      "foreground": "#725d42"
    }
  },
  "settings": {
    "fontSize": 14,
    "tabSize": 2,
    "ligatures": true
  }
}`,
  },
  {
    key: 'html',
    label: 'HTML',
    language: 'html',
    code: `<!-- HTML5 — 语义标签、属性、嵌套结构 -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FontCode — Programming Font Preview</title>
</head>
<body>
  <header class="app-header">
    <h1>FontCode 🏝</h1>
    <nav aria-label="Main">
      <a href="#fonts">Fonts</a>
      <a href="#about">About</a>
    </nav>
  </header>
  <main>
    <section id="fonts" class="font-grid">
      <article class="font-card" data-font="fira-code">
        <h2>Fira Code</h2>
        <p>Designed by Nikita Prokopov</p>
      </article>
    </section>
  </main>
  <footer>&copy; 2026 FontCode</footer>
</body>
</html>`,
  },
];
```

---

## 任务 5：字体加载

**文件：**
- 创建：`src/styles/fonts.css`
- 创建：`public/fonts/.gitkeep`
- 修改：`src/main.ts`（创建）

- [ ] **步骤 1：创建 src/styles/fonts.css — 本地字体 @font-face 声明**

```css
/* Cascadia Code */
@font-face {
  font-family: 'Cascadia Code';
  src: url('/fonts/CascadiaCode.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Hack */
@font-face {
  font-family: 'Hack';
  src: url('/fonts/Hack-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **步骤 2：下载 Cascadia Code 字体文件**

从 https://github.com/microsoft/cascadia-code/releases/latest 下载到 `public/fonts/CascadiaCode.woff2`。

执行：
```bash
# 从 cdn-fonts 下载 Cascadia Code woff2
curl -L -o public/fonts/CascadiaCode.woff2 \
  "https://cdn.jsdelivr.net/gh/microsoft/cascadia-code@main/fonts/woff2/CascadiaCode.woff2"
```

- [ ] **步骤 3：下载 Hack 字体文件**

从 https://github.com/source-foundry/Hack 下载到 `public/fonts/Hack-Regular.woff2`。

执行：
```bash
curl -L -o public/fonts/Hack-Regular.woff2 \
  "https://cdn.jsdelivr.net/gh/source-foundry/Hack@HEAD/build/webfonts/fonts/hack-regular.woff2"
```

- [ ] **步骤 4：创建 src/main.ts**

```ts
import { createApp } from 'vue';
import 'animal-island-vue/style';
import './styles/fonts.css';
import App from './App.vue';

createApp(App).mount('#app');
```

---

## 任务 6：代码主题 CSS（Prism 深色/浅色主题 + 代码区域样式）

**文件：**
- 创建：`src/styles/code-themes.css`

- [ ] **步骤 1：创建 src/styles/code-themes.css**

```css
/* 代码预览区域 — 共享样式 */
.code-preview-wrapper {
  border-radius: 20px;
  overflow: hidden;
  font-family: inherit;
  font-size: inherit;
}

.code-preview-wrapper pre {
  margin: 0;
  padding: 24px 28px;
  tab-size: 2;
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre;
  min-height: 320px;
  font-family: inherit;
  font-size: inherit;
}

/* 深色主题 */
.theme-dark.code-preview-wrapper {
  background: #2b2118;
  border: 1px solid #3d3028;
}

.theme-dark pre {
  color: #e8d5bc;
}

/* 深色主题 token 颜色 */
.theme-dark .token.comment,
.theme-dark .token.prolog,
.theme-dark .token.doctype,
.theme-dark .token.cdata { color: #6b5e50; }

.theme-dark .token.punctuation { color: #d4b896; }

.theme-dark .token.property,
.theme-dark .token.tag,
.theme-dark .token.boolean,
.theme-dark .token.number,
.theme-dark .token.constant,
.theme-dark .token.symbol,
.theme-dark .token.deleted { color: #f0a870; }

.theme-dark .token.selector,
.theme-dark .token.attr-name,
.theme-dark .token.string,
.theme-dark .token.char,
.theme-dark .token.builtin,
.theme-dark .token.inserted { color: #a8d4a0; }

.theme-dark .token.operator,
.theme-dark .token.entity,
.theme-dark .token.url { color: #d4b896; }

.theme-dark .token.atrule,
.theme-dark .token.attr-value,
.theme-dark .token.keyword { color: #d4a0e0; }

.theme-dark .token.function,
.theme-dark .token.class-name { color: #61afef; }

.theme-dark .token.regex,
.theme-dark .token.important,
.theme-dark .token.variable { color: #e8c87a; }

/* 浅色主题 */
.theme-light.code-preview-wrapper {
  background: #f8f8f0;
  border: 1px solid #d4c9b4;
}

.theme-light pre {
  color: #725d42;
}

.theme-light .token.comment,
.theme-light .token.prolog,
.theme-light .token.doctype,
.theme-light .token.cdata { color: #9f927d; }

.theme-light .token.punctuation { color: #8a7b66; }

.theme-light .token.property,
.theme-light .token.tag,
.theme-light .token.boolean,
.theme-light .token.number,
.theme-light .token.constant,
.theme-light .token.symbol,
.theme-light .token.deleted { color: #c94444; }

.theme-light .token.selector,
.theme-light .token.attr-name,
.theme-light .token.string,
.theme-light .token.char,
.theme-light .token.builtin,
.theme-light .token.inserted { color: #5a9e1e; }

.theme-light .token.operator,
.theme-light .token.entity,
.theme-light .token.url { color: #8a7b66; }

.theme-light .token.atrule,
.theme-light .token.attr-value,
.theme-light .token.keyword { color: #b77dee; }

.theme-light .token.function,
.theme-light .token.class-name { color: #11a89b; }

.theme-light .token.regex,
.theme-light .token.important,
.theme-light .token.variable { color: #e59266; }
```

---

## 任务 7：应用根组件（App.vue + AppLayout.vue）

**文件：**
- 创建：`src/App.vue`
- 创建：`src/components/AppLayout.vue`

- [ ] **步骤 1：创建 src/App.vue**

```vue
<script setup lang="ts">
import { provide } from 'vue';
import { store, storeKey } from './store';
import AppLayout from './components/AppLayout.vue';

provide(storeKey, store);
</script>

<template>
  <AppLayout />
</template>
```

- [ ] **步骤 2：创建 src/components/AppLayout.vue**

```vue
<script setup lang="ts">
import Sidebar from './sidebar/Sidebar.vue';
import MainContent from './content/MainContent.vue';
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <MainContent />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f8f8f0;
  font-family: 'Nunito', 'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif;
}
</style>
```

---

## 任务 8：侧边栏组件

**文件：**
- 创建：`src/components/sidebar/Sidebar.vue`

- [ ] **步骤 1：创建 src/components/sidebar/Sidebar.vue**

```vue
<script setup lang="ts">
import FontList from './FontList.vue';
import FontSizeSlider from './FontSizeSlider.vue';
import ThemeToggle from './ThemeToggle.vue';
import FontInfo from './FontInfo.vue';
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">🏝 FontCode</div>
    <div class="sidebar-section">
      <div class="section-label">编程字体</div>
      <FontList />
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

---

## 任务 9：FontList 组件

**文件：**
- 创建：`src/components/sidebar/FontList.vue`

- [ ] **步骤 1：创建 src/components/sidebar/FontList.vue**

```vue
<script setup lang="ts">
import { inject } from 'vue';
import { fonts } from '../../data/fonts';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

function selectFont(name: string) {
  store.selectedFont = name;
}
</script>

<template>
  <div class="font-list">
    <button
      v-for="font in fonts"
      :key="font.id"
      :class="['font-item', { active: store.selectedFont === font.name }]"
      @click="selectFont(font.name)"
      :aria-pressed="store.selectedFont === font.name"
    >
      {{ font.name }}
    </button>
  </div>
</template>

<style scoped>
.font-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
</style>
```

---

## 任务 10：FontSizeSlider 组件

**文件：**
- 创建：`src/components/sidebar/FontSizeSlider.vue`

- [ ] **步骤 1：创建 src/components/sidebar/FontSizeSlider.vue**

```vue
<script setup lang="ts">
import { inject } from 'vue';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

function onInput(e: Event) {
  store.fontSize = Number((e.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="font-size-control">
    <div class="size-label">
      <span>字号</span>
      <span class="size-value">{{ store.fontSize }}px</span>
    </div>
    <input
      type="range"
      :min="12"
      :max="24"
      :value="store.fontSize"
      @input="onInput"
      class="size-slider"
      aria-label="字号调节"
    />
  </div>
</template>

<style scoped>
.font-size-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.size-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #725d42;
  padding: 0 4px;
}

.size-value {
  color: #19c8b9;
  font-weight: 700;
}

.size-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #d4c9b4;
  outline: none;
  cursor: pointer;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #19c8b9;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.size-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.size-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #19c8b9;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.size-slider:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
```

---

## 任务 11：ThemeToggle 组件

**文件：**
- 创建：`src/components/sidebar/ThemeToggle.vue`

- [ ] **步骤 1：创建 src/components/sidebar/ThemeToggle.vue**

```vue
<script setup lang="ts">
import { inject } from 'vue';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

function setTheme(theme: 'dark' | 'light') {
  store.theme = theme;
}
</script>

<template>
  <div class="theme-toggle">
    <button
      :class="['theme-btn', { active: store.theme === 'light' }]"
      @click="setTheme('light')"
      :aria-pressed="store.theme === 'light'"
    >
      ☀️ 浅色
    </button>
    <button
      :class="['theme-btn', { active: store.theme === 'dark' }]"
      @click="setTheme('dark')"
      :aria-pressed="store.theme === 'dark'"
    >
      🌙 深色
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #c4b89e;
  border-radius: 50px;
  background: transparent;
  color: #725d42;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.theme-btn:hover {
  border-color: #19c8b9;
}

.theme-btn.active {
  background: #19c8b9;
  border-color: #19c8b9;
  color: #fff;
}

.theme-btn:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
```

---

## 任务 12：FontInfo 组件

**文件：**
- 创建：`src/components/sidebar/FontInfo.vue`

- [ ] **步骤 1：创建 src/components/sidebar/FontInfo.vue**

```vue
<script setup lang="ts">
import { inject, computed } from 'vue';
import { Card } from 'animal-island-vue';
import { getFontByName } from '../../data/fonts';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

const currentFont = computed(() => getFontByName(store.selectedFont));
</script>

<template>
  <div class="font-info" v-if="currentFont">
    <Card>
      <div class="info-card">
        <div class="info-name">{{ currentFont.name }}</div>
        <div class="info-row">
          <span class="info-label">设计者</span>
          <span class="info-value">{{ currentFont.designer }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">许可证</span>
          <span class="info-value">{{ currentFont.license }}</span>
        </div>
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

---

## 任务 13：MainContent 组件

**文件：**
- 创建：`src/components/content/MainContent.vue`

- [ ] **步骤 1：创建 src/components/content/MainContent.vue**

```vue
<script setup lang="ts">
import CodeTabs from './CodeTabs.vue';
import CodePreview from './CodePreview.vue';
</script>

<template>
  <main class="main-content">
    <CodeTabs />
    <CodePreview />
  </main>
</template>

<style scoped>
.main-content {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  min-width: 0;
}
</style>
```

---

## 任务 14：CodeTabs 组件

**文件：**
- 创建：`src/components/content/CodeTabs.vue`

- [ ] **步骤 1：创建 src/components/content/CodeTabs.vue**

```vue
<script setup lang="ts">
import { inject } from 'vue';
import { snippets } from '../../data/snippets';
import { storeKey } from '../../store';

const store = inject(storeKey)!;
</script>

<template>
  <nav class="code-tabs" role="tablist" aria-label="代码片段选择">
    <button
      v-for="snip in snippets"
      :key="snip.key"
      role="tab"
      :aria-selected="store.activeSnippet === snip.key"
      :class="['tab-btn', { active: store.activeSnippet === snip.key }]"
      @click="store.activeSnippet = snip.key"
    >
      {{ snip.label }}
    </button>
  </nav>
</template>

<style scoped>
.code-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.tab-btn {
  padding: 8px 18px;
  border: 2px solid transparent;
  border-radius: 50px;
  background: transparent;
  color: #9f927d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.tab-btn:hover {
  color: #725d42;
  background: rgba(25, 200, 185, 0.06);
}

.tab-btn.active {
  background: rgba(25, 200, 185, 0.12);
  color: #19c8b9;
  border-color: rgba(25, 200, 185, 0.3);
}

.tab-btn:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
```

---

## 任务 15：CodePreview 组件

**文件：**
- 创建：`src/components/content/CodePreview.vue`

- [ ] **步骤 1：创建 src/components/content/CodePreview.vue**

```vue
<script setup lang="ts">
import { inject, computed } from 'vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import { snippets } from '../../data/snippets';
import { getFontByName } from '../../data/fonts';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

const currentSnippet = computed(() =>
  snippets.find((s) => s.key === store.activeSnippet)
);

const currentFont = computed(() => getFontByName(store.selectedFont));

const highlightedCode = computed(() => {
  if (!currentSnippet.value) return '';
  const lang = Prism.languages[currentSnippet.value.language];
  if (!lang) return currentSnippet.value.code;
  return Prism.highlight(
    currentSnippet.value.code,
    lang,
    currentSnippet.value.language
  );
});

const fontFamily = computed(() => currentFont.value?.fontFamily ?? 'monospace');

const themeClass = computed(() =>
  `theme-${store.theme}`
);
</script>

<template>
  <div
    :class="['code-preview-wrapper', themeClass]"
    :style="{
      fontFamily: fontFamily,
      fontSize: store.fontSize + 'px',
    }"
  >
    <pre><code class="language-plain" v-html="highlightedCode"></code></pre>
  </div>
</template>

<style>
@import '../../styles/code-themes.css';
</style>
```

---

## 任务 16：运行并验证

**文件：**
- 无（验证已有文件）

- [ ] **步骤 1：类型检查**

```bash
npx vue-tsc --noEmit
```
预期：无类型错误。

- [ ] **步骤 2：构建**

```bash
npx vite build
```
预期：构建成功，无错误。

- [ ] **步骤 3：开发服务器**

```bash
npx vite --host
```

验证应用在 http://localhost:5173 渲染，包含以下内容：
- 左侧边栏，含字体列表（8 种字体）
- 字号滑块（12-24px）
- 主题切换（深色/浅色）
- 侧边栏底部的字体信息卡片
- 右侧内容区，含代码片段标签页（JS/TS/Python/JSON/HTML）
- 带语法高亮的代码预览区
- 字体切换、字号调整、主题切换均正常工作

---

## 自查清单

### 规格覆盖：
- 8 种字体的字体列表 → 任务 9（FontList）+ 任务 3（fonts.ts）
- 字号滑块（12-24px）→ 任务 10（FontSizeSlider）
- 主题切换（深色/浅色）→ 任务 11（ThemeToggle）
- 代码片段（5 种语言）→ 任务 4（snippets.ts）+ 任务 14（CodeTabs）+ 任务 15（CodePreview）
- 字体信息卡片 → 任务 12（FontInfo）
- 左侧边栏 + 右侧内容布局 → 任务 8（Sidebar）+ 任务 13（MainContent）+ 任务 7（AppLayout）
- 字体加载策略 → 任务 5（fonts.css、main.ts、字体下载）
- 全局状态 → 任务 2（store.ts）
- 视觉规格（颜色、字号、间距）→ 内嵌于任务 8-15 的组件样式中
- animal-island-vue 集成 → 任务 7（App.vue 导入样式），任务 12（Card 组件）
- Prism.js 高亮 → 任务 15（CodePreview）

### 占位符扫描：
- 无 TBD/TODO
- 所有代码块均完整
- 所有命令均可执行且含有预期输出

### 类型一致性：
- `AppState` 定义于任务 2，用于任务 9-15
- `FontInfo` 定义于任务 3，用于任务 9、12、15
- `Snippet` 定义于任务 4，用于任务 14-15
- 全部组件中 `store` 均一致地注入为 `AppState`
- `getFontByName` 从任务 3 导出，用于任务 12、15
