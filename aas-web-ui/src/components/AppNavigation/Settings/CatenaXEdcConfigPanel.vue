<template>
  <v-container class="pa-0">
    <v-alert
      class="mb-3"
      density="compact"
      icon="mdi-shield-key-outline"
      text="Partner details are stored in this browser. Management API credentials and the allowed DSP address list remain server-side."
      type="info"
      variant="tonal"
    />

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

    <div class="d-flex align-center mt-2 mb-2">
      <div>
        <div class="text-subtitle-1 font-weight-medium">Business partners</div>

        <div class="text-body-small text-medium-emphasis">
          Choose the default provider used when CatenaXplorer opens.
        </div>
      </div>
    </div>

    <v-alert
      v-if="partners.length === 0"
      class="mb-3"
      density="compact"
      text="No partners configured. Add one here or use another partner directly in CatenaXplorer."
      type="info"
      variant="outlined"
    />

    <v-radio-group
      v-else
      v-model="defaultPartnerIdModel"
      class="mb-0"
      hide-details
    >
      <v-list border class="rounded-lg pa-0" lines="three">
        <template v-for="(partner, index) in partners" :key="partner.id">
          <v-list-item
            :aria-label="`Use ${partner.name || partner.counterPartyId} as default partner`"
            class="py-2"
            @click="defaultPartnerIdModel = partner.id"
          >
            <template #prepend>
              <v-radio
                :aria-label="`Use ${partner.name || partner.counterPartyId} as default`"
                :value="partner.id"
                @click.stop
              />
            </template>

            <v-list-item-title class="d-flex align-center flex-wrap ga-2">
              <span>{{ partner.name || partner.counterPartyId }}</span>

              <v-chip
                v-if="partner.id === defaultPartnerIdModel"
                color="primary"
                size="x-small"
              >
                Default
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle class="text-break opacity-100">
              {{ partner.counterPartyId }}
            </v-list-item-subtitle>

            <v-list-item-subtitle class="text-break">
              {{ partner.counterPartyAddress }}
            </v-list-item-subtitle>

            <template #append>
              <v-tooltip text="Edit partner">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    :aria-label="`Edit ${partner.name || partner.counterPartyId}`"
                    icon="mdi-pencil-outline"
                    size="small"
                    variant="text"
                    @click.stop="openEditPartner(partner)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip text="Delete partner">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    :aria-label="`Delete ${partner.name || partner.counterPartyId}`"
                    icon="mdi-delete-outline"
                    size="small"
                    variant="text"
                    @click.stop="requestPartnerDelete(partner)"
                  />
                </template>
              </v-tooltip>
            </template>
          </v-list-item>

          <v-divider v-if="index < partners.length - 1" />
        </template>
      </v-list>
    </v-radio-group>

    <v-btn
      block
      class="mt-3 text-buttonText"
      color="primary"
      prepend-icon="mdi-plus"
      text="Add business partner"
      variant="flat"
      @click="openAddPartner"
    />

    <CatenaXPartnerDialog
      v-model="partnerDialogOpen"
      :allow-default="!partnerToEdit"
      :default-partner-id="defaultPartnerIdModel"
      :existing-partners="partners"
      :partner="partnerToEdit"
      :title="partnerToEdit ? 'Edit business partner' : 'Add business partner'"
      @save="savePartner"
    />

    <v-dialog v-model="deleteDialogOpen" max-width="480">
      <v-card rounded="lg">
        <v-card-title>Delete business partner?</v-card-title>

        <v-card-text>
          <div>
            Remove “{{ partnerToDelete?.name || partnerToDelete?.counterPartyId }}” from this infrastructure?
          </div>

          <div v-if="replacementDefaultPartner" class="mt-2 text-medium-emphasis">
            “{{ replacementDefaultPartner.name || replacementDefaultPartner.counterPartyId }}” will become the default partner.
          </div>

          <div v-else-if="deletingFinalDefaultPartner" class="mt-2 text-medium-emphasis">
            No default partner will remain.
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="deleteDialogOpen = false" />
          <v-btn color="error" text="Delete" variant="flat" @click="deletePartner" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
  import type { CatenaXConfig, CatenaXPartner } from '@/types/Infrastructure'
  import { computed, ref } from 'vue'
  import CatenaXPartnerDialog from '@/components/AppNavigation/Settings/CatenaXPartnerDialog.vue'
  import { normalizeCatenaXPartners } from '@/utils/CatenaXPartnerUtils'

  const props = defineProps<{
    modelValue?: CatenaXConfig
  }>()

  const emit = defineEmits<{
    'update:model-value': [value: CatenaXConfig | undefined]
  }>()

  const partnerDialogOpen = ref(false)
  const deleteDialogOpen = ref(false)
  const partnerToEdit = ref<CatenaXPartner | null>(null)
  const partnerToDelete = ref<CatenaXPartner | null>(null)

  const partners = computed(() => normalizeCatenaXPartners(props.modelValue?.edc?.partners ?? []))
  const proxyIdModel = computed({
    get: () => props.modelValue?.edc?.proxyId ?? '',
    set: value => emitEdcConfig(partners.value, defaultPartnerIdModel.value, value),
  })
  const defaultPartnerIdModel = computed({
    get: () => props.modelValue?.edc?.defaultPartnerId ?? partners.value[0]?.id ?? '',
    set: value => emitEdcConfig(partners.value, value),
  })
  const replacementDefaultPartner = computed(() => {
    if (!partnerToDelete.value || partnerToDelete.value.id !== defaultPartnerIdModel.value) {
      return null
    }

    return partners.value.find(partner => partner.id !== partnerToDelete.value!.id) ?? null
  })
  const deletingFinalDefaultPartner = computed(() => {
    if (!partnerToDelete.value || partnerToDelete.value.id !== defaultPartnerIdModel.value) {
      return false
    }

    return partners.value.length === 1
  })

  function openAddPartner (): void {
    partnerToEdit.value = null
    partnerDialogOpen.value = true
  }

  function openEditPartner (partner: CatenaXPartner): void {
    partnerToEdit.value = partner
    partnerDialogOpen.value = true
  }

  function savePartner (partner: CatenaXPartner, useAsDefault: boolean): void {
    const updatedPartners = [
      ...partners.value.filter(existingPartner => existingPartner.id !== partner.id),
      partner,
    ]
    const defaultPartnerId = useAsDefault || defaultPartnerIdModel.value === ''
      ? partner.id
      : defaultPartnerIdModel.value
    emitEdcConfig(updatedPartners, defaultPartnerId)
  }

  function requestPartnerDelete (partner: CatenaXPartner): void {
    partnerToDelete.value = partner
    deleteDialogOpen.value = true
  }

  function deletePartner (): void {
    if (!partnerToDelete.value) {
      return
    }

    const updatedPartners = partners.value.filter(partner => partner.id !== partnerToDelete.value!.id)
    const defaultPartnerId = partnerToDelete.value.id === defaultPartnerIdModel.value
      ? updatedPartners[0]?.id ?? ''
      : defaultPartnerIdModel.value
    emitEdcConfig(updatedPartners, defaultPartnerId)
    partnerToDelete.value = null
    deleteDialogOpen.value = false
  }

  function emitEdcConfig (
    updatedPartners: CatenaXPartner[],
    defaultPartnerId: string,
    proxyId = proxyIdModel.value,
  ): void {
    const defaultPartner = updatedPartners.find(partner => partner.id === defaultPartnerId)
    emit('update:model-value', {
      accessMode: props.modelValue?.accessMode ?? 'edc',
      edc: {
        proxyId,
        defaultPartnerId: defaultPartner?.id,
        defaultCounterPartyId: defaultPartner?.counterPartyId,
        defaultCounterPartyAddress: defaultPartner?.counterPartyAddress,
        partners: updatedPartners.length > 0 ? updatedPartners : undefined,
      },
    })
  }
</script>
