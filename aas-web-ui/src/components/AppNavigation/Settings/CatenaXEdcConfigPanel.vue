<template>
  <v-container class="pa-0">
    <v-alert
      class="mb-3"
      density="compact"
      icon="mdi-shield-key-outline"
      text="Only the proxy ID and UI defaults are stored here. The EDC Management API URL and API key must be configured on the server-side proxy."
      type="info"
      variant="tonal"
    />

    <v-row density="compact">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="proxyIdModel"
          autocomplete="off"
          bg-color="surface-light"
          density="compact"
          flat
          label="EDC Proxy ID"
          placeholder="default"
          variant="outlined"
        />
      </v-col>

      <v-col cols="12" md="4">
        <v-text-field
          v-model="counterPartyIdModel"
          autocomplete="off"
          bg-color="surface-light"
          density="compact"
          flat
          label="Default Counterparty ID"
          placeholder="Counterparty ID"
          variant="outlined"
        />
      </v-col>

      <v-col cols="12" md="4">
        <v-text-field
          v-model="counterPartyAddressModel"
          autocomplete="url"
          bg-color="surface-light"
          density="compact"
          flat
          label="Default Counterparty DSP Address"
          placeholder="https://<counterparty-dsp-endpoint>"
          variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import type { CatenaXConfig } from '@/types/Infrastructure'
  import { computed } from 'vue'

  const props = defineProps<{
    modelValue?: CatenaXConfig
  }>()

  const emit = defineEmits<{
    'update:model-value': [value: CatenaXConfig | undefined]
  }>()

  const proxyIdModel = computed({
    get: () => props.modelValue?.edc?.proxyId ?? '',
    set: value => updateEdcConfig({ proxyId: value }),
  })

  const counterPartyIdModel = computed({
    get: () => props.modelValue?.edc?.defaultCounterPartyId ?? '',
    set: value => updateEdcConfig({ defaultCounterPartyId: value }),
  })

  const counterPartyAddressModel = computed({
    get: () => props.modelValue?.edc?.defaultCounterPartyAddress ?? '',
    set: value => updateEdcConfig({ defaultCounterPartyAddress: value }),
  })

  function updateEdcConfig (
    patch: Partial<NonNullable<CatenaXConfig['edc']>>,
  ): void {
    const edc = {
      proxyId: props.modelValue?.edc?.proxyId ?? '',
      defaultCounterPartyId: props.modelValue?.edc?.defaultCounterPartyId,
      defaultCounterPartyAddress: props.modelValue?.edc?.defaultCounterPartyAddress,
      ...patch,
    }

    if (edc.proxyId.trim() === '') {
      emit('update:model-value', { accessMode: props.modelValue?.accessMode ?? 'edc' })
      return
    }

    emit('update:model-value', {
      accessMode: props.modelValue?.accessMode ?? 'edc',
      edc: {
        proxyId: edc.proxyId,
        defaultCounterPartyId: edc.defaultCounterPartyId || undefined,
        defaultCounterPartyAddress: edc.defaultCounterPartyAddress || undefined,
        defaultPartnerId: props.modelValue?.edc?.defaultPartnerId,
        partners: buildPartners(edc.defaultCounterPartyId, edc.defaultCounterPartyAddress),
      },
    })
  }

  function buildPartners (
    counterPartyId?: string,
    counterPartyAddress?: string,
  ): NonNullable<CatenaXConfig['edc']>['partners'] | undefined {
    const normalizedCounterPartyId = counterPartyId?.trim() ?? ''
    const normalizedCounterPartyAddress = counterPartyAddress?.trim() ?? ''
    const existingPartners = props.modelValue?.edc?.partners ?? []
    if (normalizedCounterPartyId === '' || normalizedCounterPartyAddress === '') {
      return existingPartners.length > 0 ? existingPartners : undefined
    }

    const partner = {
      id: props.modelValue?.edc?.defaultPartnerId
        ?? `${normalizedCounterPartyId}-${normalizedCounterPartyAddress}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      counterPartyId: normalizedCounterPartyId,
      counterPartyAddress: normalizedCounterPartyAddress,
    }

    const partners = [
      partner,
      ...existingPartners.filter(existingPartner =>
        existingPartner.counterPartyId !== normalizedCounterPartyId
        || existingPartner.counterPartyAddress !== normalizedCounterPartyAddress,
      ),
    ]

    return partners
  }
</script>
