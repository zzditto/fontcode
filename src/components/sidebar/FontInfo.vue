<script setup lang="ts">
import { inject, computed } from 'vue';
import { Card } from 'animal-island-vue';
import { getFontByName } from '../../data/fonts';
import { storeKey } from '../../store';
import type { CustomFont } from '../../services/customFonts';

const store = inject(storeKey)!;

const builtInInfo = computed(() => getFontByName(store.selectedFont));

const customInfo = computed<CustomFont | undefined>(() =>
  store.customFonts.find((f) => f.name === store.selectedFont)
);

const currentFont = computed(() => builtInInfo.value ?? customInfo.value ?? null);

const sourceLabel = computed(() => {
  const info = customInfo.value;

  if (!info) return '';

  switch (info.source) {
    case 'nerd-fonts':
      return info.cached ? 'Nerd Fonts · 已缓存' : 'Nerd Fonts · 在线';
    case 'google-fonts':
      return 'Google Fonts';
    case 'file':
      return '本地文件';
    case 'url':
      return '远程链接';
  }
});
</script>

<template>
  <div class="font-info" v-if="currentFont">
    <Card>
      <div class="info-card">
        <div class="info-name">{{ currentFont.name }}</div>
        <template v-if="builtInInfo">
          <div class="info-row">
            <span class="info-label">设计者</span>
            <span class="info-value">{{ builtInInfo.designer }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">许可证</span>
            <span class="info-value">{{ builtInInfo.license }}</span>
          </div>
        </template>
        <template v-else>
          <div class="custom-tag">自定义字体</div>
          <div class="info-row">
            <span class="info-label">来源</span>
            <span class="info-value">{{ sourceLabel }}</span>
          </div>
        </template>
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

.custom-tag {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 50px;
  background: rgba(25, 200, 185, 0.12);
  color: #19c8b9;
  font-size: 11px;
  font-weight: 600;
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
