# Nerd Fonts 静态目录实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 Nerd Fonts Tab 从"运行时调用 GitHub REST API"改为"构建期生成静态 JSON + 运行时 dynamic import"，彻底消除 60/h 限速根因。

**架构：** 新增 Node 生成脚本 `scripts/generate-nerd-fonts-catalog.mjs` 维护期手动调用 GitHub Tree API、按 4 维度精简变体、写入 `src/data/nerd-fonts-catalog.generated.json` 并 commit；运行时 `nerdFontsCatalog.ts` 改为 dynamic import 该 JSON，加载失败降级到内置 `nerdFonts.ts`；`AddFontModal.vue` 删除"加载/刷新目录"按钮与 localStorage 缓存逻辑。

**技术栈：** Node ESM + 原生 fetch、Vue 3 Composition API、TypeScript 严格模式、Vite 5、零新增运行时依赖。

**关联规格：** `docs/superpowers/specs/2026-06-15-nerd-fonts-static-catalog-design.md`

---

## 文件结构

**新增：**

- `scripts/generate-nerd-fonts-catalog.mjs` — 一次性脚本：拉 GitHub Tree、按规则精简、输出 JSON。
- `src/data/nerd-fonts-catalog.generated.json` — 生成产物，commit 进仓库。

**修改：**

- `src/services/nerdFontsCatalog.ts` — 完整重写：删除 GitHub API/localStorage 路径，新增 `loadStaticNerdFontsCatalog()`。
- `src/components/sidebar/AddFontModal.vue` — 删除加载/刷新按钮、loading/error 状态、localStorage 兜底；改为打开 Nerd Fonts tab 时一次性 dynamic import。
- `package.json` — 新增 `gen:nerd-fonts` script。
- `AGENTS.md` — 增加一段维护说明。
- `docs/superpowers/specs/2026-06-11-nerd-fonts-full-catalog-design.md` — 文末加替代说明。

**不动：**

- `src/data/nerdFonts.ts`（内置 10 个推荐家族） — 作为降级兜底。
- `src/services/customFonts.ts`、`addRemoteNerdFont` — 下游不变。

---
## 任务 1：新增生成脚本骨架

**文件：**
- 创建：`scripts/generate-nerd-fonts-catalog.mjs`

- [ ] **步骤 1：创建脚本（工具函数 + 入口骨架，暂不联网）**

```js
#!/usr/bin/env node
// scripts/generate-nerd-fonts-catalog.mjs
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/nerd-fonts-catalog.generated.json');
const GITHUB_TREE_URL = 'https://api.github.com/repos/ryanoasis/nerd-fonts/git/trees/master?recursive=1';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/ryanoasis/nerd-fonts/master';
const SCHEMA_VERSION = 1;
const SOURCE = 'ryanoasis/nerd-fonts@master';

function slugify(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDisplayName(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripExtension(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

function getFormat(filename) {
  return filename.toLowerCase().endsWith('.otf') ? 'otf' : 'ttf';
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function buildFontFamily(basename) {
  const family = basename
    .replace(/-.+$/, '')
    .replace(/NerdFont/g, ' Nerd Font ')
    .replace(/\s+/g, ' ')
    .trim();
  return `"${family}", monospace`;
}

function classifyWeight(basename) {
  if (/BoldItalic\b/.test(basename)) return 'BoldItalic';
  if (/Italic\b/.test(basename) && !/Bold/.test(basename)) return 'Italic';
  if (/Bold\b/.test(basename) && !/Italic/.test(basename)) return 'Bold';
  if (/Regular\b/.test(basename)) return 'Regular';
  return null;
}

function scoreFile(basename) {
  if (/NerdFontMono-/.test(basename)) return 100;
  if (/NerdFont-/.test(basename)) return 90;
  if (/Mono-/.test(basename)) return 80;
  if (/-/.test(basename)) return 70;
  return 0;
}

async function main() {
  console.log('TODO: fetch & generate');
}

main().catch((err) => {
  console.error('生成失败：', err.message ?? err);
  process.exit(1);
});
```

- [ ] **步骤 2：运行验证骨架可执行**

运行：`node scripts/generate-nerd-fonts-catalog.mjs`
预期输出：`TODO: fetch & generate`，进程 0 退出。

- [ ] **步骤 3：Commit**

```bash
git add scripts/generate-nerd-fonts-catalog.mjs
git commit -m "feat(nerd-fonts): scaffold catalog generator script"
```

---

## 任务 2：实现 GitHub Tree 拉取与目录解析

**文件：**
- 修改：`scripts/generate-nerd-fonts-catalog.mjs`

- [ ] **步骤 1：在 `main` 之前新增辅助函数，并替换 `main`**

将骨架中的 `async function main() { console.log('TODO: fetch & generate'); }` 替换为下述完整逻辑（其余工具函数保留不动）：

```js
async function fetchTree() {
  const headers = { 'User-Agent': 'fontcode-catalog-generator' };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `token ${token}`;

  const res = await fetch(GITHUB_TREE_URL, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  if (data.truncated === true) {
    throw new Error('GitHub Tree API 返回 truncated；请配置 GITHUB_TOKEN 后重试。');
  }
  if (!Array.isArray(data.tree)) {
    throw new Error('GitHub Tree API 返回结构异常：缺少 tree 数组');
  }
  return data.tree;
}

function parseFontPath(path) {
  const parts = path.split('/');
  const family = parts[1];
  const filename = parts[parts.length - 1];
  if (!family || !filename || !/\.(ttf|otf)$/i.test(filename)) return null;
  return { family, filename, basename: stripExtension(filename) };
}

function pickVariants(family, files) {
  const buckets = { Regular: [], Bold: [], Italic: [], BoldItalic: [] };
  for (const file of files) {
    const weight = classifyWeight(file.basename);
    if (!weight) continue;
    const score = scoreFile(file.basename);
    if (score === 0) continue;
    buckets[weight].push({ ...file, score });
  }

  const order = ['Regular', 'Bold', 'Italic', 'BoldItalic'];
  const familySlug = slugify(family);
  const variants = [];
  for (const weight of order) {
    const list = buckets[weight];
    if (list.length === 0) continue;
    list.sort((a, b) => (b.score - a.score) || a.path.localeCompare(b.path));
    const top = list[0];
    variants.push({
      id: `${familySlug}-${slugify(top.basename)}`,
      label: weight,
      fontFamily: buildFontFamily(top.basename),
      url: `${RAW_BASE_URL}/${encodePath(top.path)}`,
      format: getFormat(top.filename),
      ...(weight === 'Regular' ? { recommended: true } : {}),
    });
  }
  return variants;
}

function parseCatalog(tree) {
  const grouped = new Map();
  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const path = item.path;
    if (!path || !path.startsWith('patched-fonts/')) continue;
    if (!/\.(ttf|otf)$/i.test(path)) continue;
    const parsed = parseFontPath(path);
    if (!parsed) continue;
    const list = grouped.get(parsed.family) ?? [];
    list.push({ path, filename: parsed.filename, basename: parsed.basename });
    grouped.set(parsed.family, list);
  }

  const fonts = [];
  for (const [family, files] of grouped) {
    const variants = pickVariants(family, files);
    if (variants.length === 0) continue;
    fonts.push({
      id: slugify(family),
      name: toDisplayName(family),
      description: `来自 Nerd Fonts 完整目录，包含 ${variants.length} 个变体。`,
      variants,
    });
  }

  fonts.sort((a, b) => a.name.localeCompare(b.name));
  return fonts;
}

async function main() {
  console.log('正在拉取 GitHub Tree ...');
  const tree = await fetchTree();
  console.log(`原始 tree 节点数：${tree.length}`);

  const fonts = parseCatalog(tree);
  const variantCount = fonts.reduce((sum, f) => sum + f.variants.length, 0);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: SOURCE,
    schemaVersion: SCHEMA_VERSION,
    fonts,
  };

  const json = JSON.stringify(payload, null, 2) + '\n';
  await writeFile(OUTPUT_PATH, json, 'utf8');

  const sizeKb = (Buffer.byteLength(json, 'utf8') / 1024).toFixed(1);
  console.log(`写入：${OUTPUT_PATH}`);
  console.log(`家族：${fonts.length}，变体：${variantCount}，体积：${sizeKb} KB`);
}
```

- [ ] **步骤 2：运行脚本生成 JSON**

运行：`node scripts/generate-nerd-fonts-catalog.mjs`
预期：
- 输出形如 `家族：80+，变体：280±，体积：< 200 KB`。
- `src/data/nerd-fonts-catalog.generated.json` 文件已生成。
- 若提示 `API rate limit exceeded`，使用 `GITHUB_TOKEN=ghp_xxx node scripts/generate-nerd-fonts-catalog.mjs` 重试。

- [ ] **步骤 3：肉眼校验 JSON 内容**

运行：

```bash
node --input-type=module -e "import j from './src/data/nerd-fonts-catalog.generated.json' with { type: 'json' }; console.log({fonts:j.fonts.length, sample:j.fonts.slice(0,2)});"
```

预期：
- `fonts` 数量 > 50。
- `sample` 中每条 `variants` 的 `label` 仅出现 `Regular/Bold/Italic/BoldItalic`，且至少有一条 `recommended: true`。
- 每条 `url` 以 `https://raw.githubusercontent.com/ryanoasis/nerd-fonts/master/patched-fonts/` 开头。

- [ ] **步骤 4：Commit 脚本与生成产物**

```bash
git add scripts/generate-nerd-fonts-catalog.mjs src/data/nerd-fonts-catalog.generated.json
git commit -m "feat(nerd-fonts): generate static catalog from GitHub tree"
```

---

## 任务 3：在 package.json 注册 gen:nerd-fonts script

**文件：**
- 修改：`package.json`

- [ ] **步骤 1：新增 script**

把 `scripts` 段改为：

```json
"scripts": {
  "dev": "vite",
  "build": "vue-tsc && vite build",
  "preview": "vite preview",
  "gen:nerd-fonts": "node scripts/generate-nerd-fonts-catalog.mjs"
}
```

- [ ] **步骤 2：验证 npm script 可用**

运行：`npm run gen:nerd-fonts`
预期：与任务 2 步骤 2 相同的统计输出。

- [ ] **步骤 3：Commit**

```bash
git add package.json
git commit -m "chore: add gen:nerd-fonts npm script"
```

---

## 任务 4：重写 nerdFontsCatalog.ts 服务层

**文件：**
- 修改（实质为完整覆盖）：`src/services/nerdFontsCatalog.ts`

- [ ] **步骤 1：用下述内容完整覆盖文件**

```ts
import type { NerdFontMeta, NerdFontVariant } from '../data/nerdFonts';

export interface GeneratedCatalog {
  generatedAt: string;
  source: string;
  schemaVersion: number;
  fonts: NerdFontMeta[];
}

function isNerdFontVariant(value: unknown): value is NerdFontVariant {
  if (value == null || typeof value !== 'object') return false;
  const variant = value as Partial<NerdFontVariant>;
  return (
    typeof variant.id === 'string' &&
    typeof variant.label === 'string' &&
    typeof variant.fontFamily === 'string' &&
    typeof variant.url === 'string' &&
    (variant.format === 'ttf' || variant.format === 'otf') &&
    (variant.recommended === undefined || typeof variant.recommended === 'boolean')
  );
}

function isNerdFontMeta(value: unknown): value is NerdFontMeta {
  if (value == null || typeof value !== 'object') return false;
  const font = value as Partial<NerdFontMeta>;
  return (
    typeof font.id === 'string' &&
    typeof font.name === 'string' &&
    typeof font.description === 'string' &&
    Array.isArray(font.variants) &&
    font.variants.every(isNerdFontVariant)
  );
}

function isGeneratedCatalog(value: unknown): value is GeneratedCatalog {
  if (value == null || typeof value !== 'object') return false;
  const catalog = value as Partial<GeneratedCatalog>;
  return (
    typeof catalog.generatedAt === 'string' &&
    typeof catalog.source === 'string' &&
    typeof catalog.schemaVersion === 'number' &&
    Array.isArray(catalog.fonts) &&
    catalog.fonts.every(isNerdFontMeta)
  );
}

export async function loadStaticNerdFontsCatalog(): Promise<NerdFontMeta[] | null> {
  try {
    const mod = await import('../data/nerd-fonts-catalog.generated.json');
    const catalog = (mod as { default: unknown }).default;
    if (!isGeneratedCatalog(catalog)) {
      console.warn('[nerd-fonts] 静态目录格式校验失败，已降级到内置推荐列表。');
      return null;
    }
    return catalog.fonts;
  } catch (err) {
    console.warn('[nerd-fonts] 静态目录加载失败，已降级到内置推荐列表：', err);
    return null;
  }
}
```

- [ ] **步骤 2：类型检查通过**

运行：`npx vue-tsc --noEmit`
预期：无错误。
（如出现 JSON 模块隐式 any 警告，参考步骤 3。）

- [ ] **步骤 3：（按需）开启 JSON 模块解析**

如步骤 2 报错 `Cannot find module '../data/nerd-fonts-catalog.generated.json'`，在 `tsconfig.json` 的 `compilerOptions` 中确认存在 `"resolveJsonModule": true`；若缺失，添加并保存。

- [ ] **步骤 4：Commit**

```bash
git add src/services/nerdFontsCatalog.ts tsconfig.json
git commit -m "refactor(nerd-fonts): replace github fetch with static catalog import"
```

---

## 任务 5：改造 AddFontModal.vue 移除按钮与状态

**文件：**
- 修改：`src/components/sidebar/AddFontModal.vue`

- [ ] **步骤 1：调整 `<script setup>` 顶部 import**

将旧的：

```ts
import {
  fetchNerdFontsCatalog,
  loadCachedNerdFontsCatalog,
} from '../../services/nerdFontsCatalog';
```

替换为：

```ts
import { loadStaticNerdFontsCatalog } from '../../services/nerdFontsCatalog';
```

- [ ] **步骤 2：精简响应式状态**

定位 `AddFontModal.vue` 中以下声明（约第 28-35 行）：

```ts
const nerdLoading = ref(false);
const nerdError = ref('');
const nerdCatalogFonts = ref<NerdFontMeta[]>([]);
const nerdCatalogLoading = ref(false);
const nerdCatalogError = ref('');
const expandedNerdFontIds = ref<string[]>([]);
const isBusy = computed(() => loading.value || nerdLoading.value || nerdCatalogLoading.value);
```

替换为：

```ts
const nerdLoading = ref(false);
const nerdError = ref('');
const nerdCatalogFonts = ref<NerdFontMeta[]>([]);
const nerdCatalogLoaded = ref(false);
const expandedNerdFontIds = ref<string[]>([]);
const isBusy = computed(() => loading.value || nerdLoading.value);
```

- [ ] **步骤 3：替换 `watch(props.show)` 中的初始化逻辑**

定位 watch 块（约第 51-66 行），替换为：

```ts
watch(() => props.show, async (val) => {
  if (val) {
    urlInput.value = '';
    nameInput.value = '';
    error.value = '';
    nerdfontSearch.value = '';
    loading.value = false;
    nerdLoading.value = false;
    nerdError.value = '';
    await ensureNerdCatalogLoaded();
    await nextTick();
    urlInputRef.value?.focus();
  }
});
```

- [ ] **步骤 4：删除旧函数并新增 `ensureNerdCatalogLoaded`**

删除以下函数：

```ts
function restoreCachedNerdCatalog() { ... }
async function loadFullNerdCatalog() { ... }
```

新增：

```ts
async function ensureNerdCatalogLoaded() {
  if (nerdCatalogLoaded.value) return;
  nerdCatalogLoaded.value = true;
  const fonts = await loadStaticNerdFontsCatalog();
  if (fonts && fonts.length > 0) {
    nerdCatalogFonts.value = fonts;
  }
}
```

- [ ] **步骤 5：更新 `setActiveTab`**

定位 `setActiveTab`（约第 73-82 行），替换为：

```ts
function setActiveTab(tab: 'url' | 'file' | 'nerd') {
  if (isBusy.value) return;
  activeTab.value = tab;
  error.value = '';
  nerdError.value = '';
  if (tab === 'nerd') {
    void ensureNerdCatalogLoaded();
  }
}
```

- [ ] **步骤 6：替换模板中的 `.nerd-catalog-bar` 与错误提示**

定位模板里下述片段（约第 293-301 行）：

```html
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

替换为：

```html
<p class="field-hint nerd-catalog-status">
  {{ hasFullNerdCatalog
    ? `完整目录 · ${activeNerdFonts.length} 个家族`
    : '当前为推荐字体列表（完整目录加载失败）' }}
</p>
```

- [ ] **步骤 7：清理无用样式**

在 `<style>` 段中删除 `.nerd-catalog-bar`、`.nerd-catalog-btn`、`.error-hint`（如果不再被引用）相关规则。保留 `.nerd-catalog-status` 样式（或并入 `.field-hint`，按现有视觉保持即可）。

- [ ] **步骤 8：构建与冒烟**

运行：

```bash
npm run build
```

预期：vue-tsc 类型检查通过、Vite 构建产物输出正常。

运行：`npm run dev`，浏览器打开 → 添加字体 → Nerd Fonts tab：
- 网络面板**无** `api.github.com` 请求。
- 看到 50+ 家族列表（来自静态 JSON）。
- 点击某变体，能从 `raw.githubusercontent.com` 加载并应用到代码预览。

- [ ] **步骤 9：Commit**

```bash
git add src/components/sidebar/AddFontModal.vue
git commit -m "refactor(add-font-modal): drop runtime catalog fetch and buttons"
```

---

## 任务 6：降级路径冒烟

**文件：**
- 临时修改：`src/data/nerd-fonts-catalog.generated.json`（验证完恢复）

- [ ] **步骤 1：制造加载失败**

在 `nerd-fonts-catalog.generated.json` 顶部插入一行非法 JSON 字符（例如手动加 `XXX`）保存。

- [ ] **步骤 2：在 dev 模式验证降级**

运行：`npm run dev`，打开浏览器，触发 Nerd Fonts tab：
- 控制台出现 `[nerd-fonts] 静态目录...降级` warn 日志。
- UI 文本显示 `当前为推荐字体列表（完整目录加载失败）`。
- 列表退化为 `src/data/nerdFonts.ts` 中的 10 个推荐家族。
- 添加流程仍可用（任选 1 个推荐字体）。

- [ ] **步骤 3：恢复 JSON 文件**

```bash
git checkout -- src/data/nerd-fonts-catalog.generated.json
```

确认 `git status` 干净。

- [ ] **步骤 4：无需 commit（仅验证）**

---

## 任务 7：文档同步

**文件：**
- 修改：`AGENTS.md`
- 修改：`docs/superpowers/specs/2026-06-11-nerd-fonts-full-catalog-design.md`

- [ ] **步骤 1：在 AGENTS.md 关键约定段后追加维护说明**

在 `AGENTS.md` 中"关键约定"小节末尾追加：

```md
- Nerd Fonts 完整目录由 `npm run gen:nerd-fonts` 生成 `src/data/nerd-fonts-catalog.generated.json` 并 commit；运行时通过 dynamic import 加载，不再调用 GitHub REST API。需更新目录时手动重跑脚本，必要时设置 `GITHUB_TOKEN` 环境变量提升额度。
```

- [ ] **步骤 2：在旧设计文档文末追加替代说明**

在 `docs/superpowers/specs/2026-06-11-nerd-fonts-full-catalog-design.md` 文末追加：

```md

---

> **更新（2026-06-15）：** 本设计因 GitHub REST API 60/h 限速在生产中频繁失败，已被 [`2026-06-15-nerd-fonts-static-catalog-design.md`](./2026-06-15-nerd-fonts-static-catalog-design.md) 取代。当前实现为构建期生成静态 JSON + 运行时 dynamic import。
```

- [ ] **步骤 3：Commit**

```bash
git add AGENTS.md docs/superpowers/specs/2026-06-11-nerd-fonts-full-catalog-design.md
git commit -m "docs: document static nerd-fonts catalog workflow"
```

---

## 任务 8：最终验证

- [ ] **步骤 1：完整 build**

运行：`npm run build`
预期：vue-tsc 通过、Vite build 成功、`dist/` 产出。

- [ ] **步骤 2：dev 验证全链路**

运行：`npm run dev`，操作流程：
1. 打开「添加字体 → Nerd Fonts」。
2. 网络面板筛选 `github.com`：**0 条请求**。
3. 列表显示 50+ 家族。
4. 在搜索框输入 `Mono`，列表正常过滤。
5. 选一个未添加过的家族 → 点击 Regular 变体 → 字体加载成功并出现在侧栏。
6. 切换到主区域代码预览，看见新字体生效。

- [ ] **步骤 3：无需 commit（验证步骤）**

---

## 自检

**1. 规格覆盖度：**

- 数据契约 → 任务 2（脚本输出）。
- 变体精简规则 → 任务 1（`classifyWeight`/`scoreFile`）+ 任务 2（`pickVariants`）。
- 实现细节 1 生成脚本 → 任务 1、2。
- 实现细节 2 package.json → 任务 3。
- 实现细节 3.1 nerdFontsCatalog.ts → 任务 4。
- 实现细节 3.2 AddFontModal.vue → 任务 5。
- 实现细节 3.3 错误处理与降级 → 任务 4（`console.warn`）+ 任务 5（降级文案）+ 任务 6（验证）。
- 文档更新 → 任务 7。
- 测试与验证 → 任务 5 步骤 8 + 任务 6 + 任务 8。

**2. 占位符扫描：** 无 TODO / 后续实现 / 待定。代码块全部就位。

**3. 类型一致性：** `loadStaticNerdFontsCatalog` 在任务 4 定义、任务 5 引入；`GeneratedCatalog` schema 与任务 2 输出字段对齐（`generatedAt` / `source` / `schemaVersion` / `fonts`）；`NerdFontMeta` / `NerdFontVariant` 类型沿用 `src/data/nerdFonts.ts` 既有定义；`nerdCatalogLoaded` 哨兵在任务 5 步骤 2 与步骤 4 一致使用。

---

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-06-15-nerd-fonts-static-catalog.md`。两种执行方式：

1. **子代理驱动（推荐）** — 每个任务调度一个新的子代理，任务间进行审查，快速迭代。
2. **内联执行** — 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点。

选哪种方式？
