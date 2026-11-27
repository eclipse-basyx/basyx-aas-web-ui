<template>
  <div class="d-flex flex-column ga-3">
    <div>
      <div class="text-title-small">{{ title }}</div>

      <div class="text-body-small text-medium-emphasis">{{ subtitle }}</div>
    </div>

    <!-- A repository of the infrastructures or a free URL; clearing sets null, the URL stays a string -->
    <v-combobox
      clearable
      density="compact"
      hide-details
      :item-props="option => ({ subtitle: option.subtitle })"
      item-title="value"
      item-value="value"
      :items="options"
      label="Repository URL"
      :model-value="repositoryUrl"
      persistent-placeholder
      :placeholder="placeholder"
      :return-object="false"
      variant="outlined"
      @update:model-value="value => repositoryUrl = value ?? ''"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { EdcAssetRepositoryUrlOption } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetRepositoryUrl'

  defineProps<{
    title: string
    subtitle: string
    options: Array<EdcAssetRepositoryUrlOption>
    placeholder?: string // Repository URL the endpoint starts with, used while none is given
  }>()

  const repositoryUrl = defineModel<string>({ required: true })
</script>
