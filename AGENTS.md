# FontCode — AGENTS.md

## 项目概述

编程字体预览单页应用。Vue 3 + Vite + TypeScript，无后端。

## 命令

```bash
npm run dev      # 启动 Vite 开发服务器
npm run build    # vue-tsc 类型检查 + vite build（类型错误会阻断构建）
npm run preview  # 预览生产构建产物
```

## 架构

```
src/
  store.ts          # 全局状态：reactive() + provide/inject，非 Pinia
  data/fonts.ts     # 字体元数据（8 款字体，部分 Google CDN、部分本地 @font-face）
  data/snippets.ts  # 代码片段数据（JS/TS/Python/JSON/HTML）
  components/
    sidebar/        # 侧边栏：字体列表、字号滑块、主题切换、字体信息
    content/        # 主区域：语言标签切换、Prism.js 语法高亮代码预览
  styles/
    fonts.css       # 本地字体 @font-face（Cascadia Code, Hack）
    code-themes.css # 深色/浅色代码高亮主题（Prism token 颜色）
```

- 状态通过 `src/store.ts:10` 的 `storeKey`（InjectionKey）以 `provide/inject` 注入，不是 Pinia/Vuex。
- `@/` 路径别名 → `./src/`（`tsconfig.json:15`，Vite 自动解析）。
- Vite `base: './'`，产物使用相对路径，适配静态部署。
- 组件库：`animal-island-vue`，在 `main.ts` 全局导入样式。

## 关键约定

- 所有 `.vue` 组件使用 `<script setup lang="ts">`。
- TypeScript 严格模式已开启。
- 本地字体文件应放在 `public/fonts/` 目录，在 `src/styles/fonts.css` 中注册。
- 新增字体需同时更新 `src/data/fonts.ts` 并在 `index.html` 中添加 Google Fonts `<link>`。
- 新增语言需注册对应 Prism 语言组件（`src/components/content/CodePreview.vue:4-8`）。

## 环境说明

- 无测试框架、无 lint/formatter 脚本、无 CI。
- `.opencode/`、`.codegraph/` 已 gitignore。

## codegraph

  - 分析项目结构、调用链、影响范围时，优先使用 codegraph MCP 工具
  - 大改动前先用 codegraph 查影响范围