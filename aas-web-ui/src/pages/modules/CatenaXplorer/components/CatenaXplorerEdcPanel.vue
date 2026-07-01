<template>
  <section>
    <v-expansion-panels
      gap="8"
      rounded="lg"
      static
      variant="accordion"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-2 w-100">
            <v-icon icon="mdi-lan-connect" size="small" />
            <span>EDC Connection</span>

            <v-spacer />

            <v-chip
              :color="status?.configured ? 'success' : 'warning'"
              size="x-small"
              variant="tonal"
            >
              {{ status?.configured ? 'Configured' : 'Not checked' }}
            </v-chip>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-alert
            v-if="errorMessage"
            class="mb-3"
            density="compact"
            icon="mdi-alert-circle-outline"
            :text="errorMessage"
            type="warning"
            variant="tonal"
          />

          <v-row density="compact">
            <v-col cols="12" md="4">
              <div class="border rounded pa-3 h-100">
                <div class="text-label-small text-medium-emphasis">Proxy ID</div>
                <div class="text-body-small text-break">{{ proxyId }}</div>
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="border rounded pa-3 h-100">
                <div class="text-label-small text-medium-emphasis">Participant</div>
                <div class="text-body-small text-break">{{ status?.participantId || '-' }}</div>
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="border rounded pa-3 h-100">
                <div class="text-label-small text-medium-emphasis">Allowed Providers</div>
                <div class="text-body-small text-break">{{ allowedProviderSummary }}</div>
              </div>
            </v-col>
          </v-row>

          <v-row class="mt-2" density="compact">
            <v-col cols="12" md="5">
              <v-text-field
                v-model="counterPartyId"
                bg-color="surface-light"
                density="compact"
                flat
                hide-details
                label="Counterparty ID"
                placeholder="did:web:provider.example"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="5">
              <v-text-field
                v-model="counterPartyAddress"
                bg-color="surface-light"
                density="compact"
                flat
                hide-details
                label="Counterparty DSP Address"
                placeholder="https://provider.example/api/v1/dsp"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="2">
              <v-select
                v-model="discoveryMode"
                bg-color="surface-light"
                density="compact"
                flat
                hide-details
                :items="discoveryModeItems"
                label="Discovery"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="5">
              <v-text-field
                v-model="protocol"
                bg-color="surface-light"
                density="compact"
                flat
                hide-details
                label="Protocol"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="7">
              <div class="d-flex flex-wrap justify-end ga-2">
                <v-btn
                  border
                  color="surface-light"
                  :loading="activeAction === 'status'"
                  prepend-icon="mdi-connection"
                  rounded="lg"
                  text="Status"
                  variant="flat"
                  @click="loadStatus"
                />

                <v-btn
                  border
                  color="surface-light"
                  :loading="activeAction === 'discover'"
                  prepend-icon="mdi-radar"
                  rounded="lg"
                  text="Discover"
                  variant="flat"
                  @click="discoverConnector"
                />

                <v-btn
                  class="text-buttonText"
                  color="primary"
                  :loading="activeAction === 'catalog'"
                  prepend-icon="mdi-database-search-outline"
                  rounded="lg"
                  text="Catalog"
                  variant="flat"
                  @click="requestCatalog"
                />
              </div>
            </v-col>
          </v-row>

          <v-progress-linear
            v-if="Boolean(activeAction)"
            class="mt-3"
            color="primary"
            height="2"
            indeterminate
          />

          <v-expansion-panels
            v-if="lastResult"
            class="mt-3"
            gap="8"
            rounded="lg"
            static
            variant="accordion"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-code-json" size="small" />
                  <span>{{ lastResultTitle }}</span>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <JSONPreview
                  :download-file-name="lastResultFileName"
                  :json-content="lastResult"
                  :title="lastResultTitle"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </section>
</template>

<script lang="ts" setup>
  import type { CatenaXEdcStatus } from '@/composables/Client/CatenaXEdcClient'
  import { computed, onMounted, ref, watch } from 'vue'
  import JSONPreview from '@/components/Plugins/JSONPreview.vue'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'

  const props = defineProps<{
    defaultCounterPartyAddress?: string
    defaultCounterPartyId?: string
    proxyId: string
  }>()

  const { discoverConnector: discoverConnectorRequest, fetchStatus, requestCatalog: requestCatalogRequest }
    = useCatenaXEdcClient()

  const status = ref<CatenaXEdcStatus | null>(null)
  const activeAction = ref<'catalog' | 'discover' | 'status' | ''>('')
  const errorMessage = ref('')
  const counterPartyId = ref(props.defaultCounterPartyId ?? '')
  const counterPartyAddress = ref(props.defaultCounterPartyAddress ?? '')
  const discoveryMode = ref<'connectors' | 'dspversionparams'>(
    props.defaultCounterPartyAddress ? 'dspversionparams' : 'connectors',
  )
  const protocol = ref('dataspace-protocol-http:2025-1')
  const lastResult = ref<unknown | null>(null)
  const lastResultTitle = ref('')

  const discoveryModeItems = [
    { title: 'Connector', value: 'connectors' },
    { title: 'DSP Params', value: 'dspversionparams' },
  ]

  const allowedProviderSummary = computed(() => {
    if (!status.value) {
      return '-'
    }

    if (status.value.allowedCounterPartyAddressCount === 0) {
      return 'No addresses allowed'
    }

    return status.value.allowedCounterPartyAddressCount === 1
      ? '1 address'
      : `${status.value.allowedCounterPartyAddressCount} addresses`
  })

  const lastResultFileName = computed(() => {
    return lastResultTitle.value.toLowerCase().replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '')
  })

  onMounted(() => {
    loadStatus()
  })

  watch(
    () => props.proxyId,
    () => {
      status.value = null
      lastResult.value = null
      loadStatus()
    },
  )

  watch(
    () => props.defaultCounterPartyId,
    value => {
      counterPartyId.value = value ?? ''
    },
  )

  watch(
    () => props.defaultCounterPartyAddress,
    value => {
      counterPartyAddress.value = value ?? ''
      discoveryMode.value = value ? 'dspversionparams' : 'connectors'
    },
  )

  async function loadStatus (): Promise<void> {
    errorMessage.value = ''
    activeAction.value = 'status'

    try {
      const result = await fetchStatus(props.proxyId)
      status.value = result
      if (!result) {
        errorMessage.value = 'Could not reach the EDC proxy.'
      } else if (!result.configured) {
        errorMessage.value = 'The selected EDC proxy exists but is not fully configured.'
      }
    } finally {
      activeAction.value = ''
    }
  }

  async function discoverConnector (): Promise<void> {
    if (!validateCounterPartyId()) {
      return
    }

    if (discoveryMode.value === 'dspversionparams' && counterPartyAddress.value.trim() === '') {
      errorMessage.value = 'Enter a counterparty DSP address for DSP version discovery.'
      return
    }

    errorMessage.value = ''
    activeAction.value = 'discover'

    try {
      const result = await discoverConnectorRequest(props.proxyId, {
        mode: discoveryMode.value,
        counterPartyId: counterPartyId.value.trim(),
        counterPartyAddress: counterPartyAddress.value.trim() || undefined,
      })
      setResult(result, 'EDC Discovery Result', 'Could not discover the EDC connector.')
    } finally {
      activeAction.value = ''
    }
  }

  async function requestCatalog (): Promise<void> {
    if (!validateCounterPartyId()) {
      return
    }

    if (counterPartyAddress.value.trim() === '') {
      errorMessage.value = 'Enter a counterparty DSP address for catalog requests.'
      return
    }

    errorMessage.value = ''
    activeAction.value = 'catalog'

    try {
      const result = await requestCatalogRequest(props.proxyId, {
        counterPartyId: counterPartyId.value.trim(),
        counterPartyAddress: counterPartyAddress.value.trim(),
        protocol: protocol.value.trim(),
      })
      setResult(result, 'EDC Catalog Result', 'Could not request the EDC catalog.')
    } finally {
      activeAction.value = ''
    }
  }

  function validateCounterPartyId (): boolean {
    if (counterPartyId.value.trim() === '') {
      errorMessage.value = 'Enter a counterparty ID.'
      return false
    }

    return true
  }

  function setResult (result: unknown | null, title: string, fallbackError: string): void {
    if (result === null) {
      errorMessage.value = fallbackError
      return
    }

    lastResult.value = result
    lastResultTitle.value = title
  }
</script>
