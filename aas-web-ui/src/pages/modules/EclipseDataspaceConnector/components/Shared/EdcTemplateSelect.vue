<template>
  <v-select
    v-model="selectedTemplate"
    hide-details
    item-title="name"
    item-value="value"
    :items="templates"
    :label="label"
    required
    variant="outlined"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps">
        <template #prepend>
          <v-icon class="mr-n5">{{ icon }}</v-icon>
        </template>

        <template #title>
          <span class="font-weight-bold">{{ item.name }}</span>
        </template>

        <template #subtitle>
          {{ item.description }}
        </template>
      </v-list-item>
    </template>
  </v-select>
</template>

<script lang="ts" setup generic="Value extends string">
  import type { EdcTemplate } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplateForm'

  defineProps<{
    templates: EdcTemplate<Value>[]
    label: string
    icon: string
  }>()

  // Data
  const selectedTemplate = defineModel<Value | ''>({ required: true })
</script>
