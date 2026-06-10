# Nerd Fonts 在线添加实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在“添加字体”弹窗中新增 Nerd Fonts Tab，支持通过 GitHub raw 单个 TTF 文件在线添加精选 Nerd Fonts。

**架构：** 扩展 `CustomFont` 支持 `remoteUrl` 在线字体；新增 Nerd Fonts 元数据文件；服务层统一支持 blob 与 URL 两种 FontFace 加载；弹窗新增搜索、变体按钮和在线添加流程。

**技术栈：** Vue 3 `<script setup lang="ts">`、TypeScript、IndexedDB、FontFace API、Vite。

---

## 文件结构

- 修改：`src/services/customFonts.ts`：扩展模型、在线加载、缓存函数。
- 创建：`src/data/nerdFonts.ts`：精选 Nerd Fonts 元数据。
- 修改：`src/components/sidebar/AddFontModal.vue`：新增 Nerd Fonts Tab。
- 修改：`src/components/sidebar/FontInfo.vue`：显示在线/已缓存来源。
- 验证：`npm run build`。

---

### 任务 1：扩展自定义字体服务

**文件：**
- 修改：`src/services/customFonts.ts`

- [ ] **步骤 1：更新 `CustomFont` 接口**

将 `blobData` 改为可选，并新增 `remoteUrl`、`providerId`、`variant`、`cached`，`source` 增加 `'nerd-fonts'`。

- [ ] **步骤 2：更新 `loadAllFonts()` 校验**

读取 IndexedDB 时接受两类有效记录：`blobData instanceof ArrayBuffer` 或 `typeof remoteUrl === 'string'`。

- [ ] **步骤 3：更新 `loadFontToDocument()`**

加载优先级：

1. 如果有 `blobData`，使用 `new FontFace(family, font.blobData)`。
2. 如果有 `remoteUrl`，使用 `new FontFace(family, `url(${font.remoteUrl})`)`。
3. 否则抛出 `字体缺少可加载资源`。

- [ ] **步骤 4：新增 `getFontById(id)`**

用 IndexedDB `get(id)` 读取单个字体，供缓存在线字体使用。

- [ ] **步骤 5：新增 `addRemoteNerdFont(options)`**

参数包含 `name`、`fontFamily`、`remoteUrl`、`providerId`、`variant`、`format`。创建 `source: 'nerd-fonts'`、`cached: false` 的记录；先调用 `loadFontToDocument(font)`，成功后再 `saveFont(font)`。

- [ ] **步骤 6：新增 `cacheRemoteFont(id)`**

通过 `getFontById()` 找到记录，下载 `remoteUrl`，写入 `blobData`，更新 `cached: true`，再保存。

- [ ] **步骤 7：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 2：创建 Nerd Fonts 元数据

**文件：**
- 创建：`src/data/nerdFonts.ts`

- [ ] **步骤 1：定义类型**

创建 `NerdFontVariant`：`id`、`label`、`fontFamily`、`url`、`format: 'ttf'`、`recommended?`。

创建 `NerdFontMeta`：`id`、`name`、`description`、`variants`。

- [ ] **步骤 2：创建精选列表**

创建 `rawBase = 'https://raw.githubusercontent.com/ryanoasis/nerd-fonts/master/patched-fonts'`。

至少添加 10 个精选字体：JetBrainsMono、FiraCode、Hack、CaskaydiaCove、CaskaydiaMono、Iosevka、SauceCodePro、UbuntuMono、VictorMono、Mononoki。每项至少提供一个 `Mono Regular` 变体，URL 指向对应 `*NerdFontMono-Regular.ttf`。

- [ ] **步骤 3：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 3：新增 Nerd Fonts Tab

**文件：**
- 修改：`src/components/sidebar/AddFontModal.vue`

- [ ] **步骤 1：更新导入**

从 Vue 增加 `computed`；从 `customFonts` 增加 `addRemoteNerdFont`；导入 `nerdFonts`、`NerdFontMeta`、`NerdFontVariant`。

- [ ] **步骤 2：扩展状态**

`activeTab` 类型改为 `'url' | 'file' | 'nerd'`。新增 `nerdfontSearch`、`nerdLoading`、`nerdError`。

- [ ] **步骤 3：新增搜索与重复判断**

新增 `filteredNerdFonts`，按字体名称和简介过滤。新增 `isNerdFontAdded(meta, variant)`，以 `source === 'nerd-fonts'` 且 `providerId === `${meta.id}/${variant.id}`` 判断重复。

- [ ] **步骤 4：新增在线导入函数**

新增 `handleNerdFontImport(meta, variant)`：重复则返回；调用 `addRemoteNerdFont()`；成功后 push 到 `store.customFonts`、切换 `store.selectedFont`、关闭弹窗；失败显示 `在线字体加载失败，可稍后重试或使用本地字体导入。`。

- [ ] **步骤 5：添加第三个 Tab 按钮**

在现有“网站字体 / 本地字体”后增加“Nerd Fonts”按钮，点击时切换 `activeTab = 'nerd'` 并清空错误。

- [ ] **步骤 6：添加 Nerd Fonts 内容区**

在 modal body 中添加：搜索输入、滚动字体列表、字体名、简介、`Nerd Fonts` badge、每个变体一个按钮。按钮文案为 `已添加` 或变体 label。

- [ ] **步骤 7：隐藏 Nerd Fonts 下的名称输入和底部导入按钮**

名称输入和底部“导入字体”按钮仅在 `activeTab !== 'nerd'` 时显示。

- [ ] **步骤 8：添加样式**

新增 `.nerd-font-list`、`.nerd-font-item`、`.nerd-font-header`、`.nerd-font-name`、`.nerd-font-badge`、`.nerd-font-desc`、`.nerd-font-actions`、`.nerd-variant-btn` 样式，沿用当前米色背景、青绿色主色、圆角按钮风格。

- [ ] **步骤 9：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 4：显示 Nerd Fonts 来源状态

**文件：**
- 修改：`src/components/sidebar/FontInfo.vue`

- [ ] **步骤 1：新增 `sourceLabel`**

根据 `customInfo.value.source` 返回：

- `nerd-fonts`：`Nerd Fonts · 在线` 或 `Nerd Fonts · 已缓存`
- `google-fonts`：`Google Fonts`
- `file`：`本地文件`
- `url`：`远程链接`

- [ ] **步骤 2：在模板中显示来源**

当 `customInfo` 存在时显示来源行。

- [ ] **步骤 3：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 5：完整验收

- [ ] **步骤 1：启动开发服务器**

运行：`npm run dev`

- [ ] **步骤 2：手动验收**

检查：

1. 添加字体弹窗出现 Nerd Fonts Tab。
2. 能搜索精选 Nerd Fonts。
3. 点击“在线使用”后字体加入左侧自定义字体列表。
4. 选择该字体后代码预览区字体生效。
5. 刷新页面后在线字体记录仍存在，并能重新加载。
6. Google Fonts、本地字体导入不受影响。

- [ ] **步骤 3：生产构建**

运行：`npm run build`

预期：`vue-tsc` 类型检查通过，`vite build` 成功。