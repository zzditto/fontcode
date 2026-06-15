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
