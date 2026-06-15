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

main().catch((err) => {
  console.error('生成失败：', err.message ?? err);
  process.exit(1);
});
