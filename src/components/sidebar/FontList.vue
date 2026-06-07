<script setup lang="ts">
import { inject } from 'vue';
import { fonts } from '../../data/fonts';
import { storeKey } from '../../store';
import { deleteFont } from '../../services/customFonts';

const store = inject(storeKey)!;

const emit = defineEmits<{
  (e: 'addFont'): void;
}>();

function selectFont(name: string) {
  store.selectedFont = name;
}

async function handleDelete(id: string) {
  const idx = store.customFonts.findIndex((f) => f.id === id);
  if (idx === -1) return;
  const font = store.customFonts[idx];
  try {
    await deleteFont(font.id, font.fontFamily);
  } catch {
    // IndexedDB 删除失败不影响 UI 状态
  }
  store.customFonts.splice(idx, 1);
  if (store.selectedFont === font.name) {
    store.selectedFont = fonts[0].name;
  }
}
</script>

<template>
  <div class="font-list">
    <!-- Custom Fonts Section -->
    <template v-if="store.customFonts.length > 0">
      <div class="section-label">自定义字体</div>
      <button
        v-for="font in store.customFonts"
        :key="font.id"
        :class="['font-item', 'custom-item', { active: store.selectedFont === font.name }]"
        @click="selectFont(font.name)"
        :aria-pressed="store.selectedFont === font.name"
      >
        <span class="font-name">{{ font.name }}</span>
        <span
          class="delete-btn"
          @click.stop="handleDelete(font.id)"
          title="删除字体"
          tabindex="0"
          @keydown.enter.prevent="handleDelete(font.id)"
          @keydown.space.prevent="handleDelete(font.id)"
        >&times;</span>
      </button>
    </template>

    <!-- Built-in Fonts Section -->
    <div class="section-label">内置字体</div>
    <button
      v-for="font in fonts"
      :key="font.id"
      :class="['font-item', { active: store.selectedFont === font.name }]"
      @click="selectFont(font.name)"
      :aria-pressed="store.selectedFont === font.name"
    >
      {{ font.name }}
    </button>

    <!-- Add Font Button -->
    <button class="add-font-btn" @click="emit('addFont')">
      + 添加字体
    </button>
  </div>
</template>

<style scoped>
.font-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 4px 2px;
  margin-top: 4px;
}

.font-item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #725d42;
  text-align: left;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.font-item:hover {
  background: rgba(25, 200, 185, 0.1);
}

.font-item.active {
  background: #19c8b9;
  color: #fff;
}

.font-item:focus-visible {
  outline: 2px solid #19c8b9;
  outline-offset: -2px;
}

.custom-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.font-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  flex-shrink: 0;
  margin-left: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  color: #a0936e;
  transition: all 0.15s ease;
}

.custom-item:not(.active) .delete-btn:hover {
  background: rgba(217, 91, 91, 0.15);
  color: #d95b5b;
}

.custom-item.active .delete-btn {
  color: rgba(255, 255, 255, 0.7);
}

.custom-item.active .delete-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.add-font-btn {
  display: block;
  width: 100%;
  border: 2px dashed #19c8b9;
  background: transparent;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #19c8b9;
  text-align: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  margin-top: 4px;
}

.add-font-btn:hover {
  background: rgba(25, 200, 185, 0.08);
}

.add-font-btn:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
