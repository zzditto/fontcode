<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { store } from '../../store';
import { addFontFromUrl, addFontFromFile, addRemoteNerdFont } from '../../services/customFonts';
import { nerdFonts, type NerdFontMeta, type NerdFontVariant } from '../../data/nerdFonts';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported'): void;
}>();

const activeTab = ref<'url' | 'file' | 'nerd'>('url');
const urlInput = ref('');
const nameInput = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const urlInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const error = ref('');
const nerdfontSearch = ref('');
const nerdLoading = ref(false);
const nerdError = ref('');
const isBusy = computed(() => loading.value || nerdLoading.value);

const filteredNerdFonts = computed(() => {
  const keyword = nerdfontSearch.value.trim().toLowerCase();
  if (!keyword) return nerdFonts;
  return nerdFonts.filter((font) =>
    font.name.toLowerCase().includes(keyword) ||
    font.description.toLowerCase().includes(keyword)
  );
});

watch(() => props.show, async (val) => {
  if (val) {
    urlInput.value = '';
    nameInput.value = '';
    error.value = '';
    nerdfontSearch.value = '';
    nerdError.value = '';
    loading.value = false;
    nerdLoading.value = false;
    await nextTick();
    urlInputRef.value?.focus();
  }
});

function closeModal() {
  if (isBusy.value) return;
  emit('close');
}

function setActiveTab(tab: 'url' | 'file' | 'nerd') {
  if (isBusy.value) return;
  activeTab.value = tab;
  error.value = '';
  nerdError.value = '';
}

function isNerdFontAdded(meta: NerdFontMeta, variant: NerdFontVariant) {
  const providerId = `${meta.id}/${variant.id}`;
  return store.customFonts.some((font) =>
    font.source === 'nerd-fonts' && font.providerId === providerId
  );
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  if (e.key !== 'Tab' || !props.show) return;
  const modal = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('.modal');
  if (!modal) return;
  const focusable = modal.querySelectorAll<HTMLElement>(
    'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey && (active === first || !modal.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

async function handleNerdFontImport(meta: NerdFontMeta, variant: NerdFontVariant) {
  if (isBusy.value || isNerdFontAdded(meta, variant)) return;

  nerdError.value = '';
  nerdLoading.value = true;
  try {
    const font = await addRemoteNerdFont({
      name: `${meta.name} Nerd Font ${variant.label}`,
      fontFamily: variant.fontFamily,
      remoteUrl: variant.url,
      providerId: `${meta.id}/${variant.id}`,
      variant: variant.id,
      format: variant.format,
    });
    store.customFonts.push(font);
    store.selectedFont = font.name;
    emit('imported');
    emit('close');
  } catch {
    nerdError.value = '在线字体加载失败，可稍后重试或使用本地字体导入。';
  } finally {
    nerdLoading.value = false;
  }
}

async function handleImport() {
  if (isBusy.value) return;
  error.value = '';

  if (activeTab.value === 'url') {
    const url = urlInput.value.trim();
    if (!url) {
      error.value = '请输入字体链接';
      return;
    }
    loading.value = true;
    try {
      const font = await addFontFromUrl(url, nameInput.value.trim() || undefined);
      store.customFonts.push(font);
      store.selectedFont = font.name;
      emit('imported');
      emit('close');
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '导入失败，请检查链接是否正确';
    } finally {
      loading.value = false;
    }
  } else {
    const file = fileInput.value?.files?.[0];
    if (!file) {
      error.value = '请选择字体文件';
      return;
    }
    loading.value = true;
    try {
      const font = await addFontFromFile(file, nameInput.value.trim() || undefined);
      store.customFonts.push(font);
      store.selectedFont = font.name;
      emit('imported');
      emit('close');
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '导入失败，请检查文件格式';
    } finally {
      loading.value = false;
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      @click.self="closeModal"
      @keydown="handleKeydown"
    >
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title" class="modal-title">添加自定义字体</h3>

        <div class="tab-bar">
          <button
            :class="['tab', { active: activeTab === 'url' }]"
            :disabled="isBusy"
            @click="setActiveTab('url')"
          >
            网站字体
          </button>
          <button
            :class="['tab', { active: activeTab === 'file' }]"
            :disabled="isBusy"
            @click="setActiveTab('file')"
          >
            本地字体
          </button>
          <button
            :class="['tab', { active: activeTab === 'nerd' }]"
            :disabled="isBusy"
            @click="setActiveTab('nerd')"
          >
            Nerd Fonts
          </button>
        </div>

        <div class="modal-body">
          <div v-if="activeTab === 'url'" class="tab-content">
            <label class="field-label">字体链接</label>
            <input
              ref="urlInputRef"
              v-model="urlInput"
              type="url"
              class="field-input"
              placeholder="https://fonts.googleapis.com/css2?family=..."
              :disabled="isBusy"
            />
            <p class="field-hint">
              支持 Google Fonts 链接或直链 .woff2/.ttf/.otf 文件
            </p>
          </div>

          <div v-if="activeTab === 'file'" class="tab-content">
            <label class="field-label">字体文件</label>
            <input
              ref="fileInput"
              type="file"
              accept=".woff2,.ttf,.otf,.woff"
              class="field-input"
              :disabled="isBusy"
            />
            <p class="field-hint">
              支持 .woff2 / .ttf / .otf / .woff 格式
            </p>
          </div>

          <div v-if="activeTab === 'nerd'" class="tab-content">
            <label class="field-label">搜索 Nerd Fonts</label>
            <input
              v-model="nerdfontSearch"
              type="search"
              class="field-input"
              placeholder="搜索字体名称或简介"
              :disabled="isBusy"
            />
            <div class="nerd-font-list">
              <div
                v-for="font in filteredNerdFonts"
                :key="font.id"
                class="nerd-font-item"
              >
                <div class="nerd-font-header">
                  <span class="nerd-font-name">{{ font.name }}</span>
                  <span class="nerd-font-badge">Nerd Fonts</span>
                </div>
                <p class="nerd-font-desc">{{ font.description }}</p>
                <div class="nerd-font-actions">
                  <button
                    v-for="variant in font.variants"
                    :key="variant.id"
                    class="nerd-variant-btn"
                    :disabled="isBusy || isNerdFontAdded(font, variant)"
                    @click="handleNerdFontImport(font, variant)"
                  >
                    {{ isNerdFontAdded(font, variant) ? '已添加' : variant.label }}
                  </button>
                </div>
              </div>
            </div>
            <p v-if="filteredNerdFonts.length === 0" class="field-hint">没有找到匹配的 Nerd Fonts</p>
          </div>

          <template v-if="activeTab !== 'nerd'">
            <label class="field-label">字体名称（可选）</label>
            <input
              v-model="nameInput"
              type="text"
              class="field-input"
              placeholder="留空则自动检测"
              :disabled="isBusy"
            />
          </template>

          <p v-if="error || nerdError" class="error-msg">{{ error || nerdError }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal" :disabled="isBusy">
            取消
          </button>
          <button
            v-if="activeTab !== 'nerd'"
            class="btn-import"
            @click="handleImport"
            :disabled="isBusy"
          >
            {{ loading ? '导入中...' : '导入字体' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fefcf5;
  border-radius: 20px;
  padding: 28px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #794f27;
  margin: 0;
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: #f0ebd8;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #a0936e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.tab.active {
  background: #19c8b9;
  color: #fff;
}

.tab:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #d4c9b4;
  border-radius: 12px;
  font-size: 13px;
  color: #725d42;
  background: #fffdf7;
  transition: border-color 0.15s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: #19c8b9;
}

.field-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-hint {
  font-size: 11px;
  color: #a0936e;
  margin: 0;
}

.error-msg {
  font-size: 12px;
  color: #d95b5b;
  margin: 0;
  white-space: pre-wrap;
}

.nerd-font-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.nerd-font-item {
  padding: 12px;
  border: 2px solid #efe5ce;
  border-radius: 14px;
  background: #fffdf7;
}

.nerd-font-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.nerd-font-name {
  font-size: 14px;
  font-weight: 700;
  color: #794f27;
}

.nerd-font-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e4faf7;
  color: #15a99d;
  font-size: 10px;
  font-weight: 700;
}

.nerd-font-desc {
  margin: 6px 0 0;
  color: #8d7a5b;
  font-size: 12px;
  line-height: 1.5;
}

.nerd-font-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.nerd-variant-btn {
  padding: 7px 14px;
  border: none;
  border-radius: 50px;
  background: #19c8b9;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.nerd-variant-btn:hover:not(:disabled) {
  background: #15b0a3;
}

.nerd-variant-btn:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}

.nerd-variant-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.btn-cancel {
  padding: 10px 20px;
  border: 2px solid #d4c9b4;
  border-radius: 50px;
  background: transparent;
  color: #a0936e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-cancel:hover:not(:disabled) {
  border-color: #19c8b9;
  color: #19c8b9;
}

.btn-cancel:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}

.btn-import {
  padding: 10px 20px;
  border: none;
  border-radius: 50px;
  background: #19c8b9;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-import:hover:not(:disabled) {
  background: #15b0a3;
}

.btn-import:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}

.btn-import:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
