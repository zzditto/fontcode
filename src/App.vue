<script setup lang="ts">
import { provide } from 'vue';
import { store, storeKey } from './store';
import AppLayout from './components/AppLayout.vue';

provide(storeKey, store);
</script>

<template>
  <AppLayout />
</template>
