<script setup lang="ts">
import { inject } from 'vue';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

function setTheme(theme: 'dark' | 'light') {
  store.theme = theme;
}
</script>

<template>
  <div class="theme-toggle">
    <button
      :class="['theme-btn', { active: store.theme === 'light' }]"
      @click="setTheme('light')"
      :aria-pressed="store.theme === 'light'"
    >
      ☀️ 浅色
    </button>
    <button
      :class="['theme-btn', { active: store.theme === 'dark' }]"
      @click="setTheme('dark')"
      :aria-pressed="store.theme === 'dark'"
    >
      🌙 深色
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #c4b89e;
  border-radius: 50px;
  background: transparent;
  color: #725d42;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.theme-btn:hover {
  border-color: #19c8b9;
}

.theme-btn.active {
  background: #19c8b9;
  border-color: #19c8b9;
  color: #fff;
}

.theme-btn:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
