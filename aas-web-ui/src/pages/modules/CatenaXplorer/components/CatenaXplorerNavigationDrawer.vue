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
      :curl-command="curlCommand"
      :curl-note="curlNote"
      :descriptors="descriptors"
      :dtr-url="dtrUrl"
      :edc-access-enabled="edcAccessEnabled"
      :edc-configured-partners="edcConfiguredPartners"
      :edc-counter-party-address="edcCounterPartyAddress"
      :edc-counter-party-id="edcCounterPartyId"
      :edc-partner-id="edcPartnerId"
      :edc-partner-ready="edcPartnerReady"
      :edc-recent-partners="edcRecentPartners"
      embedded
      :has-more-descriptors="hasMoreDescriptors"
      :infrastructure-editable="infrastructureEditable"
      :inline-error="inlineError"
      :is-loading="isLoading"
      :is-loading-more="isLoadingMore"
      :read-only="readOnly"
      :runtime-partner-loaded="runtimePartnerLoaded"
      :selected-descriptor-id="selectedDescriptorId"
      @clear="emit('clear')"
      @copy-json="emit('copy-json', $event)"
      @create="emit('create')"
      @delete="emit('delete', $event)"
      @duplicate="emit('duplicate', $event)"
      @edit="emit('edit', $event)"
      @load-more="emit('load-more')"
      @load-partner="emit('load-partner')"
      @save-partner="emit('save-partner')"
      @search="emit('search')"
      @select="emit('select', $event)"
      @update:edc-counter-party-address="emit('update:edc-counter-party-address', $event)"
      @update:edc-counter-party-id="emit('update:edc-counter-party-id', $event)"
      @update:edc-partner-id="emit('update:edc-partner-id', $event)"
    />
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { computed } from 'vue'
  import DescriptorBrowser from '@/pages/modules/CatenaXplorer/components/DescriptorBrowser.vue'

  const drawerWidth = 400

  const props = defineProps<{
    assetIdName: string
    assetIdNameSuggestions: string[]
    assetIdValue: string
    copyJsonIcon: string
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
    'search': []
    'select': [descriptor: any]
    'save-partner': []
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
