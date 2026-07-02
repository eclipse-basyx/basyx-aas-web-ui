<template>
  <v-navigation-drawer
    class="catena-xplorer-navigation-drawer"
    floating
    permanent
    :scrim="false"
    :width="drawerWidth"
  >
    <DescriptorBrowser
      v-model:asset-id-name="assetIdNameModel"
      v-model:asset-id-value="assetIdValueModel"
      :asset-id-name-suggestions="assetIdNameSuggestions"
      :copy-json-icon="copyJsonIcon"
      :descriptors="descriptors"
      :dtr-url="dtrUrl"
      embedded
      :has-more-descriptors="hasMoreDescriptors"
      :inline-error="inlineError"
      :is-loading="isLoading"
      :is-loading-more="isLoadingMore"
      :selected-descriptor-id="selectedDescriptorId"
      @clear="emit('clear')"
      @copy-json="emit('copy-json', $event)"
      @create="emit('create')"
      @delete="emit('delete', $event)"
      @duplicate="emit('duplicate', $event)"
      @edit="emit('edit', $event)"
      @load-more="emit('load-more')"
      @search="emit('search')"
      @select="emit('select', $event)"
    />
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import DescriptorBrowser from '@/pages/modules/CatenaXplorer/components/DescriptorBrowser.vue'

  const drawerWidth = 400

  const props = defineProps<{
    assetIdName: string
    assetIdNameSuggestions: string[]
    assetIdValue: string
    copyJsonIcon: string
    descriptors: any[]
    dtrUrl: string
    hasMoreDescriptors?: boolean
    inlineError: string
    isLoading: boolean
    isLoadingMore?: boolean
    selectedDescriptorId: string
  }>()

  const emit = defineEmits<{
    'clear': []
    'copy-json': [descriptor: any]
    'create': []
    'delete': [descriptor: any]
    'duplicate': [descriptor: any]
    'edit': [descriptor: any]
    'load-more': []
    'search': []
    'select': [descriptor: any]
    'update:asset-id-name': [value: string]
    'update:asset-id-value': [value: string]
  }>()

  const assetIdNameModel = computed({
    get: () => props.assetIdName,
    set: value => emit('update:asset-id-name', value),
  })

  const assetIdValueModel = computed({
    get: () => props.assetIdValue,
    set: value => emit('update:asset-id-value', value),
  })
</script>

<style scoped>
.catena-xplorer-navigation-drawer {
  bottom: 40px !important;
  height: auto !important;
  left: 0 !important;
  position: fixed !important;
  top: 64px !important;
  z-index: 4;
}

.catena-xplorer-navigation-drawer :deep(.v-navigation-drawer__content) {
  height: 100%;
  overflow: hidden;
}
</style>
