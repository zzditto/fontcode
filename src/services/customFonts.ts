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

const DB_NAME = 'fontcode';
const DB_VERSION = 1;
const STORE_NAME = 'custom-fonts';
const FONT_SOURCES: CustomFont['source'][] = ['url', 'file', 'google-fonts', 'nerd-fonts'];
const FONT_FORMATS: CustomFont['format'][] = ['woff2', 'ttf', 'otf', 'woff'];

let dbPromise: Promise<IDBDatabase> | null = null;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isCustomFont(value: unknown): value is CustomFont {
  if (value == null || typeof value !== 'object') return false;
  const font = value as Partial<CustomFont>;
  const hasBlobData = font.blobData instanceof ArrayBuffer;
  const hasRemoteUrl = typeof font.remoteUrl === 'string' && isHttpUrl(font.remoteUrl);

  if (
    typeof font.id !== 'string' ||
    typeof font.name !== 'string' ||
    typeof font.fontFamily !== 'string' ||
    typeof font.source !== 'string' ||
    !FONT_SOURCES.includes(font.source as CustomFont['source']) ||
    typeof font.format !== 'string' ||
    !FONT_FORMATS.includes(font.format as CustomFont['format']) ||
    typeof font.addedAt !== 'number' ||
    !Number.isFinite(font.addedAt)
  ) {
    return false;
  }

  if (font.sourceUrl !== undefined && typeof font.sourceUrl !== 'string') return false;
  if (font.remoteUrl !== undefined && !hasRemoteUrl) return false;
  if (font.providerId !== undefined && typeof font.providerId !== 'string') return false;
  if (font.variant !== undefined && typeof font.variant !== 'string') return false;
  if (font.cached !== undefined && typeof font.cached !== 'boolean') return false;
  if (font.blobData !== undefined && !hasBlobData) return false;

  if (font.source === 'nerd-fonts') return hasBlobData || hasRemoteUrl;
  return hasBlobData;
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      dbPromise = null;
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(new Error('IndexedDB 被阻塞'));
    };
  });
  return dbPromise;
}

async function saveFont(font: CustomFont): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(font);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('保存字体失败'));
  });
}

export async function loadAllFonts(): Promise<CustomFont[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const raw = request.result as unknown[];
      resolve(raw.filter(isCustomFont));
    };
    request.onerror = () => reject(request.error ?? new Error('读取字体列表失败'));
  });
}

export async function getFontById(id: string): Promise<CustomFont | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => {
      const result = request.result as unknown;
      resolve(isCustomFont(result) ? result : undefined);
    };
    request.onerror = () => reject(request.error ?? new Error('读取字体失败'));
  });
}

async function removeFontById(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('删除字体失败'));
  });
}

export async function loadFontToDocument(font: CustomFont): Promise<void> {
  const family = extractFamilyName(font.fontFamily);
  const existing = Array.from(document.fonts.values()).find((f) => f.family === family);
  if (existing) return;
  const fontFace = font.blobData
    ? new FontFace(family, font.blobData)
    : font.remoteUrl
      ? new FontFace(family, `url(${JSON.stringify(font.remoteUrl)})`)
      : null;
  if (!fontFace) throw new Error('字体缺少可加载资源');
  await fontFace.load();
  document.fonts.add(fontFace);
}

async function downloadFont(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`下载失败: HTTP ${res.status}`);
    return res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

function parseGoogleFontsCss(css: string): { name: string; urls: string[] } {
  const familyMatch = css.match(/font-family\s*:\s*['"]([^'"]+)['"]/);
  const name = familyMatch?.[1] ?? 'Unknown Font';
  const urlMatches = css.matchAll(/url\((https:\/\/[^)]+)\)/g);
  const urls = Array.from(urlMatches, (m) => m[1]);
  return { name, urls };
}

function detectFormat(filename: string): CustomFont['format'] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.woff2')) return 'woff2';
  if (lower.endsWith('.ttf')) return 'ttf';
  if (lower.endsWith('.otf')) return 'otf';
  if (lower.endsWith('.woff')) return 'woff';
  return 'woff2';
}

function extractFamilyName(cssFamily: string): string {
  return cssFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
}

export async function addFontFromUrl(url: string, customName?: string): Promise<CustomFont> {
  const id = crypto.randomUUID();

  if (url.includes('fonts.googleapis.com')) {
    const cssRes = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!cssRes.ok) throw new Error(`获取 CSS 失败: HTTP ${cssRes.status}`);
    const cssText = await cssRes.text();
    const { name, urls } = parseGoogleFontsCss(cssText);

    if (urls.length === 0) {
      throw new Error('未在 CSS 中找到字体文件链接，请确认链接来自 Google Fonts');
    }

    const firstUrl = urls[0];
    const blobData = await downloadFont(firstUrl);
    const format = detectFormat(firstUrl);

    const font: CustomFont = {
      id,
      name: customName || name,
      fontFamily: `"${customName || name}", monospace`,
      source: 'google-fonts',
      sourceUrl: url,
      blobData,
      format,
      addedAt: Date.now(),
    };
    await saveFont(font);
    await loadFontToDocument(font);
    return font;
  }

  const blobData = await downloadFont(url);
  const autoName = url.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'Custom Font';
  const format = detectFormat(url);

  const font: CustomFont = {
    id,
    name: customName || autoName,
    fontFamily: `"${customName || autoName}", monospace`,
    source: 'url',
    sourceUrl: url,
    blobData,
    format,
    addedAt: Date.now(),
  };
  await saveFont(font);
  await loadFontToDocument(font);
  return font;
}

export async function addFontFromFile(file: File, customName?: string): Promise<CustomFont> {
  const id = crypto.randomUUID();
  const autoName = file.name.replace(/\.[^.]+$/, '');
  const format = detectFormat(file.name);

  const blobData = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const font: CustomFont = {
    id,
    name: customName || autoName,
    fontFamily: `"${customName || autoName}", monospace`,
    source: 'file',
    blobData,
    format,
    addedAt: Date.now(),
  };
  await saveFont(font);
  await loadFontToDocument(font);
  return font;
}

export async function addRemoteNerdFont(options: {
  name: string;
  fontFamily: string;
  remoteUrl: string;
  providerId: string;
  variant: string;
  format: CustomFont['format'];
}): Promise<CustomFont> {
  if (!isHttpUrl(options.remoteUrl)) throw new Error('字体远程链接无效');

  const font: CustomFont = {
    id: crypto.randomUUID(),
    name: options.name,
    fontFamily: options.fontFamily,
    source: 'nerd-fonts',
    remoteUrl: options.remoteUrl,
    providerId: options.providerId,
    variant: options.variant,
    cached: false,
    format: options.format,
    addedAt: Date.now(),
  };
  await loadFontToDocument(font);
  await saveFont(font);
  return font;
}

export async function cacheRemoteFont(id: string): Promise<CustomFont> {
  const font = await getFontById(id);
  if (!font) throw new Error('字体不存在');
  if (!font.remoteUrl) throw new Error('字体缺少远程链接');
  const blobData = await downloadFont(font.remoteUrl);
  const cachedFont: CustomFont = {
    ...font,
    blobData,
    cached: true,
  };
  await saveFont(cachedFont);
  return cachedFont;
}

export async function deleteFont(id: string, fontFamily: string): Promise<void> {
  await removeFontById(id);
  const family = extractFamilyName(fontFamily);
  const fontFaces = Array.from(document.fonts.values());
  const target = fontFaces.find((f) => f.family === family);
  if (target) document.fonts.delete(target);
}
