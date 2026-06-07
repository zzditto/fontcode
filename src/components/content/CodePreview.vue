<script setup lang="ts">
import { inject, computed } from 'vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import { snippets } from '../../data/snippets';
import { getFontByName } from '../../data/fonts';
import { storeKey } from '../../store';

const store = inject(storeKey)!;

const currentSnippet = computed(() =>
  snippets.find((s) => s.key === store.activeSnippet)
);

const currentFont = computed(() => getFontByName(store.selectedFont));

const highlightedCode = computed(() => {
  if (!currentSnippet.value) return '';
  const lang = Prism.languages[currentSnippet.value.language];
  if (!lang) return currentSnippet.value.code;
  return Prism.highlight(
    currentSnippet.value.code,
    lang,
    currentSnippet.value.language
  );
});

const fontFamily = computed(() => currentFont.value?.fontFamily ?? 'monospace');

const themeClass = computed(() =>
  `theme-${store.theme}`
);
</script>

<template>
  <div
    :id="'code-panel'"
    role="tabpanel"
    :aria-labelledby="'tab-' + (currentSnippet?.key ?? '')"
    :class="['code-preview-wrapper', themeClass]"
    :style="{
      fontFamily: fontFamily,
      fontSize: store.fontSize + 'px',
    }"
  >
    <pre><code class="language-plain" v-html="highlightedCode"></code></pre>
  </div>
</template>

<style>
@import '../../styles/code-themes.css';
</style>
