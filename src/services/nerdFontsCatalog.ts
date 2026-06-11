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
  truncated?: boolean;
}

interface NerdFontsCatalogCache {
  version: 1;
  cachedAt: number;
  fonts: NerdFontMeta[];
}

function slugify(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDisplayName(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

function getFormat(filename: string): NerdFontVariant['format'] {
  return filename.toLowerCase().endsWith('.otf') ? 'otf' : 'ttf';
}

function parseFontPath(path: string) {
  const parts = path.split('/');
  const family = parts[1];
  const filename = parts[parts.length - 1];
  if (!family || !filename || !/\.(ttf|otf)$/i.test(filename)) return null;
  return { family, filename, basename: stripExtension(filename) };
}

function buildFontFamily(basename: string): string {
  const family = basename
    .replace(/-.+$/, '')
    .replace(/NerdFont/g, ' Nerd Font ')
    .replace(/\s+/g, ' ')
    .trim();
  return `"${family}", monospace`;
}

function buildVariantLabel(basename: string): string {
  const label = basename
    .replace(/^[^-]*NerdFont/, '')
    .replace(/-/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return label || toDisplayName(basename);
}

function getRecommendationScore(filename: string): number {
  if (filename.includes('NerdFontMono-Regular')) return 100;
  if (filename.includes('NerdFont-Regular')) return 90;
  if (filename.includes('Mono-Regular')) return 80;
  if (filename.includes('Regular')) return 70;
  return 0;
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

function parseCatalog(tree: GitHubTreeItem[]): NerdFontMeta[] {
  const grouped = new Map<string, NerdFontVariant[]>();

  for (const item of tree) {
    const path = item.path;
    if (item.type !== 'blob' || !path?.startsWith('patched-fonts/') || !/\.(ttf|otf)$/i.test(path)) continue;

    const parsed = parseFontPath(path);
    if (!parsed) continue;

    const variants = grouped.get(parsed.family) ?? [];
    variants.push({
      id: `${slugify(parsed.family)}-${slugify(parsed.basename)}`,
      label: buildVariantLabel(parsed.basename),
      fontFamily: buildFontFamily(parsed.basename),
      url: `${RAW_BASE_URL}/${encodePath(path)}`,
      format: getFormat(parsed.filename),
    });
    grouped.set(parsed.family, variants);
  }

  return Array.from(grouped.entries())
    .map(([family, variants]) => {
      const sortedVariants = variants.sort((a, b) => a.label.localeCompare(b.label));
      let recommendedIndex = 0;
      let recommendedScore = -1;

      sortedVariants.forEach((variant, index) => {
        const urlParts = variant.url.split('/');
        const filename = urlParts[urlParts.length - 1] ?? '';
        const score = getRecommendationScore(decodeURIComponent(filename));
        if (score > recommendedScore) {
          recommendedScore = score;
          recommendedIndex = index;
        }
      });
      sortedVariants[recommendedIndex].recommended = true;

      return {
        id: slugify(family),
        name: toDisplayName(family),
        description: `来自 Nerd Fonts 完整目录，包含 ${variants.length} 个可用变体。`,
        variants: sortedVariants,
      } satisfies NerdFontMeta;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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

function isCatalogCache(value: unknown): value is NerdFontsCatalogCache {
  if (value == null || typeof value !== 'object') return false;
  const cache = value as Partial<NerdFontsCatalogCache>;
  return (
    cache.version === CATALOG_CACHE_VERSION &&
    typeof cache.cachedAt === 'number' &&
    Number.isFinite(cache.cachedAt) &&
    Array.isArray(cache.fonts) &&
    cache.fonts.every(isNerdFontMeta)
  );
}

function getLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function removeNerdFontsCatalogCache(storage: Storage): void {
  try {
    storage.removeItem(CATALOG_CACHE_KEY);
  } catch {
    return;
  }
}

export function loadCachedNerdFontsCatalog(): NerdFontMeta[] | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as unknown;
    if (!isCatalogCache(cache)) {
      removeNerdFontsCatalogCache(storage);
      return null;
    }

    return cache.fonts;
  } catch {
    removeNerdFontsCatalogCache(storage);
    return null;
  }
}

export function saveNerdFontsCatalogCache(fonts: NerdFontMeta[]): void {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    const cache: NerdFontsCatalogCache = {
      version: CATALOG_CACHE_VERSION,
      cachedAt: Date.now(),
      fonts,
    };
    storage.setItem(CATALOG_CACHE_KEY, JSON.stringify(cache));
  } catch {
    return;
  }
}

export async function fetchNerdFontsCatalog(): Promise<NerdFontMeta[]> {
  const response = await fetch(GITHUB_TREE_URL);
  if (!response.ok) throw new Error(`获取 Nerd Fonts 目录失败: HTTP ${response.status}`);

  const data = (await response.json()) as GitHubTreeResponse;
  if (data.truncated || !Array.isArray(data.tree)) throw new Error('Nerd Fonts 目录响应无效');

  const fonts = parseCatalog(data.tree);
  if (fonts.length === 0) throw new Error('Nerd Fonts 目录为空');

  saveNerdFontsCatalogCache(fonts);
  return fonts;
}
