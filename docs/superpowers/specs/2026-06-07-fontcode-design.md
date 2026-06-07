# FontCode — 轻量编程字体预览平台 · 设计文档

**日期**: 2026-06-07
**状态**: 已确认

---

## 1. 项目概述

FontCode 是一个开箱即用的在线编程字体预览 Web 应用。开发者在选择编程字体时无需反复配置编辑器，打开网页即可切换字体、调节字号、切换主题，直观感受字体在代码中的渲染效果。

### 核心价值

- 零配置，打开即用
- 5-8 种精选主流编程字体
- 动森风格（Animal Crossing）视觉设计，温暖亲切
- 纯前端静态站点，GitHub Pages 部署

---

## 2. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Vue 3 (Composition API) + TypeScript | 组件化、类型安全 |
| 构建 | Vite | 快速 HMR，零配置 |
| UI 库 | animal-island-vue | 动森风格组件（Button, Card, Switch 等） |
| 代码高亮 | Prism.js | 轻量、多语言支持、可定制主题 |
| 字体加载 | Google Fonts API + 本地 @font-face | 混合来源，覆盖全部目标字体 |
| 部署 | GitHub Pages | 静态站点，免费托管 |

---

## 3. 功能清单

### v1.0 核心功能

1. **字体列表** — 左侧边栏展示 5-8 种编程字体，点击即时切换预览
2. **字号调节** — 滑块控件，范围 12px–24px，实时生效
3. **主题切换** — 浅色/深色两种代码配色主题
4. **代码片段** — 预设 4-5 段代码片段（JavaScript、TypeScript、Python、JSON、HTML），tab 切换
5. **字体信息** — 侧边栏底部显示当前选中字体的名称、设计师、许可证

### 暂不纳入 v1.0

- 连字（ligatures）预览开关
- 易混字符高亮标注
- 行高/字间距调节
- 多字体并排对比
- 自定义代码编辑
- 字体搜索/筛选

---

## 4. 收录字体（8 种）

| 字体 | 来源 | 备注 |
|---|---|---|
| Fira Code | Google Fonts | 连字丰富，社区最流行 |
| JetBrains Mono | Google Fonts | 易认性极佳，字母区分度高 |
| Cascadia Code | 本地 @font-face | 微软出品，Windows Terminal 默认 |
| Source Code Pro | Google Fonts | Adobe 出品，经典等宽 |
| IBM Plex Mono | Google Fonts | IBM 出品，现代工业风格 |
| Hack | 本地 @font-face | 经典黑客字体，清晰锐利 |
| Inconsolata | Google Fonts | 经典等宽，复古风格 |
| Consolas | 系统字体 | Windows 经典，macOS 以本地文件回退 |

> Google Fonts 上有的字体通过 `<link>` 或 `@import` 加载；不在 Google Fonts 上的（Cascadia Code、Hack）预打包到 `/public/fonts/` 目录，通过 @font-face 引用。Consolas 优先使用系统字体栈回退。

---

## 5. UI 布局

采用 **左侧边栏 + 右侧内容区** 的 IDE 经典布局。

### 左侧边栏（260px 固定宽度）

```
┌─────────────────┐
│   🏝 FontCode   │  ← 应用标题
│                 │
│   编程字体       │  ← 分类标签
│ ┌─────────────┐ │
│ │ Fira Code   │ │  ← 选中态：青绿底色白字
│ │ JetBrains M.│ │  ← 未选中：透明底深色字
│ │ Cascadia C. │ │
│ │ Source Code │ │
│ │ IBM Plex M. │ │
│ │ Hack        │ │
│ │ Inconsolata │ │
│ │ Consolas    │ │
│ └─────────────┘ │
│                 │
│ 字号 · 14px     │  ← 滑块调节
│ ──●────────     │
│                 │
│ 主题            │
│ [☀️浅色] [🌙深色] │  ← 切换按钮
│                 │
│ ┌─────────────┐ │
│ │ 字体信息     │ │  ← 当前字体详情卡片
│ │ Fira Code   │ │
│ │ Nikita P.   │ │
│ │ OFL 1.1     │ │
│ └─────────────┘ │
└─────────────────┘
```

### 右侧内容区

```
┌─────────────────────────────────┐
│ [JS] [TS] [Python] [JSON] [HTML]│  ← 代码片段 tab 切换
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │  代码预览区                  │ │  ← 深色背景 (#2b2118)
│ │  语法高亮 + 当前字体渲染     │ │     浅色字 + 语法着色
│ │                             │ │     大圆角 20px
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 视觉规范（源自 animal-island-vue）

- **主背景**: #f8f8f0（暖羊皮纸色）
- **侧边栏背景**: #f7f3df（略暖）
- **强调色**: #19c8b9（青绿色 mint teal）
- **主文字**: #794f27（标题）、#725d42（正文）
- **圆角**: 按钮/选项 50px 胶囊形，卡片 16-20px
- **按钮按压感**: 3D box-shadow 堆叠效果（primary 按钮）
- **字体**: Nunito（英文）+ Noto Sans SC（中文）
- **代码区**: 深色底 #2b2118，浅色等宽字体渲染

---

## 6. 组件架构

```
App.vue
└── AppLayout.vue (flex 左右布局容器)
    ├── Sidebar.vue (左侧栏容器)
    │   ├── FontList.vue (字体列表，高亮选中态)
    │   ├── FontSizeSlider.vue (字号滑块)
    │   ├── ThemeToggle.vue (浅色/深色切换)
    │   └── FontInfo.vue (字体信息卡片)
    └── MainContent.vue (右侧容器)
        ├── CodeTabs.vue (代码片段 tab 栏)
        └── CodePreview.vue (Prism.js 语法高亮渲染)
```

### 数据流

全局状态通过 Vue 3 `provide/inject` 或单个 `reactive()` store 对象管理：

```
store = {
  selectedFont: 'Fira Code',    // 当前字体
  fontSize: 14,                 // 字号 (px)
  theme: 'dark',                // 'dark' | 'light'
  activeSnippet: 'javascript',  // 当前代码片段 key
}
```

- `FontList` 写 `selectedFont` → `CodePreview` 读，动态切换 `font-family`
- `FontSizeSlider` 写 `fontSize` → `CodePreview` 读，动态切换 `font-size`
- `ThemeToggle` 写 `theme` → `CodePreview` 读，切换代码区配色
- `CodeTabs` 写 `activeSnippet` → `CodePreview` 读，切换代码内容

字体通过 `@font-face` 预定义，切换字体时仅改变 CSS `font-family`，无需重新加载文件。

---

## 7. 代码片段内容

| Key | 语言 | 内容要点 |
|---|---|---|
| `javascript` | JavaScript | 箭头函数、模板字符串、解构、Promise |
| `typescript` | TypeScript | 类型标注、interface、泛型 |
| `python` | Python | 函数定义、列表推导、with 语句 |
| `json` | JSON | 嵌套对象、数组、典型配置文件 |
| `html` | HTML | 语义标签、属性、嵌套结构 |

每段覆盖常见编程符号：`=>` `!=` `===` `->` `>=` `<=` `&&` `||` `/**/` `//`，便于直观感受连字与符号渲染。

---

## 8. 字体加载策略

```
启动时：
  1. 通过 <link> 预加载 Google Fonts 上的 5 种字体（异步，不阻塞渲染）
  2. 通过 @font-face 注册本地字体文件（/public/fonts/）
  3. 系统字体（Consolas）直接通过 font-family 栈引用，无需加载

切换字体时：
  仅修改 CodePreview 的 CSS font-family，浏览器从已加载字体中即时渲染
```

---

## 9. 路由

单页，无路由。所有内容在一个页面内通过状态驱动切换。

---

## 10. 非功能需求

- **性能**: FCP < 1.5s（字体异步加载不阻塞页面渲染）
- **响应式**: 桌面端优先（1200px+），移动端降级为上下布局
- **无障碍**: 语义化 HTML、键盘可操作字体列表、滑块支持 arrow key
- **浏览器**: 支持 Chrome/Firefox/Safari/Edge 近两个大版本

---

## 11. 项目结构

```
FontCode/
├── public/
│   └── fonts/                  # 本地字体文件 (Cascadia Code, Hack)
├── src/
│   ├── main.ts                 # 入口，注册 animal-island-vue
│   ├── App.vue                 # 根组件
│   ├── store.ts                # 全局状态 (reactive store)
│   ├── data/
│   │   ├── fonts.ts            # 字体列表配置
│   │   └── snippets.ts         # 代码片段数据
│   ├── components/
│   │   ├── AppLayout.vue
│   │   ├── sidebar/
│   │   │   ├── Sidebar.vue
│   │   │   ├── FontList.vue
│   │   │   ├── FontSizeSlider.vue
│   │   │   ├── ThemeToggle.vue
│   │   │   └── FontInfo.vue
│   │   └── content/
│   │       ├── MainContent.vue
│   │       ├── CodeTabs.vue
│   │       └── CodePreview.vue
│   └── styles/
│       └── code-themes.css     # Prism 浅色/深色主题覆盖
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 12. 后续迭代方向（不在 v1.0 范围）

- v1.1: 连字开关、易混字符高亮
- v1.2: 并排双字体对比
- v1.3: 自定义字体上传
- v1.4: 用户偏好本地持久化
