<script setup lang="ts">
import { inject } from 'vue';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

function onInput(e: Event) {
  store.fontSize = Number((e.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="font-size-control">
    <div class="size-label">
      <span>字号</span>
      <span class="size-value">{{ store.fontSize }}px</span>
    </div>
    <input
      type="range"
      :min="12"
      :max="24"
      :value="store.fontSize"
      @input="onInput"
      class="size-slider"
      aria-label="字号调节"
    />
  </div>
</template>

<style scoped>
.font-size-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.size-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #725d42;
  padding: 0 4px;
}

.size-value {
  color: #19c8b9;
  font-weight: 700;
}

.size-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #d4c9b4;
  outline: none;
  cursor: pointer;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #19c8b9;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.size-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.size-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #19c8b9;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.size-slider:focus-visible {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}
</style>
