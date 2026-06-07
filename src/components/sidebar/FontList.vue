<script setup lang="ts">
import { inject } from 'vue';
import { fonts } from '../../data/fonts';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

function selectFont(name: string) {
  store.selectedFont = name;
}
</script>

<template>
  <div class="font-list">
    <button
      v-for="font in fonts"
      :key="font.id"
      :class="['font-item', { active: store.selectedFont === font.name }]"
      @click="selectFont(font.name)"
      :aria-pressed="store.selectedFont === font.name"
    >
      {{ font.name }}
    </button>
  </div>
</template>

<style scoped>
.font-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
</style>
