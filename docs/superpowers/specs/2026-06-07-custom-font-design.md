# 自定义字体功能 — 设计规格

## 概述

允许用户自行导入编程字体的功能。支持两种来源：
1. **网站字体** — 粘贴 Google Fonts CSS 链接或直链 .woff2/.ttf/.otf 文件 URL
2. **本地字体** — 上传本地字体文件

字体持久化存储，刷新页面后保留。导入/删除即时生效，无确认步骤。

## 技术方案

**IndexedDB + FontFace API**

- IndexedDB 存储字体文件二进制（无大小限制）
- FontFace API 动态加载字体到页面（W3C 标准，异步加载）
- 优势：无存储上限、标准 API、完善的加载状态/错误处理

## 数据模型

```typescript
interface CustomFont {
  id: string              // nanoid，唯一标识
  name: string            // 显示名称（用户输入或自动检测）
  fontFamily: string      // CSS font-family 值，如 `"MyFont", monospace`
  source: 'url' | 'file' | 'google-fonts'
  sourceUrl?: string      // 原始 URL（记录来源，便于追溯）
  blobData: ArrayBuffer   // 字体文件二进制
  format: 'woff2' | 'ttf' | 'otf' | 'woff'  // 根据 MIME 类型或扩展名自动判断
  addedAt: number         // Date.now() 时间戳
}
```

## 模块架构

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/services/customFonts.ts` | IndexedDB 读写 + FontFace API 加载 + URL 解析/下载 |
| `src/components/sidebar/AddFontModal.vue` | 添加字体弹窗（双 Tab：网站/本地） |

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/store.ts` | 新增 `customFonts: CustomFont[]` 字段 |
| `src/App.vue` | `onMounted` 时从 IndexedDB 恢复自定义字体到 store |
| `src/components/sidebar/FontList.vue` | 渲染自定义字体分组 + 内置字体分组，「+ 添加字体」按钮 |
| `src/components/sidebar/FontInfo.vue` | 自定义字体显示「自定义字体」标签 |

## CustomFontService 接口设计

```typescript
// src/services/customFonts.ts

/** 从 URL 添加字体（自动判断 Google Fonts / 直链） */
export async function addFontFromUrl(url: string, name?: string): Promise<CustomFont>

/** 从本地文件添加字体 */
export async function addFontFromFile(file: File, name?: string): Promise<CustomFont>

/** 从 IndexedDB 加载所有已保存字体 */
export async function loadAllFonts(): Promise<CustomFont[]>

/** 删除字体（从 IndexedDB 和 document.fonts 中移除） */
export async function removeFont(id: string): Promise<void>

/** 将 CustomFont 通过 FontFace API 加载到页面 */
export async function loadFontToDocument(font: CustomFont): Promise<void>
```

## URL 识别与处理

### 识别策略

| URL 特征 | 处理方式 |
|----------|---------|
| 含 `fonts.googleapis.com` | 作为 Google Fonts CSS：fetch CSS → 正则提取 `font-family` 名和 `url()` 下载链接 → 下载字体文件 |
| 以 `.woff2` / `.ttf` / `.otf` / `.woff` 结尾 | 直链模式：直接下载，文件名（去扩展名）作为候选字体名 |
| 其他情况 | 尝试作为字体 URL 下载，失败则提示「无法识别的链接」 |

### Google Fonts CSS 解析

输入示例：
```css
@font-face {
  font-family: 'Noto Sans Mono';
  font-style: normal;
  src: url(https://fonts.gstatic.com/s/notosansmono/v26/...woff2) format('woff2');
}
```

解析提取：
- `font-family` → 字体显示名称
- `url()` 内容 → 字体文件下载地址
- `format()` → 字体格式

### 边界处理

- **跨域限制**：Google Fonts/gstatic 支持 CORS；若第三方 CDN 返回 CORS 错误，提示用户下载到本地
- **格式不支持**：拒绝 `.eot` 等旧格式
- **网络超时**：fetch 15 秒超时

## IndexedDB 设计

```
数据库名：fontcode
对象仓库：custom-fonts
主键：id
索引：name（用于快速查找）
```

存储的 CustomFont 对象中 `blobData` 以 ArrayBuffer 形式存储。

### Safari 私有模式降级

Safari 私有模式下 IndexedDB 不可用 → 提示用户「当前环境下无法持久化字体」并回退到纯内存模式（仅当前会话有效）。

## UI 设计

### AddFontModal 弹窗

- 两个 Tab 切换：「🌐 网站字体」「📁 本地字体」
- **网站字体 Tab**：URL 输入框 + 字体名称输入框（可选，不填则自动检测）
- **本地字体 Tab**：文件选择器（`accept=".woff2,.ttf,.otf,.woff"`）+ 字体名称输入框（可选）
- 底部「取消」「导入字体」按钮
- 导入中显示加载态，导入失败显示红色错误提示

### FontList 改动

```
┌─ 自定义字体 ─────────┐
│  ✨ MyCustomFont  ✕   │  ← 选中时青绿底，右侧 ✕ 删除
│  ✨ Noto Mono     ✕   │
├─ 内置字体 ───────────┤
│  Fira Code             │  ← 现有 8 款
│  JetBrains Mono        │
│  ...                   │
├───────────────────────┤
│  + 添加字体            │  ← 虚线边框按钮，触发弹窗
└───────────────────────┘
```

- 无自定义字体时不显示「自定义字体」分组和标签
- 自定义字体按钮有 `✕` 图标用于删除
- 底部「+ 添加字体」按钮始终显示
- 字体名过长时文本截断 + 省略号

### FontInfo 改动

选中自定义字体时，设计师/许可证字段显示「自定义字体」标签。

## 加载与生命周期

```
App.vue onMounted
  └→ customFontsService.loadAllFonts()  ← 从 IndexedDB 读取
       └→ 逐个 loadFontToDocument()      ← FontFace API 注册
            └→ store.customFonts = [...] ← 同步到响应式状态
                                                │
                                                ↓
                                        FontList 自动渲染
```

删除流程：
```
FontList 点击 ✕
  └→ customFontsService.removeFont(id)  ← IndexedDB 删除 + document.fonts.delete()
       └→ store.customFonts.splice(...)  ← 同步移除
```

## 非功能需求

- **无障碍**：弹窗模态支持 ESC 关闭、焦點捕获（focus trap）、`role="dialog"` / `aria-labelledby`
- **并发安全**：快速连续点击导入不会创建重复条目
- **错误恢复**：IndexedDB 写入失败时回滚 FontFace 注册

## 范围边界

### 在范围内

- 网站字体导入（Google Fonts + 直链）
- 本地字体文件上传
- 持久化存储
- 删除自定义字体
- 基本错误处理

### 不在范围内

- 字体连字设置（ligatures） — 后续功能
- 多语言界面 — 后续功能
- 字体子集化 — 不做
- 自定义主题 — 后续功能
