# Nerd Fonts 在线添加设计

## 背景

当前“添加字体”弹窗支持两种方式：

- 网站字体：Google Fonts CSS 链接或字体文件直链。
- 本地字体：上传 `.woff2` / `.ttf` / `.otf` / `.woff` 文件。

Nerd Fonts 官方下载页主要提供 zip 包。zip 包体积大，并且包含多个格式、粗细、斜体、Mono、Propo 等变体，不适合在当前纯前端应用中作为默认导入方式。

Nerd Fonts 仓库中存在可直接访问的单个补丁字体文件，例如 `patched-fonts/<font>/<variant>/<file>.ttf`，可通过 GitHub raw URL 在线加载。单个 Regular 字体通常约 2–3MB，明显优于下载完整 zip 包。

## 目标

新增“封装字体 / Nerd Fonts”Tab，用于在线添加 Nerd Fonts 字体。

用户可以：

1. 在添加字体弹窗中进入 Nerd Fonts Tab。
2. 搜索或浏览精选 Nerd Fonts 字体。
3. 选择默认变体，优先使用 `Regular Mono`，无 Mono 时使用 `Regular`。
4. 点击“在线使用”，将字体加入左侧自定义字体列表。
5. 字体首次被使用时通过 URL 在线加载。
6. 可选将在线字体缓存到 IndexedDB，获得离线可用能力。

## 非目标

本阶段不做以下内容：

- 不下载或解析 Nerd Fonts zip 包。
- 不实现全量 Nerd Fonts 字体目录。
- 不自动从 GitHub API 同步字体清单。
- 不实现复杂的字体粗细、斜体组合管理。
- 不引入后端服务。

## 用户体验

### 入口

保持现有左侧“+ 添加字体”按钮不变。点击后打开 `AddFontModal.vue`。

弹窗 Tab 从两个扩展为三个：

1. 网站字体
2. 本地字体
3. Nerd Fonts

### Nerd Fonts Tab

Nerd Fonts Tab 包含：

- 搜索框：按字体名称和简介过滤。
- 字体卡片列表：显示字体名称、简介、来源标记和可用变体。
- 变体选择：默认选中 `Mono Regular`，如果不存在则选中 `Regular`。
- 操作按钮：
  - “在线使用”：添加远程字体，不立即下载到 IndexedDB。
  - 已添加状态：避免重复添加同一个字体变体。

### 左侧列表

在线 Nerd Fonts 添加后显示在当前“自定义字体”区域中。字体名称建议格式：

- `JetBrainsMono Nerd Font Mono`
- `FiraCode Nerd Font Mono`
- `Hack Nerd Font Mono`

后续如需更明确，可在 FontInfo 中显示来源为 `Nerd Fonts · 在线` 或 `Nerd Fonts · 已缓存`。

## 数据模型

扩展 `CustomFont`：

```ts
export interface CustomFont {
  id: string;
  name: string;
  fontFamily: string;
  source: 'url' | 'file' | 'google-fonts' | 'nerd-fonts';
  sourceUrl?: string;
  remoteUrl?: string;
  providerId?: string;
  variant?: string;
  cached?: boolean;
  blobData?: ArrayBuffer;
  format: 'woff2' | 'ttf' | 'otf' | 'woff';
  addedAt: number;
}
```

兼容性要求：

- 老数据仍然有效。
- `blobData` 从必填改为可选。
- 加载旧字体时，`source !== 'nerd-fonts'` 的记录仍按 `blobData` 加载。
- 在线 Nerd Fonts 可只保存 `remoteUrl`，不保存 `blobData`。

## Nerd Fonts 元数据

新增精选元数据文件，例如 `src/data/nerdFonts.ts`。

每个条目包含：

```ts
export interface NerdFontMeta {
  id: string;
  name: string;
  description: string;
  variants: NerdFontVariant[];
}

export interface NerdFontVariant {
  id: string;
  label: string;
  fontFamily: string;
  url: string;
  format: 'ttf';
  recommended?: boolean;
}
```

首批精选 10–20 个字体即可，例如：

- JetBrainsMono
- FiraCode
- Hack
- CascadiaCode
- CascadiaMono
- Iosevka
- IosevkaTerm
- MesloLG
- SourceCodePro
- UbuntuMono
- VictorMono
- Mononoki

URL 使用 Nerd Fonts GitHub raw 单文件地址。每个字体优先提供 `NerdFontMono-Regular.ttf`；如果该字体结构不同，则手工确认并提供可用 Regular 变体。

## 服务层设计

在 `src/services/customFonts.ts` 中新增能力：

### 添加在线 Nerd Font

新增函数：

```ts
export async function addRemoteNerdFont(meta: NerdFontMeta, variant: NerdFontVariant): Promise<CustomFont>
```

行为：

1. 创建 `CustomFont` 记录。
2. `source` 设为 `nerd-fonts`。
3. `remoteUrl` 和 `sourceUrl` 保存单文件 URL。
4. `cached` 设为 `false`。
5. 保存到 IndexedDB。
6. 调用 `loadFontToDocument` 在线加载字体。
7. 返回字体记录。

### 加载字体

更新 `loadFontToDocument(font)`：

- 如果 `font.blobData` 存在，继续使用 `new FontFace(family, font.blobData)`。
- 如果 `font.remoteUrl` 存在，使用 `new FontFace(family, `url(${font.remoteUrl})`)`。
- 如果两者都不存在，抛出“字体缺少可加载资源”。

### 缓存在线字体

新增函数：

```ts
export async function cacheRemoteFont(id: string): Promise<CustomFont>
```

行为：

1. 根据 `id` 读取字体记录。
2. 下载 `remoteUrl`。
3. 将 ArrayBuffer 写入 `blobData`。
4. 将 `cached` 更新为 `true`。
5. 保存记录。
6. 返回更新后的字体。

本阶段 UI 可先不暴露缓存按钮，但服务层预留能力；如果实现成本低，可在 FontInfo 或 Nerd Fonts 已添加状态处展示“缓存到本地”。

## 错误处理

### 在线加载失败

如果 GitHub raw 请求失败、超时或字体加载失败：

- Nerd Fonts Tab 显示错误：`在线字体加载失败，可稍后重试或使用本地字体导入。`
- 不把失败字体加入列表，避免无效记录。

### 重复添加

如果用户尝试添加同一 `providerId + variant`：

- 不创建重复记录。
- 可直接切换到已存在字体。

### 缓存失败

如果“缓存到本地”失败：

- 保留在线字体记录。
- 显示错误：`缓存失败，字体仍可在线使用。`

## 扩展性

虽然本阶段只实现 Nerd Fonts，但数据结构预留 Provider 思路：

- `providerId` 表示来源内的唯一字体变体。
- `remoteUrl` 表示在线字体资源。
- `source` 表示来源类型。

未来可新增 `src/data/fontProviders.ts`，将 Google Fonts、Nerd Fonts、自建 CDN 等统一为 Provider。

## 验证

实现完成后运行：

```bash
npm run build
```

验收标准：

1. 添加字体弹窗出现 Nerd Fonts Tab。
2. 能搜索精选 Nerd Fonts。
3. 点击“在线使用”后字体加入左侧自定义字体列表。
4. 选择该字体后代码预览区字体生效。
5. 刷新页面后在线字体记录仍存在，并能重新加载。
6. 旧的 Google Fonts、本地字体导入功能不受影响。
7. 构建通过。