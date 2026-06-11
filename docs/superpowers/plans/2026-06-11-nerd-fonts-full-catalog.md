# Nerd Fonts 全量目录优化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 Nerd Fonts Tab 从少量预设扩展为“内置推荐 + 在线加载完整目录 + localStorage 缓存 + 家族展开完整变体”。

**架构：** 新增目录服务负责 GitHub tree 获取、解析与 localStorage 缓存；弹窗继续消费 `NerdFontMeta[]` 并复用 `addRemoteNerdFont()`。内置推荐列表保留为失败兜底。

**技术栈：** Vue 3 `<script setup lang="ts">`、TypeScript、GitHub REST API、localStorage、FontFace API、Vite。

---

## 文件结构

- 修改：`src/data/nerdFonts.ts`：扩展 `NerdFontVariant.format` 为 `'ttf' | 'otf'`。
- 创建：`src/services/nerdFontsCatalog.ts`：获取 GitHub tree、解析目录、缓存读写和校验。
- 修改：`src/components/sidebar/AddFontModal.vue`：加载/刷新完整目录、缓存恢复、家族展开、完整变体 UI。
- 验证：`npm run build`。

---

### 任务 1：扩展 Nerd Fonts 类型

**文件：**
- 修改：`src/data/nerdFonts.ts`

- [x] **步骤 1：扩展格式类型**

将 `NerdFontVariant` 中的 `format: 'ttf';` 改为：

```ts
format: 'ttf' | 'otf';
```

- [x] **步骤 2：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 2：新增完整目录服务

**文件：**
- 创建：`src/services/nerdFontsCatalog.ts`

- [x] **步骤 1：创建基础类型和常量**

创建文件并加入：

```ts
import type { NerdFontMeta, NerdFontVariant } from '../data/nerdFonts';

const CATALOG_CACHE_KEY = 'fontcode:nerd-fonts-catalog:v1';
const CATALOG_CACHE_VERSION = 1;
const GITHUB_TREE_URL = 'https://api.github.com/repos/ryanoasis/nerd-fonts/git/trees/master?recursive=1';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/ryanoasis/nerd-fonts/master';

interface GitHubTreeItem {
  path?: string;
  type?: string;
}

interface GitHubTreeResponse {
  tree?: GitHubTreeItem[];
}

interface NerdFontsCatalogCache {
  version: 1;
  cachedAt: number;
  fonts: NerdFontMeta[];
}
```

- [x] **步骤 2：添加解析工具函数**

加入 `slugify()`、`toDisplayName()`、`stripExtension()`、`getFormat()`、`parseFontPath()`、`buildFontFamily()`、`buildVariantLabel()`、`getRecommendationScore()`。

关键行为：

```ts
function getFormat(filename: string): NerdFontVariant['format'] {
  return filename.toLowerCase().endsWith('.otf') ? 'otf' : 'ttf';
}

function parseFontPath(path: string) {
  const parts = path.split('/');
  const family = parts[1];
  const filename = parts.at(-1);
  if (!family || !filename || !/\.(ttf|otf)$/i.test(filename)) return null;
  return { family, filename, basename: stripExtension(filename) };
}

function getRecommendationScore(filename: string): number {
  if (filename.includes('NerdFontMono-Regular')) return 100;
  if (filename.includes('NerdFont-Regular')) return 90;
  if (filename.includes('Mono-Regular')) return 80;
  if (filename.includes('Regular')) return 70;
  return 0;
}
```

- [x] **步骤 3：添加 `parseCatalog(tree)`**

实现要求：

1. 仅处理 `type === 'blob'` 且路径以 `patched-fonts/` 开头的 `.ttf` / `.otf` 文件。
2. 按 `patched-fonts/<family>/...` 的 family 聚合。
3. 每个变体生成 `id`、`label`、`fontFamily`、`url`、`format`。
4. 每个家族按推荐优先级设置一个 `recommended: true`。
5. 返回按 `name` 排序的 `NerdFontMeta[]`。

返回对象形状：

```ts
{
  id: slugify(family),
  name: toDisplayName(family),
  description: `来自 Nerd Fonts 完整目录，包含 ${variants.length} 个可用变体。`,
  variants: sortedVariants,
} satisfies NerdFontMeta
```

- [x] **步骤 4：添加缓存校验函数**

实现 `isNerdFontVariant()`、`isNerdFontMeta()`、`isCatalogCache()`，必须校验：

- 字符串字段为 string。
- `format` 只能是 `'ttf'` 或 `'otf'`。
- `recommended` 只能是 undefined 或 boolean。
- `version === 1`。
- `fonts` 是有效 `NerdFontMeta[]`。

- [x] **步骤 5：导出缓存和拉取函数**

导出：

```ts
export function loadCachedNerdFontsCatalog(): NerdFontMeta[] | null
export function saveNerdFontsCatalogCache(fonts: NerdFontMeta[]): void
export async function fetchNerdFontsCatalog(): Promise<NerdFontMeta[]>
```

行为：

- `loadCachedNerdFontsCatalog()` 读取 `localStorage`，缓存损坏时删除并返回 null。
- `saveNerdFontsCatalogCache()` 写入 `{ version: 1, cachedAt: Date.now(), fonts }`。
- `fetchNerdFontsCatalog()` 请求 GitHub tree，响应无效或解析为空时抛错，成功后保存缓存并返回 fonts。

- [x] **步骤 6：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 3：接入完整目录状态

**文件：**
- 修改：`src/components/sidebar/AddFontModal.vue`

- [x] **步骤 1：新增导入**

```ts
import {
  fetchNerdFontsCatalog,
  loadCachedNerdFontsCatalog,
} from '../../services/nerdFontsCatalog';
```

- [x] **步骤 2：新增状态和派生数据**

在现有 Nerd Fonts 状态旁加入：

```ts
const nerdCatalogFonts = ref<NerdFontMeta[]>([]);
const nerdCatalogLoading = ref(false);
const nerdCatalogError = ref('');
const expandedNerdFontIds = ref<string[]>([]);
const isBusy = computed(() => loading.value || nerdLoading.value || nerdCatalogLoading.value);
const hasFullNerdCatalog = computed(() => nerdCatalogFonts.value.length > 0);
const activeNerdFonts = computed(() => hasFullNerdCatalog.value ? nerdCatalogFonts.value : nerdFonts);
```

把原 `isBusy` 替换为上面的版本。

- [x] **步骤 3：更新搜索**

`filteredNerdFonts` 改为搜索 `activeNerdFonts.value`，匹配：字体名、简介、变体 label、变体 id。

- [x] **步骤 4：新增缓存恢复和远程加载函数**

```ts
function restoreCachedNerdCatalog() {
  if (nerdCatalogFonts.value.length > 0) return;
  const cached = loadCachedNerdFontsCatalog();
  if (cached) nerdCatalogFonts.value = cached;
}

async function loadFullNerdCatalog() {
  if (isBusy.value) return;
  nerdCatalogError.value = '';
  nerdCatalogLoading.value = true;
  try {
    nerdCatalogFonts.value = await fetchNerdFontsCatalog();
  } catch {
    nerdCatalogError.value = '完整目录加载失败，已保留推荐列表，可稍后重试。';
  } finally {
    nerdCatalogLoading.value = false;
  }
}
```

- [x] **步骤 5：在打开弹窗和切换 Tab 时恢复缓存**

在 `watch(() => props.show...)` 的打开分支中重置 `nerdCatalogError`、`nerdCatalogLoading`，并调用 `restoreCachedNerdCatalog()`。

在 `setActiveTab('nerd')` 时清空 `nerdCatalogError` 并调用 `restoreCachedNerdCatalog()`。

- [x] **步骤 6：新增展开和可见变体函数**

```ts
function isNerdFontExpanded(id: string) {
  return expandedNerdFontIds.value.includes(id);
}

function toggleNerdFontExpanded(id: string) {
  expandedNerdFontIds.value = isNerdFontExpanded(id)
    ? expandedNerdFontIds.value.filter((item) => item !== id)
    : [...expandedNerdFontIds.value, id];
}

function getVisibleNerdVariants(font: NerdFontMeta) {
  if (isNerdFontExpanded(font.id)) return font.variants;
  const recommended = font.variants.find((variant) => variant.recommended);
  return recommended ? [recommended] : font.variants.slice(0, 1);
}
```

- [x] **步骤 7：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 4：更新 Nerd Fonts UI

**文件：**
- 修改：`src/components/sidebar/AddFontModal.vue`

- [x] **步骤 1：添加目录操作区**

在 Nerd Fonts 搜索输入后添加：

```vue
<div class="nerd-catalog-bar">
  <span class="nerd-catalog-status">
    {{ hasFullNerdCatalog ? `完整目录 · ${activeNerdFonts.length} 个家族` : '当前显示推荐字体' }}
  </span>
  <button class="nerd-catalog-btn" :disabled="isBusy" @click="loadFullNerdCatalog">
    {{ nerdCatalogLoading ? '加载中...' : hasFullNerdCatalog ? '刷新目录' : '加载完整目录' }}
  </button>
</div>
<p v-if="nerdCatalogError" class="field-hint error-hint">{{ nerdCatalogError }}</p>
```

- [x] **步骤 2：更新卡片信息**

将 badge 文案改为：

```vue
{{ hasFullNerdCatalog ? `${font.variants.length} 个变体` : 'Nerd Fonts' }}
```

将变体循环从 `font.variants` 改为：

```vue
getVisibleNerdVariants(font)
```

- [x] **步骤 3：添加展开按钮**

在变体按钮后添加：

```vue
<button
  v-if="font.variants.length > 1"
  class="nerd-expand-btn"
  :disabled="isBusy"
  @click="toggleNerdFontExpanded(font.id)"
>
  {{ isNerdFontExpanded(font.id) ? '收起变体' : `展开全部 ${font.variants.length} 个` }}
</button>
```

- [x] **步骤 4：更新错误输出**

底部错误仍保留：

```vue
<p v-if="error || nerdError" class="error-msg">{{ error || nerdError }}</p>
```

目录加载错误只显示在 Nerd Fonts 内容区的 `nerdCatalogError`，不阻断导入错误。

- [x] **步骤 5：添加样式**

新增类：`.nerd-catalog-bar`、`.nerd-catalog-status`、`.nerd-catalog-btn`、`.nerd-expand-btn`、`.error-hint`。

样式要求：沿用现有米色背景、青绿色按钮、圆角、focus-visible 黄色描边；`.nerd-expand-btn` 使用浅色描边按钮，和 `.btn-cancel` 风格接近。

- [x] **步骤 6：验证**

运行：`npm run build`

预期：构建通过。

---

### 任务 5：完整验收

**文件：**
- 验证：无需新增文件。

- [x] **步骤 1：生产构建**

运行：`npm run build`

预期：`vue-tsc` 类型检查通过，`vite build` 成功。

- [x] **步骤 2：手动验证**

运行：`npm run dev`

检查：

1. Nerd Fonts Tab 默认显示推荐列表。
2. 点击“加载完整目录”出现加载态。
3. 成功后显示完整目录和家族数量。
4. 搜索家族名、变体 label 能过滤。
5. 未展开时只显示推荐变体。
6. 展开后显示完整变体。
7. 点击推荐或非推荐变体可添加并选中字体。
8. 重复添加显示“已添加”。
9. 刷新页面后可从 localStorage 恢复完整目录。
10. 网络失败时推荐列表仍可用并显示提示。

- [x] **步骤 3：检查改动范围**

运行：`git diff -- src/data/nerdFonts.ts src/services/nerdFontsCatalog.ts src/components/sidebar/AddFontModal.vue`

预期：只包含本计划范围内的类型、目录服务和 Nerd Fonts Tab UI 改动。
