# Nerd Fonts 全量目录优化设计

## 背景

当前“添加字体”弹窗已有 Nerd Fonts Tab，但可选字体来自 `src/data/nerdFonts.ts` 的内置精选清单。该清单只包含少量字体家族和单个 `Mono Regular` 变体，用户无法在应用内选择 Nerd Fonts 网站/仓库中完整的字体家族和文件变体。

项目是 Vue 3 + Vite + TypeScript 的纯前端静态应用，无后端。现有远程 Nerd Fonts 添加逻辑已通过 `addRemoteNerdFont` 保存 `remoteUrl`，并使用 FontFace API 在线加载字体。

## 目标

优化 Nerd Fonts Tab，使用户可以：

1. 默认继续看到当前精选推荐列表。
2. 点击“加载完整 Nerd Fonts 目录”后在线获取全量 Nerd Fonts 目录。
3. 按字体家族搜索完整目录。
4. 在家族列表中一键添加推荐变体，优先 `Regular Mono`，其次 `Regular`。
5. 展开字体家族后查看并选择完整变体文件。
6. 成功加载过的目录索引缓存到 `localStorage`，下次打开时快速展示。
7. 在线目录加载失败时，保留当前精选推荐列表并显示错误提示。

## 非目标

本阶段不做以下内容：

- 不引入后端服务。
- 不下载或解析 Nerd Fonts zip 包。
- 不缓存字体文件本身；字体文件缓存仍沿用现有 `cacheRemoteFont` 能力，UI 不在本阶段扩展。
- 不实现 GitHub API 鉴权。
- 不保证规避 GitHub 匿名 API 限流，只做失败提示与本地缓存兜底。
- 不重构整个自定义字体系统。

## 方案选择

采用“内置推荐列表 + 点击在线加载 GitHub 全量目录 + localStorage 缓存索引”的混合方案。

### 原因

- 内置推荐列表保证离线或网络失败时功能可用。
- 在线加载目录满足“完整 Nerd Fonts”需求。
- `localStorage` 缓存实现简单，适合目录索引这种体积较小、可重新获取的数据。
- 保持纯前端架构，不需要部署额外服务。

## 用户体验

### 默认状态

进入“添加自定义字体 → Nerd Fonts”时：

- 显示现有精选 Nerd Fonts 列表。
- 搜索框按字体名称和简介过滤精选列表。
- 显示“加载完整 Nerd Fonts 目录”按钮。
- 如果 `localStorage` 中已有可用目录缓存，可直接显示完整目录，并提供“刷新目录”入口。

### 加载完整目录

用户点击“加载完整 Nerd Fonts 目录”后：

1. 显示加载中状态，禁用重复点击。
2. 请求 GitHub 仓库树数据。
3. 解析 `patched-fonts` 下可用字体文件。
4. 按字体家族聚合结果。
5. 为每个家族计算推荐变体。
6. 将目录索引写入 `localStorage`。
7. UI 切换到完整目录模式。

### 完整目录模式

完整目录模式中：

- 默认按字体家族展示列表。
- 搜索框匹配字体家族名、变体文件名和显示标签。
- 每个家族卡片显示：
  - 字体家族名。
  - 变体数量。
  - 推荐变体按钮。
  - 展开/收起变体按钮。
- 点击推荐变体按钮直接添加该字体。
- 展开后显示完整变体按钮列表。
- 已添加的变体显示“已添加”并禁用。

### 错误状态

如果目录加载失败：

- 不清空已有精选列表或缓存目录。
- 显示错误提示：`完整目录加载失败，已保留推荐列表，可稍后重试。`
- 如果存在缓存目录，可提示用户继续使用缓存目录。

## 数据来源

使用 GitHub API 获取 Nerd Fonts 仓库树：

- 仓库：`ryanoasis/nerd-fonts`
- 分支：`master`
- 目录范围：`patched-fonts`
- 目标文件格式：优先支持 `.ttf`，可兼容 `.otf`
- 字体文件 URL：继续使用 GitHub raw 单文件地址

实现时应把 API URL 和 raw base URL 封装为常量，避免散落在组件内。

## 数据模型

保留现有精选数据模型，并新增运行时目录索引模型。

```ts
export interface NerdFontVariant {
  id: string;
  label: string;
  fontFamily: string;
  url: string;
  format: 'ttf' | 'otf';
  recommended?: boolean;
}

export interface NerdFontMeta {
  id: string;
  name: string;
  description: string;
  variants: NerdFontVariant[];
}
```

完整目录解析后也转换为 `NerdFontMeta[]`，让现有 UI 和 `handleNerdFontImport` 尽量复用。

### providerId

继续使用：

```ts
`${meta.id}/${variant.id}`
```

同一字体家族的不同文件变体应拥有不同 `variant.id`，避免重复判断冲突。

### fontFamily

从字体文件名生成 CSS `fontFamily`，例如：

- `JetBrainsMonoNerdFontMono-Regular.ttf` → `"JetBrainsMono Nerd Font Mono", monospace`
- `CaskaydiaCoveNerdFont-Regular.ttf` → `"CaskaydiaCove Nerd Font", monospace`

解析不确定时可使用去扩展名文件名作为 family 名称，保证 FontFace 可加载并在应用内选中。

## 目录解析规则

从 GitHub tree 结果中筛选：

1. `type === 'blob'`
2. 路径位于 `patched-fonts/`
3. 文件扩展名为 `.ttf` 或 `.otf`
4. 排除明显非字体文件

家族名取 `patched-fonts/<family>/...` 中的 `<family>`，再转换为可读名称。

变体标签优先从文件名生成：

- 移除扩展名。
- 移除家族前缀。
- 保留 `Nerd Font` / `Mono` / `Propo` / `Regular` / `Bold` / `Italic` 等关键信息。
- 若结果为空，使用文件名主体。

推荐变体选择优先级：

1. 文件名包含 `NerdFontMono-Regular`
2. 文件名包含 `NerdFont-Regular`
3. 文件名包含 `Mono-Regular`
4. 文件名包含 `Regular`
5. 当前家族第一个可用字体文件

每个家族最多一个 `recommended: true`。

## 缓存设计

使用 `localStorage` 缓存目录索引。

建议键名：

```ts
fontcode:nerd-fonts-catalog:v1
```

缓存内容：

```ts
interface NerdFontsCatalogCache {
  version: 1;
  cachedAt: number;
  fonts: NerdFontMeta[];
}
```

读取缓存时需要校验：

- JSON 可解析。
- `version === 1`。
- `fonts` 是数组。
- 关键字段类型有效。

缓存失效策略：

- 本阶段不强制自动过期。
- UI 提供“刷新目录”按钮，允许用户主动重新请求。
- 后续可增加 7 天自动刷新。

## 模块设计

### `src/data/nerdFonts.ts`

继续保存内置推荐列表，并导出基础类型。

可能调整：

- `NerdFontVariant.format` 从 `'ttf'` 扩展为 `'ttf' | 'otf'`。
- 保留 `rawBase` 供推荐列表使用。

### 新增 `src/services/nerdFontsCatalog.ts`

职责：

- 获取 GitHub tree。
- 解析完整目录。
- 读写 `localStorage` 缓存。
- 校验缓存数据。

建议导出：

```ts
export async function fetchNerdFontsCatalog(): Promise<NerdFontMeta[]>
export function loadCachedNerdFontsCatalog(): NerdFontMeta[] | null
export function saveNerdFontsCatalogCache(fonts: NerdFontMeta[]): void
```

组件不直接处理 GitHub tree 结构，只消费 `NerdFontMeta[]`。

### `src/components/sidebar/AddFontModal.vue`

新增状态：

- `nerdCatalogFonts`
- `nerdCatalogLoading`
- `nerdCatalogError`
- `expandedNerdFontIds`
- `isFullCatalogMode`

列表数据来源：

- 有完整目录时使用完整目录。
- 无完整目录时使用内置推荐列表。

交互变化：

- 增加加载/刷新完整目录按钮。
- 家族卡片增加变体数量和展开按钮。
- 默认只显示推荐变体按钮。
- 展开后显示完整变体按钮列表。

导入逻辑继续复用现有 `handleNerdFontImport(meta, variant)`。

## 错误处理

### GitHub tree 请求失败

- 捕获异常。
- 保持当前列表不变。
- 显示 `完整目录加载失败，已保留推荐列表，可稍后重试。`

### 缓存损坏

- 忽略缓存。
- 删除损坏缓存或覆盖为新缓存。
- 不影响推荐列表。

### 字体加载失败

沿用现有错误：

`在线字体加载失败，可稍后重试或使用本地字体导入。`

### 重复添加

继续按 `source === 'nerd-fonts' && providerId` 判断。

## 测试与验证

当前项目没有测试框架和 lint 脚本。实现后至少运行：

```bash
npm run build
```

手动验证：

1. 打开添加字体弹窗，进入 Nerd Fonts Tab。
2. 默认显示精选列表。
3. 点击加载完整目录，出现加载态。
4. 加载成功后显示更多字体家族。
5. 搜索已知字体家族能过滤结果。
6. 点击推荐变体可添加并选中字体。
7. 展开家族后可添加非推荐变体。
8. 刷新页面后能从 `localStorage` 快速恢复目录。
9. 模拟网络失败时推荐列表仍可用。

## 风险与缓解

### GitHub API 限流或不可访问

风险：匿名 API 可能失败。

缓解：保留内置推荐列表和上次成功缓存；失败时不阻断已有功能。

### 目录数据较大

风险：一次性解析大量文件可能造成短暂卡顿。

缓解：只保存必要字段；列表默认按家族聚合，不直接渲染所有变体。

### 文件命名差异

风险：不同字体目录命名不一致，推荐变体识别可能不完全准确。

缓解：使用优先级规则，并在无法识别时退回第一个可用文件。

### raw 字体跨域或加载失败

风险：部分 raw URL 加载失败。

缓解：单个字体导入失败不影响目录；继续提示用户使用本地字体导入兜底。

## 已批准的需求决策

- 使用在线获取完整目录。
- 默认只展示家族与推荐变体，展开后显示完整变体。
- 使用混合方案：内置推荐 + 在线全量刷新。
- 使用 `localStorage` 缓存目录索引。

---

> **更新（2026-06-15）：** 本设计因 GitHub REST API 60/h 限速在生产中频繁失败，已被 [`2026-06-15-nerd-fonts-static-catalog-design.md`](./2026-06-15-nerd-fonts-static-catalog-design.md) 取代。当前实现为构建期生成静态 JSON + 运行时 dynamic import。
