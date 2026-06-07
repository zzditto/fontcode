<script setup lang="ts">
import { inject, computed } from 'vue';
import { Card } from 'animal-island-vue';
import { getFontByName } from '../../data/fonts';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

const currentFont = computed(() => getFontByName(store.selectedFont));
</script>

<template>
  <div class="font-info" v-if="currentFont">
    <Card>
      <div class="info-card">
        <div class="info-name">{{ currentFont.name }}</div>
        <div class="info-row">
          <span class="info-label">设计者</span>
          <span class="info-value">{{ currentFont.designer }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">许可证</span>
          <span class="info-value">{{ currentFont.license }}</span>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.font-info {
  width: 100%;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-name {
  font-size: 16px;
  font-weight: 700;
  color: #794f27;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-label {
  font-size: 10px;
  font-weight: 600;
  color: #a0936e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 12px;
  font-weight: 500;
  color: #725d42;
  line-height: 1.4;
}
</style>
