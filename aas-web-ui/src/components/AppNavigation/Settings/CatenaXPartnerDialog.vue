<template>
  <v-dialog v-model="dialogOpen" max-width="640" persistent>
    <v-card rounded="lg">
      <v-card-title>{{ title }}</v-card-title>
      <v-divider />

      <v-card-text class="pt-4">
        <v-form ref="formRef" @submit.prevent="savePartner">
          <v-text-field
            v-model="name"
            autocomplete="organization"
            bg-color="surface-light"
            density="compact"
            label="Display name (optional)"
            placeholder="Defaults to the counterparty ID"
            variant="outlined"
          />

          <v-text-field
            v-model="counterPartyId"
            autocomplete="off"
            bg-color="surface-light"
            density="compact"
            label="Counterparty ID"
            :rules="[requiredRule]"
            variant="outlined"
          />

          <v-text-field
            v-model="counterPartyAddress"
            autocomplete="url"
            bg-color="surface-light"
            density="compact"
            :error-messages="duplicateError"
            hint="HTTP addresses require the server-side insecure-address option."
            label="Counterparty DSP Address"
            persistent-hint
            placeholder="https://partner.example/api/v1/dsp"
            :rules="[requiredRule, addressRule]"
            variant="outlined"
          />

          <v-checkbox
            v-if="allowDefault"
            v-model="useAsDefault"
            color="primary"
            hide-details
            label="Use as default partner"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancel" @click="close" />

        <v-btn
          class="text-buttonText"
          color="primary"
          text="Save partner"
          variant="flat"
          @click="savePartner"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { ref, watch } from 'vue'
  import {
    createCatenaXPartnerId,
    getCatenaXPartnerKey,
    isValidCatenaXPartnerAddress,
  } from '@/utils/CatenaXPartnerUtils'

  const props = withDefaults(defineProps<{
    allowDefault?: boolean
    defaultPartnerId?: string
    existingPartners?: CatenaXPartner[]
    modelValue: boolean
    partner?: Partial<CatenaXPartner> | null
    title?: string
  }>(), {
    allowDefault: true,
    defaultPartnerId: '',
    existingPartners: () => [],
    partner: null,
    title: 'Add business partner',
  })

  const emit = defineEmits<{
    'save': [partner: CatenaXPartner, useAsDefault: boolean]
    'update:model-value': [value: boolean]
  }>()

  const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
  const name = ref('')
  const counterPartyId = ref('')
  const counterPartyAddress = ref('')
  const duplicateError = ref('')
  const useAsDefault = ref(false)

  const dialogOpen = ref(false)

  watch(
    () => props.modelValue,
    value => {
      dialogOpen.value = value
      if (value) {
        name.value = props.partner?.name ?? ''
        counterPartyId.value = props.partner?.counterPartyId ?? ''
        counterPartyAddress.value = props.partner?.counterPartyAddress ?? ''
        duplicateError.value = ''
        useAsDefault.value = Boolean(
          props.partner?.id && props.partner.id === props.defaultPartnerId,
        )
      }
    },
    { immediate: true },
  )

  watch(dialogOpen, value => {
    if (!value) {
      emit('update:model-value', false)
    }
  })

  const requiredRule = (value: string): boolean | string => value.trim() !== '' || 'This field is required.'
  function addressRule (value: string): boolean | string {
    return isValidCatenaXPartnerAddress(value) || 'Enter an absolute HTTP or HTTPS URL.'
  }

  function close (): void {
    dialogOpen.value = false
  }

  async function savePartner (): Promise<void> {
    duplicateError.value = ''
    const { valid } = await formRef.value!.validate()
    if (!valid) {
      return
    }

    const normalizedId = counterPartyId.value.trim()
    const normalizedAddress = counterPartyAddress.value.trim()
    const candidateKey = getCatenaXPartnerKey({
      counterPartyId: normalizedId,
      counterPartyAddress: normalizedAddress,
    })
    const duplicate = props.existingPartners.some(partner =>
      partner.id !== props.partner?.id && getCatenaXPartnerKey(partner) === candidateKey,
    )
    if (duplicate) {
      duplicateError.value = 'This counterparty and DSP address are already configured.'
      return
    }

    emit('save', {
      id: props.partner?.id?.trim() || createCatenaXPartnerId(
        normalizedId,
        normalizedAddress,
        props.existingPartners.map(partner => partner.id),
      ),
      name: name.value.trim() || undefined,
      counterPartyId: normalizedId,
      counterPartyAddress: normalizedAddress,
    }, useAsDefault.value)
    close()
  }
</script>
