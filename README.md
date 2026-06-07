# FontCode

> 一个开箱即用的在线编程字体预览平台 — 打开网页就能逐款对比、调节字号、切换深浅主题，感受代码里的字体细节。

![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222?logo=github)

[在线演示](https://<your-username>.github.io/fontcode/) · [报告问题](../../issues) · [功能建议](../../issues)

---

## ✨ 核心特性

- 🖋 **8 款精选编程字体** — 涵盖主流开源字体（Fira Code、JetBrains Mono、Cascadia Code、Source Code Pro、IBM Plex Mono、Hack、Inconsolata）与系统字体（Consolas）
- 📥 **自定义字体导入** — 支持 Google Fonts CSS 链接、直链 .woff2/.ttf/.otf/.woff 文件，浏览器本地 IndexedDB 持久化
- 🔠 **实时字号调节** — 12px – 24px 滑块，所见即所得
- 🌗 **双主题切换** — 自研浅色 / 深色代码高亮配色，温暖耐看
- 💻 **多语言代码片段** — JavaScript / TypeScript / Python / JSON / HTML 内置示例，Prism.js 语法高亮
- 🎨 **动森风格 UI** — 基于 [animal-island-vue](https://github.com/anomalyco/animal-island-vue) 的圆润、亲切视觉
- 🚀 **零后端、零配置** — 纯静态站点，单页应用，秒级首屏

---

## 🎬 在线演示

部署到 GitHub Pages 后，访问：

```
https://<your-username>.github.io/fontcode/
```

将 `<your-username>` 替换为你的 GitHub 用户名（详见下方 [部署](#-部署到-github-pages) 一节）。

---

## 🛠️ 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Vue 3（Composition API + `<script setup lang="ts">`） |
| 语言 | TypeScript（strict 模式） |
| 构建 | Vite 5 |
| UI 组件 | [animal-island-vue](https://github.com/anomalyco/animal-island-vue) |
| 代码高亮 | [Prism.js](https://prismjs.com/) |
| 字体来源 | Google Fonts CDN + 本地 `@font-face` |
| 持久化 | IndexedDB（仅自定义字体） |
| 部署 | GitHub Pages（Actions 自动化） |

---

## 📦 快速开始

### 环境要求

- Node.js **≥ 18**
- npm / pnpm / yarn 任选

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/<your-username>/fontcode.git
cd fontcode

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

### 生产构建

```bash
npm run build      # 类型检查 + 输出 dist/
npm run preview    # 本地预览构建产物
```

构建脚本会先跑 `vue-tsc` 做严格类型检查，再交给 Vite 打包；类型错误会阻断构建。

---

## 📂 项目结构

```
src/
  store.ts                    # 全局状态（reactive + provide/inject）
  main.ts                     # 入口
  App.vue                     # 根组件
  data/
    fonts.ts                  # 8 款内置字体元数据
    snippets.ts               # 5 段代码片段（JS/TS/Python/JSON/HTML）
  services/
    customFonts.ts            # 自定义字体：URL/文件导入、IndexedDB 存储
  components/
    AppLayout.vue             # 整体两栏布局
    sidebar/                  # 侧边栏
      Sidebar.vue
      FontList.vue            # 字体列表（内置 + 自定义）
      AddFontModal.vue        # 导入字体弹窗
      FontSizeSlider.vue      # 字号滑块
      ThemeToggle.vue         # 主题切换
      FontInfo.vue            # 当前字体元信息
    content/                  # 主区域
      MainContent.vue
      CodeTabs.vue            # 语言标签
      CodePreview.vue         # Prism.js 高亮代码
  styles/
    fonts.css                 # 本地字体 @font-face
    code-themes.css           # 深/浅色高亮主题

public/
  fonts/                      # 本地字体文件（Cascadia Code、Hack）

.github/workflows/
  deploy.yml                  # GitHub Pages 自动部署
```

---

## ➕ 自定义字体

应用支持三种方式导入任意编程字体：

| 来源 | 操作 | 说明 |
|---|---|---|
| **Google Fonts 链接** | 粘贴 `https://fonts.googleapis.com/css2?family=...` | 自动解析 CSS、下载首个 woff2，识别字体名 |
| **字体文件直链** | 粘贴 .woff2/.ttf/.otf/.woff 的 URL | 15s 超时，下载到本地 |
| **本地文件** | 拖拽 / 选择 .woff2/.ttf/.otf/.woff | FileReader 读取 ArrayBuffer |

导入后会：

1. 通过 `FontFace` API 注入到当前文档
2. 持久化到 IndexedDB（`fontcode.custom-fonts` 对象库）
3. 出现在侧边栏「自定义字体」分组，可一键删除

> 提示：Safari 隐私模式下 IndexedDB 不可用，应用会优雅降级为空列表。

---

## 🔧 扩展指南

### 新增内置字体

1. 把字体文件放到 `public/fonts/`，在 `src/styles/fonts.css` 注册 `@font-face`
2. 编辑 `src/data/fonts.ts`，在 `fonts` 数组追加条目：

   ```ts
   {
     id: 'my-font',
     name: 'My Font',
     fontFamily: '"My Font", monospace',
     designer: '...',
     license: 'SIL Open Font License 1.1',
     source: 'local',  // 'google' | 'local' | 'system'
   }
   ```

3. 若字体来自 Google Fonts，在 `index.html` 头部追加 `<link>` 标签

### 新增代码片段

编辑 `src/data/snippets.ts`，追加一个 `Snippet` 对象即可。新语言需要在 `src/components/content/CodePreview.vue:4-8` 同步注册对应 Prism 组件。

---

## 🚀 部署到 GitHub Pages

本仓库已包含 `.github/workflows/deploy.yml`，**推送 `main` 分支即自动部署**，无需任何额外配置。

### 方式 A：GitHub Actions 自动部署（✅ 推荐）

工作流已配置好（`actions/checkout` → `setup-node` → `npm ci` → `npm run build` → `actions/deploy-pages`）。

#### 一次性设置

1. 在 GitHub 仓库页面进入 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 推送代码到 `main` 分支：

   ```bash
   git add .
   git commit -m "feat: init FontCode"
   git push origin main
   ```

4. 切到 **Actions** 标签页，等待 `Deploy to GitHub Pages` 工作流变绿
5. 几分钟后，访问 `https://<your-username>.github.io/fontcode/`

> 仓库名如果不是 `fontcode`（如 `FontCode`），链接里的仓库名也要对应替换，Vite 的 `base: './'` 已使用相对路径，无需改动配置。

#### 后续更新

```bash
git add .
git commit -m "feat: 你的改动说明"
git push
# → Actions 自动重新部署
```

### 方式 B：本地构建 + 推送到 `gh-pages` 分支

若你不想用 Actions，可手动部署：

```bash
# 1. 安装 gh-pages 工具
npm i -D gh-pages

# 2. 在 package.json 的 scripts 里加：
#    "deploy": "npm run build && gh-pages -d dist"

# 3. 执行
npm run deploy
```

然后在 **Settings → Pages** 中把 Source 改为 **`gh-pages` 分支 / root** 即可。

### 自定义域名（可选）

1. 在仓库根目录创建 `CNAME` 文件，写入你的域名（如 `font.example.com`）
2. 域名 DNS 添加 `CNAME` 记录指向 `<your-username>.github.io`
3. 在 **Settings → Pages → Custom domain** 填写并勾选 **Enforce HTTPS**

---

## 🌐 浏览器兼容性

- Chrome / Edge / Firefox / Safari 最近 2 个大版本
- 移动端浏览器可用，但侧边栏在窄屏下需要横向滚动
- 自定义字体导入依赖 `IndexedDB` 与 `FontFace` API，老旧浏览器不可用

---

## 📄 许可证

本项目代码采用 [MIT](./LICENSE) 许可证。

收录的开源字体遵循各自的许可证（多为 [SIL Open Font License 1.1](https://scripts.sil.org/OFL)），详见 `src/data/fonts.ts` 与各字体官网。

---

## 🙏 致谢

- [Vue 3](https://vuejs.org/) — 渐进式前端框架
- [Vite](https://vitejs.dev/) — 下一代前端构建工具
- [Prism.js](https://prismjs.com/) — 轻量语法高亮库
- [animal-island-vue](https://github.com/anomalyco/animal-island-vue) — 动森风格 UI 组件
- [Fira Code](https://github.com/tonsky/FiraCode) / [JetBrains Mono](https://www.jetbrains.com/lp/mono/) / [Cascadia Code](https://github.com/microsoft/cascadia-code) / [Source Code Pro](https://github.com/adobe-fonts/source-code-pro) / [IBM Plex Mono](https://github.com/IBM/plex) / [Hack](https://sourcefoundry.org/hack/) / [Inconsolata](https://github.com/googlefonts/Inconsolata) — 收录的开源编程字体及其设计者

---

如果 FontCode 帮你找到了心仪的编程字体，欢迎点个 ⭐ Star！
