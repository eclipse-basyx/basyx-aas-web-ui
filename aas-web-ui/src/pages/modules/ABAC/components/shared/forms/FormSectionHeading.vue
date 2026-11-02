<template>
  <div class="mb-4">
    <v-divider class="mb-2 w-100" />

    <div class="d-flex align-center justify-space-between ga-2">
      <h3 class="text-title-small ma-0">{{ title }}</h3>
      <AbacHelp v-if="help" :text="help" :topic="helpTopic" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { HelpTopic } from '../../../constants/help'
  import AbacHelp from './AbacHelp.vue'

  defineProps<{ title: string, help?: string, helpTopic?: HelpTopic }>()
</script>
