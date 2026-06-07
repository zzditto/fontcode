<script setup lang="ts">
import { provide, onMounted } from 'vue';
import { store, storeKey } from './store';
import { loadAllFonts, loadFontToDocument } from './services/customFonts';
import AppLayout from './components/AppLayout.vue';

provide(storeKey, store);

onMounted(async () => {
  try {
    const fonts = await loadAllFonts();
    store.customFonts = fonts;
    for (const font of fonts) {
      try {
        await loadFontToDocument(font);
      } catch {
        // 该字体加载失败（文件损坏等），跳过但保留记录
      }
    }
  } catch {
    // IndexedDB 不可用（Safari 私有模式等），降级为空列表
  }
});
</script>

<template>
  <AppLayout />
</template>
