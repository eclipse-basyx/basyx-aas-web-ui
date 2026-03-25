<template>
  <header class="bg-white border-b border-gray-300 shadow-sm">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <!-- NextLevel Logo -->
      <RouterLink :to="{ name: 'AASViewer' }">
        <img alt="NextLevel Logo" class="h-10 w-auto" src="@/assets/images/next-level-mittelstand-light.svg">
      </RouterLink>

      <!-- Powered by BaSyx Logo -->
      <img
        alt="Powered by BaSyx"
        class="h-30 w-auto border-none shadow-none"
        src="@/assets/images/powered_by_basyx.png"
      >
    </div>
  </header>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
</script>
