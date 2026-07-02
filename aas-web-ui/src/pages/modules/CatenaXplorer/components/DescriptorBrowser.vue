<template>
  <v-sheet
    :border="!embedded"
    class="catena-xplorer-browser"
    :class="{
      'catena-xplorer-browser--embedded': embedded,
      'catena-xplorer-browser--fixed-create': isFixedCreateAction,
    }"
    :rounded="embedded ? false : 'lg'"
  >
    <DescriptorSearchForm
      v-model:asset-id-name="assetIdNameModel"
      v-model:asset-id-value="assetIdValueModel"
      :asset-id-name-suggestions="assetIdNameSuggestions"
      :dtr-url="dtrUrl"
      :is-loading="isLoading"
      @clear="emit('clear')"
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

    <div class="catena-xplorer-browser__results">
      <div class="catena-xplorer-browser__list">
        <DescriptorList
          :copy-json-icon="copyJsonIcon"
          :descriptors="descriptors"
          :has-more-descriptors="hasMoreDescriptors"
          :is-loading="isLoading"
          :is-loading-more="isLoadingMore"
          :selected-descriptor-id="selectedDescriptorId"
          @copy-json="emit('copy-json', $event)"
          @delete="emit('delete', $event)"
          @duplicate="emit('duplicate', $event)"
          @edit="emit('edit', $event)"
          @load-more="emit('load-more')"
          @select="emit('select', $event)"
        />
      </div>

      <DescriptorCreateAction
        v-if="isFixedCreateAction"
        fixed
        @create="emit('create')"
      />

      <DescriptorCreateAction v-else @create="emit('create')" />
    </div>
  </v-sheet>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import DescriptorCreateAction from '@/pages/modules/CatenaXplorer/components/DescriptorCreateAction.vue'
  import DescriptorList from '@/pages/modules/CatenaXplorer/components/DescriptorList.vue'
  import DescriptorSearchForm from '@/pages/modules/CatenaXplorer/components/DescriptorSearchForm.vue'

  const props = defineProps<{
    assetIdName: string
    assetIdNameSuggestions: string[]
    assetIdValue: string
    copyJsonIcon: string
    createActionPlacement?: 'fixed' | 'footer'
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

  const isFixedCreateAction = computed(() => props.createActionPlacement === 'fixed')
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

.catena-xplorer-browser__results {
  min-height: 0;
}

.catena-xplorer-browser--embedded .catena-xplorer-browser__results {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
}

.catena-xplorer-browser__list {
  min-height: 0;
}

.catena-xplorer-browser--fixed-create .catena-xplorer-browser__list {
  padding-bottom: 56px;
}

.catena-xplorer-browser--embedded .catena-xplorer-browser__list {
  flex: 1 1 auto;
  overflow-y: auto;
}

</style>
