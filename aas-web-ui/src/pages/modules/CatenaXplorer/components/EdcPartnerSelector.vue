<template>
  <v-sheet class="pa-3" color="transparent">
    <v-select
      v-model="partnerSelection"
      aria-label="Business partner"
      bg-color="surface-light"
      density="compact"
      :disabled="isLoading"
      hide-details
      :items="partnerItems"
      label="Business partner"
      variant="outlined"
    />

    <div v-if="selectedPartner" class="mt-3 pa-3 bg-surface-light rounded-lg">
      <div class="d-flex align-center ga-2 mb-1">
        <v-icon icon="mdi-domain" size="small" />

        <span class="text-body-medium font-weight-medium flex-grow-1">
          {{ selectedPartner.name || selectedPartner.counterPartyId }}
        </span>

        <v-chip
          :color="partnerStatus.color"
          :prepend-icon="partnerStatus.icon"
          size="x-small"
          :text="partnerStatus.text"
          variant="tonal"
        />
      </div>

      <div class="text-body-small text-medium-emphasis text-break">
        {{ selectedPartner.counterPartyId }}
      </div>

      <div class="text-body-small text-medium-emphasis text-break">
        {{ selectedPartner.counterPartyAddress }}
      </div>
    </div>

    <div v-else class="mt-3">
      <div class="d-flex justify-end mb-2">
        <v-chip
          :color="partnerStatus.color"
          :prepend-icon="partnerStatus.icon"
          size="x-small"
          :text="partnerStatus.text"
          variant="tonal"
        />
      </div>

      <v-text-field
        v-model="counterPartyIdModel"
        autocomplete="off"
        bg-color="surface-light"
        density="compact"
        :disabled="isLoading"
        hide-details="auto"
        label="Counterparty ID"
        :rules="[requiredRule]"
        variant="outlined"
      />

      <v-text-field
        v-model="counterPartyAddressModel"
        autocomplete="url"
        bg-color="surface-light"
        class="mt-2"
        density="compact"
        :disabled="isLoading"
        hide-details="auto"
        label="Counterparty DSP Address"
        placeholder="https://partner.example/api/v1/dsp"
        :rules="[requiredRule, addressRule]"
        variant="outlined"
      />
    </div>

    <v-btn
      block
      class="mt-3 text-buttonText"
      color="primary"
      :disabled="!canLoad"
      :loading="isLoading"
      prepend-icon="mdi-cloud-download-outline"
      :text="partnerReady ? 'Reload all descriptors' : 'Load all descriptors'"
      variant="flat"
      @click="emit('load')"
    />

    <v-btn
      v-if="runtimePartnerLoaded && infrastructureEditable"
      block
      class="mt-2"
      prepend-icon="mdi-content-save-outline"
      text="Save partner"
      variant="outlined"
      @click="emit('save')"
    />

    <div
      v-else-if="runtimePartnerLoaded"
      class="mt-2 text-caption text-medium-emphasis"
    >
      Remembered in this browser. Permanent partners are managed by the deployment configuration.
    </div>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { computed } from 'vue'
  import { isValidCatenaXPartnerAddress } from '@/utils/CatenaXPartnerUtils'

  const runtimePartnerValue = '__runtime_partner__'

  const props = withDefaults(defineProps<{
    configuredPartners?: CatenaXPartner[]
    counterPartyAddress?: string
    counterPartyId?: string
    infrastructureEditable?: boolean
    hasLoadError?: boolean
    isLoading: boolean
    partnerReady?: boolean
    partnerId?: string
    recentPartners?: CatenaXPartner[]
    runtimePartnerLoaded?: boolean
  }>(), {
    configuredPartners: () => [],
    counterPartyAddress: '',
    counterPartyId: '',
    infrastructureEditable: false,
    hasLoadError: false,
    partnerId: '',
    partnerReady: false,
    recentPartners: () => [],
    runtimePartnerLoaded: false,
  })

  const emit = defineEmits<{
    'load': []
    'save': []
    'update:counter-party-address': [value: string]
    'update:counter-party-id': [value: string]
    'update:partner-id': [value: string]
  }>()

  const allPartners = computed(() => [...props.configuredPartners, ...props.recentPartners])
  const selectedPartner = computed(() =>
    allPartners.value.find(partner => partner.id === props.partnerId) ?? null,
  )
  const canLoad = computed(() =>
    !props.isLoading
    && props.counterPartyId.trim() !== ''
    && isValidCatenaXPartnerAddress(props.counterPartyAddress),
  )
  const partnerStatus = computed(() => {
    if (props.isLoading) {
      return { color: 'primary', icon: 'mdi-loading', text: 'Loading' }
    }
    if (props.partnerReady) {
      return { color: 'success', icon: 'mdi-check-circle-outline', text: 'Ready' }
    }
    if (props.hasLoadError) {
      return { color: 'error', icon: 'mdi-alert-circle-outline', text: 'Load failed' }
    }
    return { color: 'default', icon: 'mdi-clock-outline', text: 'Not loaded' }
  })
  const partnerItems = computed(() => {
    const items: Array<Record<string, unknown>> = []
    if (props.configuredPartners.length > 0) {
      items.push(
        { type: 'subheader', title: 'Configured partners' },
        ...props.configuredPartners.map(partner => ({
          title: partner.name || partner.counterPartyId,
          value: partner.id,
        })),
      )
    }
    if (props.recentPartners.length > 0) {
      items.push(
        { type: 'subheader', title: 'Recently used' },
        ...props.recentPartners.map(partner => ({
          title: partner.name || partner.counterPartyId,
          value: partner.id,
        })),
      )
    }
    items.push({ type: 'subheader', title: 'Other' }, { title: 'Use another partner…', value: runtimePartnerValue })
    return items
  })

  const partnerSelection = computed({
    get: () => props.partnerId || runtimePartnerValue,
    set: value => emit('update:partner-id', value === runtimePartnerValue ? '' : value),
  })
  const counterPartyIdModel = computed({
    get: () => props.counterPartyId,
    set: value => emit('update:counter-party-id', value),
  })
  const counterPartyAddressModel = computed({
    get: () => props.counterPartyAddress,
    set: value => emit('update:counter-party-address', value),
  })

  const requiredRule = (value: string): boolean | string => value.trim() !== '' || 'This field is required.'
  function addressRule (value: string): boolean | string {
    return isValidCatenaXPartnerAddress(value) || 'Enter an absolute HTTP or HTTPS URL.'
  }
</script>
