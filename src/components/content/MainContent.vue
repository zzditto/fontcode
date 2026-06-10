<script setup lang="ts">
import CodeTabs from './CodeTabs.vue';
import CodePreview from './CodePreview.vue';
</script>

<template>
  <main class="main-content">
    <CodeTabs />
    <CodePreview />
  </main>
</template>

<style scoped>
.main-content {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  min-width: 0;
}

.main-content > :last-child {
  flex: 1;
  min-height: 0;
}
</style>
