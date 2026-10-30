<template>
  <div class="d-flex align-start ga-2">
    <div class="flex-grow-1" style="min-width: 0">
      <slot />
    </div>

    <div v-if="help" class="d-flex align-center flex-shrink-0" style="height: 48px">
      <AbacHelp :text="help" :topic="helpTopic" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { HelpTopic } from '../../../constants/help'
  import AbacHelp from './AbacHelp.vue'

  defineProps<{ help?: string, helpTopic?: HelpTopic }>()
</script>
