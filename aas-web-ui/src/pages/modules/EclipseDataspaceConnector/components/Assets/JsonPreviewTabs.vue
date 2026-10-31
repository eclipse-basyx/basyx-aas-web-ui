<template>
  <div class="d-flex flex-column json-preview-tabs">
    <!-- Tab bar, hidden if the tab is selected by another JsonPreviewTabs sharing the same v-model -->
    <div v-if="!hideTabs" class="d-flex align-center">
      <v-tabs
        v-model="tab"
        class="flex-1-1-0"
        color="primary"
        density="compact"
        height="47"
        show-arrows
      >
        <v-tab
          v-for="item in items"
          :key="item.value"
          :prepend-icon="item.icon"
          :text="item.title"
          :value="item.value"
        />
      </v-tabs>

      <!-- Optional actions at the end of the tab bar -->
      <template v-if="$slots.append">
        <v-divider vertical />

        <div class="px-2">
          <slot name="append" />
        </div>
      </template>
    </div>

    <v-divider v-if="!hideTabs" />

    <!-- Flat preview (no shadow, no rounded corners) filling the remaining height, attributes fall through to its v-card -->
    <JSONPreview
      class="d-flex flex-column flex-1-1-0 json-preview-tabs__preview"
      height="100%"
      :icon="activeItem?.previewIcon"
      :json-content="activeItem?.json"
      rounded="0"
      :title="activeItem?.previewTitle"
      variant="flat"
    />
  </div>
</template>

<script lang="ts" setup>
  export interface JsonPreviewTab {
    value: string
    title: string
    previewTitle: string
    previewIcon?: string // Icon of the preview header, defaults to the JSON icon
    icon?: string
    json: unknown
  }

  const props = defineProps<{
    items: Array<JsonPreviewTab>
    hideTabs?: boolean
  }>()

  const tab = defineModel<string>({ required: true })

  // Computed Properties
  const activeItem = computed(() => props.items.find(item => item.value === tab.value) ?? props.items[0])
</script>

<style scoped>
  .json-preview-tabs,
  .json-preview-tabs__preview {
    min-height: 0;
  }

  /* Let the code editor fill the remaining height of the preview instead of a fixed height */
  .json-preview-tabs__preview :deep(.v-card-text) {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .json-preview-tabs__preview :deep(.v-card-text > div) {
    flex: 1 1 0;
    min-height: 0;
  }
</style>
