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
