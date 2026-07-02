<template>
  <v-sheet
    :border="!embedded"
    class="catena-xplorer-browser"
    :class="{ 'catena-xplorer-browser--embedded': embedded }"
    :rounded="embedded ? false : 'lg'"
  >
    <DescriptorListHeader
      :copied-descriptor-available="copiedDescriptorAvailable"
      :descriptor-count="descriptors.length"
      @create="emit('create')"
      @paste="emit('paste')"
    />

    <v-divider />

    <DescriptorSearchForm
      v-model:asset-id-name="assetIdNameModel"
      v-model:asset-id-value="assetIdValueModel"
      :asset-id-name-suggestions="assetIdNameSuggestions"
      :dtr-url="dtrUrl"
      :is-loading="isLoading"
      @clear="emit('clear')"
      @reload="emit('reload')"
      @search="emit('search')"
    />

    <v-alert
      v-if="inlineError"
      class="mx-3 mb-3"
      density="comfortable"
      icon="mdi-alert-circle-outline"
      :text="inlineError"
      type="warning"
      variant="tonal"
    />

    <v-progress-linear
      v-if="isLoading"
      color="primary"
      height="2"
      indeterminate
    />

    <v-divider />

    <div class="catena-xplorer-browser__list">
      <DescriptorList
        :copy-json-icon="copyJsonIcon"
        :descriptors="descriptors"
        :has-more-descriptors="hasMoreDescriptors"
        :is-loading="isLoading"
        :is-loading-more="isLoadingMore"
        :selected-descriptor-id="selectedDescriptorId"
        @copy="emit('copy', $event)"
        @copy-json="emit('copy-json', $event)"
        @create="emit('create')"
        @delete="emit('delete', $event)"
        @edit="emit('edit', $event)"
        @load-more="emit('load-more')"
        @select="emit('select', $event)"
      />
    </div>
  </v-sheet>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import DescriptorList from '@/pages/modules/CatenaXplorer/components/DescriptorList.vue'
  import DescriptorListHeader from '@/pages/modules/CatenaXplorer/components/DescriptorListHeader.vue'
  import DescriptorSearchForm from '@/pages/modules/CatenaXplorer/components/DescriptorSearchForm.vue'

  const props = defineProps<{
    assetIdName: string
    assetIdNameSuggestions: string[]
    assetIdValue: string
    copiedDescriptorAvailable: boolean
    copyJsonIcon: string
    descriptors: any[]
    dtrUrl: string
    embedded?: boolean
    hasMoreDescriptors?: boolean
    inlineError: string
    isLoading: boolean
    isLoadingMore?: boolean
    selectedDescriptorId: string
  }>()

  const emit = defineEmits<{
    'clear': []
    'copy': [descriptor: any]
    'copy-json': [descriptor: any]
    'create': []
    'delete': [descriptor: any]
    'edit': [descriptor: any]
    'load-more': []
    'paste': []
    'reload': []
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
.catena-xplorer-browser {
  overflow: hidden;
}

.catena-xplorer-browser--embedded {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
}

.catena-xplorer-browser__list {
  min-height: 0;
}

.catena-xplorer-browser--embedded .catena-xplorer-browser__list {
  flex: 1 1 auto;
  overflow-y: auto;
}
</style>
