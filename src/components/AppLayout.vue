<script setup lang="ts">
import Sidebar from './sidebar/Sidebar.vue';
import MainContent from './content/MainContent.vue';
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <MainContent />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f8f8f0;
  font-family: 'Nunito', 'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif;
}
</style>
