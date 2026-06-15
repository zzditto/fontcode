# Nerd Fonts 静态目录设计

- 日期：2026-06-15
- 状态：草案，待审查
- 关联前作：`docs/superpowers/specs/2026-06-11-nerd-fonts-full-catalog-design.md`
- 替换：本设计取代上一版"运行时拉取 + localStorage 缓存"方案

## 背景

`AddFontModal` 的 Nerd Fonts Tab 提供"加载完整目录"按钮，运行时调用：

```
GET https://api.github.com/repos/ryanoasis/nerd-fonts/git/trees/master?recursive=1
```

GitHub REST API 对未认证请求按 IP 限速 60 次/小时。生产中用户出口 IP 容易因共享/CGNAT 命中限速，返回 HTTP 403 + `API rate limit exceeded`，UI 退化为"完整目录加载失败，已保留推荐列表"。同时现有错误处理只有 `catch {}`（`src/components/sidebar/AddFontModal.vue:96`），具体原因被吞掉。

## 目标

1. 用户打开 Nerd Fonts Tab 时不再访问 `api.github.com`，彻底消除限速根因。
2. 用户能浏览远超内置推荐的 Nerd Fonts 家族列表（覆盖仓库 patched-fonts/ 下绝大多数家族）。
3. 每个家族保留核心字重集合（Regular / Bold / Italic / BoldItalic），覆盖大多数用户需求。
4. 离线、纯静态部署、无 CI 的现有架构约束保持不变。

## 非目标

- 不实现运行时实时同步上游目录变化（接受手动重新生成）。
- 不再支持用户提供 GitHub Token 的认证模式。
- 不切换字体文件下载源（仍用 `raw.githubusercontent.com`）。
- 不在本期里调整字体文件下载、IndexedDB 缓存、`addRemoteNerdFont` 等下游逻辑。

## 总体方案

将"运行时拉 GitHub API + localStorage 缓存"替换为"构建期生成静态 JSON + 运行时 dynamic import"。

```
[ 维护时 - 开发者本地 ]
  scripts/generate-nerd-fonts-catalog.mjs
    - 调用 GitHub Tree API（可选 GITHUB_TOKEN）
    - 解析 patched-fonts/ 路径
    - 精简：每家族最多 4 条变体（Regular/Bold/Italic/BoldItalic）
    - 写入 src/data/nerd-fonts-catalog.generated.json
    - 文件 commit 进仓库

[ 运行时 - 用户浏览器 ]
  AddFontModal.vue 切到 Nerd Fonts tab
    - dynamic import 静态 JSON
       - 成功 -> 展示完整目录
       - 失败 -> 降级到 src/data/nerdFonts.ts 推荐列表
    - 不再访问 api.github.com
    - 不再有 localStorage 缓存层
    - 不再有"加载完整目录 / 刷新目录"按钮
```

## 关键决策记录

| # | 决策 | 选择 |
|---|------|------|
| 1 | JSON 加载方式 | dynamic import（C 方案）：单独 chunk，切到 Nerd Fonts tab 时再加载 |
| 2 | 精简策略 | 每家族最多 4 条变体（Regular/Bold/Italic/BoldItalic），B 方案 |
| 3 | 字体文件下载源 | 维持 `raw.githubusercontent.com`，本次不动（A 方案） |
| 4 | 加载/刷新目录按钮 | 删除，默认展示完整目录（A 方案） |
| 5 | 生成脚本运行方式 | 手动运行 `npm run gen:nerd-fonts`，结果 commit（A 方案） |
| 6 | JSON 是否进 git | 是，commit 进仓库（A 方案） |
| 7 | 加载失败降级 | dynamic import 失败时降级到 `src/data/nerdFonts.ts`（B 方案） |

## 数据契约

### 生成产物：`src/data/nerd-fonts-catalog.generated.json`

复用现有 `NerdFontMeta` / `NerdFontVariant` 类型（`src/data/nerdFonts.ts:1-15`），新增一层包装以便后续演进：

```ts
interface GeneratedCatalog {
  generatedAt: string;       // ISO 8601，例如 "2026-06-15T03:00:00Z"
  source: 'ryanoasis/nerd-fonts@master';
  schemaVersion: 1;
  fonts: NerdFontMeta[];     // 每家族最多 4 条变体
}
```

字段约定：

- `id`：家族 slug，沿用现有 `slugify()` 规则。
- `name`：家族展示名，沿用 `toDisplayName()`。
- `description`：固定模板 `来自 Nerd Fonts 完整目录，包含 N 个变体。`。
- `variants[].id`：`<familySlug>-<basenameSlug>`。
- `variants[].url`：`https://raw.githubusercontent.com/ryanoasis/nerd-fonts/master/<encoded path>`。
- `variants[].format`：`'ttf' | 'otf'`（按文件扩展名）。
- `variants[].fontFamily`：CSS `font-family` 字符串，沿用 `buildFontFamily()` 启发式。
- `variants[].label`：变体标签，规范化为 `Regular / Bold / Italic / BoldItalic` 之一。
- `variants[].recommended`：标记 Regular 那条为 `true`，其余缺省。

### 变体精简规则

对每个家族下的所有 `.ttf/.otf` 文件，按"字重 + 斜体"维度归类，每类只保留 1 条；规则如下：

1. 仅保留 4 个维度：`Regular` / `Bold` / `Italic` / `BoldItalic`，其它（Light、Medium、Thin、Retina、ExtraLight、SemiBold 等）全部丢弃。
2. 维度归类规则（在去扩展名后的 basename 上判断）：
   - 匹配 `BoldItalic` -> BoldItalic
   - 否则匹配 `Italic` 且不含 `Bold` -> Italic
   - 否则匹配 `Bold` 且不含 `Italic` -> Bold
   - 否则匹配 `Regular` -> Regular
   - 其它 -> 丢弃
3. 同维度下文件优先级（沿用现有 `getRecommendationScore` 思路）：
   - `*NerdFontMono-<weight>` 100 分
   - `*NerdFont-<weight>` 90 分
   - `*Mono-<weight>` 80 分
   - `*-<weight>` 70 分（兜底，仅当前面三档都没文件时使用）
   - 其它 0 分（丢弃）
4. 同分内按文件路径字典序选第一个。
5. 每家族输出顺序固定：Regular -> Bold -> Italic -> BoldItalic。
6. 若某家族在 4 个维度都未命中，整体丢弃。

预期产出：约 80 个家族，平均约 3.5 条变体，合计约 280 条变体，JSON 体积 < 200 KB。

## 实现细节

### 1. 生成脚本 `scripts/generate-nerd-fonts-catalog.mjs`

- Node ESM、零运行时依赖（`package.json` 已声明 `type: module`）。
- 入口流程：
  1. 读取 `process.env.GITHUB_TOKEN`，存在则请求头加 `Authorization: token <...>`（额度 60/h -> 5000/h）。
  2. fetch `https://api.github.com/repos/ryanoasis/nerd-fonts/git/trees/master?recursive=1`。
  3. 校验 `response.ok`；若 `data.truncated === true`，抛错并提示用户配置 token 重试。
  4. 解析 `data.tree`，按上文精简规则归类。
  5. 写入 `src/data/nerd-fonts-catalog.generated.json`，UTF-8、2 空格缩进、末尾换行。
  6. 输出统计：家族数、变体总数、文件字节数。
- 失败时 `process.exit(1)`，并打印 GitHub 返回的 message 便于排查。
- 不引入新 npm 依赖，全部用 Node 原生 API（`fetch` / `node:fs/promises` / `node:path` / `node:url`）。

### 2. `package.json` 新增 script

```json
"scripts": {
  "dev": "vite",
  "build": "vue-tsc && vite build",
  "preview": "vite preview",
  "gen:nerd-fonts": "node scripts/generate-nerd-fonts-catalog.mjs"
}
```

不挂在 `prebuild` 上（决策 5）。

### 3. 运行时改造

#### 3.1 `src/services/nerdFontsCatalog.ts`

- 删除：`fetchNerdFontsCatalog`、`saveNerdFontsCatalogCache`、`loadCachedNerdFontsCatalog`、`removeNerdFontsCatalogCache`、`CATALOG_CACHE_KEY`、`GITHUB_TREE_URL`、`isCatalogCache` 等所有 localStorage / GitHub API 相关代码。
- 新增 `loadStaticNerdFontsCatalog()`：dynamic import 静态 JSON，失败返回 `null` 让 UI 自行降级。
- 保留并复用 `isNerdFontMeta` / `isNerdFontVariant` 类型守卫，在加载后做一次校验，校验失败也返回 `null` 并 `console.warn`。
- 旧的解析/编码工具函数（`slugify` / `toDisplayName` / `parseFontPath` / `buildFontFamily` 等）从运行时移出，搬到生成脚本里复用，不再进 bundle。

#### 3.2 `src/components/sidebar/AddFontModal.vue`

- 删除状态：`nerdCatalogLoading`、`nerdCatalogError`。
- 保留 `nerdCatalogFonts`（存放静态目录）和 `hasFullNerdCatalog`（由 `nerdCatalogFonts.length > 0` 派生）。
- 删除函数：`loadFullNerdCatalog`、`restoreCachedNerdCatalog`。
- 新增逻辑：组件首次切到 Nerd Fonts tab 时（沿用 `setActiveTab('nerd')` 路径），调用 `loadStaticNerdFontsCatalog()` 并写入 `nerdCatalogFonts`；只调用一次，使用一个 `nerdCatalogLoaded` 布尔哨兵防止重复加载。
- `activeNerdFonts`：成功用静态目录，失败回退到 `nerdFonts`。
- 模板修改：
  - 删除 `.nerd-catalog-bar` 整块（含状态文字与按钮）和错误提示 `<p v-if="nerdCatalogError">`。
  - 新增一行无交互状态文本：成功显示 `完整目录 · {{ activeNerdFonts.length }} 个家族`，降级时显示 `当前为推荐字体列表`。

#### 3.3 错误处理与降级文案

- dynamic import 失败 / JSON schema 校验失败：
  - `console.warn` 打印具体错误。
  - UI 显示降级文案，并使用内置推荐列表，用户仍可正常添加字体。
  - 不阻断其它 Tab（URL / File）的使用。

### 4. 文档更新

- `AGENTS.md` 增加一段：Nerd Fonts 完整目录通过 `npm run gen:nerd-fonts` 生成，结果 commit 在 `src/data/nerd-fonts-catalog.generated.json`，需要更新时手动重跑。
- `docs/superpowers/specs/2026-06-11-nerd-fonts-full-catalog-design.md` 文末追加一行 "本设计已被 2026-06-15 静态目录方案替代"，避免后续阅读混淆。

## 测试与验证

由于项目无测试框架，手工验证：

1. `npm run gen:nerd-fonts`（开发者本地）执行成功，生成 JSON 文件，统计输出符合预期数量级。
2. `npm run build` 类型检查通过、产物正常。
3. `npm run dev` 打开 AddFontModal -> Nerd Fonts tab：
   - 网络面板看不到任何 `api.github.com` 请求。
   - 看到家族数量远多于内置 10 个（说明加载到完整目录）。
   - 选一个变体添加，字体文件能从 `raw.githubusercontent.com` 正常下载并应用。
4. 模拟 dynamic import 失败（临时把 JSON 改成非法格式）：
   - UI 降级为内置 10 个推荐字体列表。
   - 控制台有 warn 日志。
   - 添加流程仍可用。

## 风险与回退

- **风险 A**：GitHub 仓库 patched-fonts/ 路径结构变化导致脚本解析失败 → 维护者重新跑脚本时会立即报错，不会污染线上；可降级到旧版 JSON 文件（git 历史）。
- **风险 B**：`buildFontFamily` 启发式与某些字体内置 family name 不一致，导致 `font-family` 解析后浏览器找不到字形 → 沿用现有逻辑，已验证内置 11 款字体可工作；新增家族中若有个别异常，由用户反馈后逐个修正。
- **风险 C**：JSON 体积超出预期（大幅 > 200 KB）→ 进一步收紧精简规则（例如只保留 NerdFontMono），此项可在 PR review 阶段决定。
- **回退**：删除新文件、恢复 `nerdFontsCatalog.ts` 旧版本、恢复 `AddFontModal.vue` 旧版本即可；JSON 文件不影响运行时。

## 出口

完成本设计的 writing-plans 后实施。
