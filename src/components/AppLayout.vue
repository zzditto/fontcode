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

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

body {
  background: #f8f8f0;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f8f8f0;
  font-family: 'Nunito', 'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif;
}
</style>
