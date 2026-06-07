<script setup lang="ts">
import { inject } from 'vue';
import { snippets } from '../../data/snippets';
import { storeKey } from '../../store';

const store = inject(storeKey)!;
</script>

<template>
  <nav class="code-tabs" role="tablist" aria-label="代码片段选择">
    <button
      v-for="snip in snippets"
      :key="snip.key"
      role="tab"
      :aria-selected="store.activeSnippet === snip.key"
      :class="['tab-btn', { active: store.activeSnippet === snip.key }]"
      @click="store.activeSnippet = snip.key"
    >
      {{ snip.label }}
    </button>
  </nav>
</template>

<style scoped>
.code-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.tab-btn {
  padding: 8px 18px;
  border: 2px solid transparent;
  border-radius: 50px;
  background: transparent;
  color: #9f927d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.tab-btn:hover {
  color: #725d42;
  background: rgba(25, 200, 185, 0.06);
}

.tab-btn.active {
  background: rgba(25, 200, 185, 0.12);
  color: #19c8b9;
  border-color: rgba(25, 200, 185, 0.3);
}

.tab-btn:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
