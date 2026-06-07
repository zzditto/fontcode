<script setup lang="ts">
import { ref } from 'vue';
import FontList from './FontList.vue';
import FontSizeSlider from './FontSizeSlider.vue';
import ThemeToggle from './ThemeToggle.vue';
import FontInfo from './FontInfo.vue';
import AddFontModal from './AddFontModal.vue';

const showAddModal = ref(false);
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">FontCode</div>
    <div class="sidebar-section">
      <div class="section-label">编程字体</div>
      <FontList @add-font="showAddModal = true" />
    </div>
    <div class="sidebar-section">
      <FontSizeSlider />
    </div>
    <div class="sidebar-section">
      <div class="section-label">主题</div>
      <ThemeToggle />
    </div>
    <div class="sidebar-footer">
      <FontInfo />
    </div>
  </aside>

  <AddFontModal
    :show="showAddModal"
    @close="showAddModal = false"
    @imported="showAddModal = false"
  />
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  background: #f7f3df;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 2px solid #d4c9b4;
  overflow-y: auto;
}

.sidebar-header {
  font-size: 20px;
  font-weight: 700;
  color: #794f27;
  padding: 4px 8px 12px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 4px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 8px;
}
</style>
