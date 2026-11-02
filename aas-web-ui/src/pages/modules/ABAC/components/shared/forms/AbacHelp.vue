<template>
  <v-tooltip location="top" max-width="360" open-delay="600">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :aria-label="text"
        class="mx-2"
        height="20"
        :href="topic ? HELP_LINKS[topic] : undefined"
        :icon="ICONS.HELP"
        rel="noopener noreferrer"
        size="small"
        :target="topic ? '_blank' : undefined"
        variant="plain"
        width="20"
        @click.stop
      />
    </template>

    <span class="d-block text-pre-wrap" style="max-width: 360px">{{ text }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
  import type { HelpTopic } from '../../../constants/help'
  import { HELP_LINKS } from '../../../constants/help'

  const ICONS = {
    HELP: 'mdi-help-circle',
  } as const

  defineProps<{ text: string, topic?: HelpTopic }>()
</script>
