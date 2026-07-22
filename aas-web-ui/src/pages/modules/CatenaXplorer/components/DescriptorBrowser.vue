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
    <EdcPartnerSelector
      v-if="edcAccessEnabled"
      v-model:counter-party-address="edcCounterPartyAddressModel"
      v-model:counter-party-id="edcCounterPartyIdModel"
      v-model:partner-id="edcPartnerIdModel"
      :configured-partners="edcConfiguredPartners"
      :has-load-error="Boolean(inlineError)"
      :infrastructure-editable="infrastructureEditable"
      :is-loading="isBusy"
      :partner-ready="edcPartnerReady"
      :recent-partners="edcRecentPartners"
      :runtime-partner-loaded="runtimePartnerLoaded"
      @load="emit('load-partner')"
      @save="emit('save-partner')"
    />

    <DescriptorSearchForm
      v-model:asset-id-name="assetIdNameModel"
      v-model:asset-id-value="assetIdValueModel"
      :asset-id-name-suggestions="assetIdNameSuggestions"
      :curl-command="curlCommand"
      :curl-note="curlNote"
      :disabled="isBusy || (edcAccessEnabled && !edcPartnerReady)"
      :dtr-url="dtrUrl"
      :is-loading="isBusy"
      show-curl
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
          :read-only="readOnly"
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
        v-if="isFixedCreateAction && !readOnly"
        fixed
        @create="emit('create')"
      />

      <DescriptorCreateAction v-else-if="!readOnly" @create="emit('create')" />
    </div>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { computed } from 'vue'
  import DescriptorCreateAction from '@/pages/modules/CatenaXplorer/components/DescriptorCreateAction.vue'
  import DescriptorList from '@/pages/modules/CatenaXplorer/components/DescriptorList.vue'
  import DescriptorSearchForm from '@/pages/modules/CatenaXplorer/components/DescriptorSearchForm.vue'
  import EdcPartnerSelector from '@/pages/modules/CatenaXplorer/components/EdcPartnerSelector.vue'

  const props = defineProps<{
    assetIdName: string
    assetIdNameSuggestions: string[]
    assetIdValue: string
    copyJsonIcon: string
    createActionPlacement?: 'fixed' | 'footer'
    curlCommand?: string
    curlNote?: string
    descriptors: any[]
    dtrUrl: string
    edcAccessEnabled?: boolean
    edcConfiguredPartners?: CatenaXPartner[]
    edcCounterPartyAddress?: string
    edcCounterPartyId?: string
    edcPartnerId?: string
    edcPartnerReady?: boolean
    edcRecentPartners?: CatenaXPartner[]
    embedded?: boolean
    hasMoreDescriptors?: boolean
    inlineError: string
    isLoading: boolean
    isLoadingMore?: boolean
    infrastructureEditable?: boolean
    readOnly?: boolean
    runtimePartnerLoaded?: boolean
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
    'load-partner': []
    'save-partner': []
    'search': []
    'select': [descriptor: any]
    'update:asset-id-name': [value: string]
    'update:asset-id-value': [value: string]
    'update:edc-counter-party-address': [value: string]
    'update:edc-counter-party-id': [value: string]
    'update:edc-partner-id': [value: string]
  }>()

  const assetIdNameModel = computed({
    get: () => props.assetIdName,
    set: value => emit('update:asset-id-name', value),
  })

  const assetIdValueModel = computed({
    get: () => props.assetIdValue,
    set: value => emit('update:asset-id-value', value),
  })

  const edcPartnerIdModel = computed({
    get: () => props.edcPartnerId ?? '',
    set: value => emit('update:edc-partner-id', value),
  })

  const edcCounterPartyIdModel = computed({
    get: () => props.edcCounterPartyId ?? '',
    set: value => emit('update:edc-counter-party-id', value),
  })

  const edcCounterPartyAddressModel = computed({
    get: () => props.edcCounterPartyAddress ?? '',
    set: value => emit('update:edc-counter-party-address', value),
  })

  const isFixedCreateAction = computed(() => props.createActionPlacement === 'fixed')
  const isBusy = computed(() => props.isLoading || Boolean(props.isLoadingMore))
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
