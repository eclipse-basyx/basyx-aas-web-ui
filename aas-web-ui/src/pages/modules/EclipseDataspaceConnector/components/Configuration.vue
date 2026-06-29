<template>
  <v-container class="pa-4" fluid style="overflow-y: auto;" :style="{ 'height': fullHeight}">
    <!-- General Settings -->
    <v-card class="mb-6" elevation="2" rounded="lg">
      <v-card-item prepend-icon="mdi-cog-outline">
        <v-card-title>General Settings</v-card-title>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="5">
            <v-select
              v-model="edcType"
              flat
              hide-details="auto"
              :items="edcTypeItems"
              label="EDC Type"
              variant="solo-filled"
            >
              <template v-if="selectedEdcMeta" #append-inner>
                <v-btn
                  density="compact"
                  :href="selectedEdcMeta.github_url"
                  icon
                  size="small"
                  target="_blank"
                  variant="text"
                >
                  <v-icon>mdi-github</v-icon>
                  <v-tooltip activator="parent" location="bottom">{{ selectedEdcMeta.id }} on GitHub</v-tooltip>
                </v-btn>
              </template>
            </v-select>
          </v-col>

          <v-col v-if="selectedEdcMeta" cols="12" md="6" offset="1">
            <v-card class="bg-grey-lighten-4" flat rounded="lg">
              <v-list bg-color="transparent" density="compact" lines="one">
                <v-list-item
                  prepend-icon="mdi-origin"
                  subtitle="Original EDC"
                  :title="selectedEdcMeta.edc_original.id"
                >
                  <template #append>
                    <v-btn
                      density="compact"
                      :href="selectedEdcMeta.edc_original.github_url"
                      icon
                      size="small"
                      target="_blank"
                      variant="text"
                    >
                      <v-icon>mdi-github</v-icon>
                      <v-tooltip activator="parent" location="bottom">{{ selectedEdcMeta.edc_original.id }} on GitHub</v-tooltip>
                    </v-btn>
                  </template>
                </v-list-item>

                <v-divider />

                <v-list-item
                  prepend-icon="mdi-protocol"
                  subtitle="Dataspace Protocol"
                  :title="'DSP ' + selectedEdcMeta.dataspace_protocol.version"
                />
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Controlplane Settings -->
    <v-card class="mb-6" elevation="2" rounded="lg">
      <v-card-item prepend-icon="mdi-server-network">
        <v-card-title>Controlplane Settings</v-card-title>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="edcControlplaneApiEndpoint"
              clearable
              flat
              hide-details="auto"
              hint="e.g. https://.../api"
              label="API Endpoint"
              prepend-inner-icon="mdi-web"
              :rules="edcEndpointRule"
              variant="solo-filled"
            >
              <template #prepend-inner>
                <v-icon
                  class="mr-2"
                  :color="
                    edcControlplaneApiEndpointIsHealthy === true
                      ? 'success'
                      : edcControlplaneApiEndpointIsHealthy === false
                        ? 'error'
                        : edcControlplaneApiEndpoint
                          ? 'grey'
                          : 'grey'
                  "
                  size="small"
                >
                  {{
                    edcControlplaneApiEndpointIsHealthy === true
                      ? 'mdi-check-circle'
                      : edcControlplaneApiEndpointIsHealthy === false
                        ? 'mdi-alert-circle'
                        : edcControlplaneApiEndpoint
                          ? 'mdi-help-circle'
                          : 'mdi-circle-outline'
                  }}
                </v-icon>
              </template>

              <template #append-inner>
                <v-btn
                  :disabled="!edcControlplaneApiEndpoint"
                  icon
                  :loading="testingEdcControlApiEndpointHealth"
                  size="x-small"
                  variant="text"
                  @click.stop="testControlplaneConnection()"
                >
                  <v-icon>mdi-connection</v-icon>
                  <v-tooltip activator="parent" location="bottom">Test Connection</v-tooltip>
                </v-btn>
              </template>
            </v-text-field>

            <v-expand-transition>
              <div v-if="edcControlplaneApiEndpointIsHealthy === false">
                <v-alert
                  border="start"
                  class="mt-3"
                  closable
                  density="compact"
                  text="Ensure proper CORS config of EDC Controlplane!"
                  type="warning"
                  variant="tonal"
                >
                  <template #prepend>
                    <v-btn
                      href="https://github.com/eclipse-edc/Connector/blob/main/extensions/common/http/jersey-core/README.md"
                      icon
                      size="x-small"
                      target="_blank"
                      variant="text"
                    >
                      <v-icon size="small">mdi-link-variant</v-icon>
                      <v-tooltip activator="parent" location="top">View EDC CORS Configuration</v-tooltip>
                    </v-btn>
                  </template>
                </v-alert>

                <v-alert
                  v-if="edcControlplaneApiEndpointUnhealthyComponents?.length"
                  border="start"
                  class="mt-2"
                  closable
                  density="compact"
                  type="warning"
                  variant="tonal"
                >
                  <div class="font-weight-bold mb-1">Unhealthy EDC components:</div>

                  <div
                    v-for="(component, index) in edcControlplaneApiEndpointUnhealthyComponents"
                    :key="index"
                    class="text-caption pl-2"
                  >
                    • {{ component.component || 'unknown' }} <span v-if="component.failure" class="text-grey">({{ component.failure }})</span>
                  </div>
                </v-alert>
              </div>
            </v-expand-transition>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="edcControlplaneManagementApiEndpoint"
              clearable
              flat
              hide-details="auto"
              hint="e.g. https://.../api/management/v3"
              label="Management API Endpoint"
              prepend-inner-icon="mdi-web"
              :rules="edcEndpointRule"
              variant="solo-filled"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="edcControlplaneDspEndpoint"
              clearable
              flat
              hide-details="auto"
              hint="e.g. https://.../api/v1/dsp"
              label="DSP Endpoint"
              prepend-inner-icon="mdi-web"
              :rules="edcEndpointRule"
              variant="solo-filled"
            />
          </v-col>

        </v-row>
      </v-card-text>
    </v-card>

    <!-- Security Settings -->
    <v-card class="mb-6" elevation="2" rounded="lg">
      <v-card-item prepend-icon="mdi-shield-lock-outline">
        <v-card-title>Security Settings</v-card-title>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <v-row>
          <v-col cols="12" md="5">
            <div class="text-subtitle-2 mb-2 text-grey-darken-1">Authentication via API Key</div>

            <v-text-field
              v-model="edcControlplaneManagementApiAuthKey"
              :append-inner-icon="showEdcControlplaneManagementApiAuthKey ? 'mdi-eye-off' : 'mdi-eye'"
              clearable
              flat
              hide-details="auto"
              label="X-Api-Key"
              prepend-inner-icon="mdi-key-variant"
              :type="showEdcControlplaneManagementApiAuthKey ? 'text' : 'password'"
              variant="solo-filled"
              @click:append-inner="showEdcControlplaneManagementApiAuthKey = !showEdcControlplaneManagementApiAuthKey"
            />
          </v-col>

          <v-col class="d-flex align-center justify-center" cols="12" md="1">
            <div class="d-flex align-center w-100">
              <v-divider class="flex-grow-1" />
              <span class="mx-4 text-overline text-grey">OR</span>
              <v-divider class="flex-grow-1" />
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="text-subtitle-2 mb-2 text-grey-darken-1">Authentication via Token Server</div>

            <v-text-field
              v-model="edcControlplaneTokenServerEndpoint"
              class="mb-4"
              clearable
              flat
              hide-details="auto"
              label="Token Endpoint"
              prepend-inner-icon="mdi-web"
              variant="solo-filled"
            />

            <v-row density="comfortable">
              <v-col cols="6">
                <v-text-field
                  v-model="edcControlplaneTokenClientId"
                  clearable
                  flat
                  hide-details="auto"
                  label="Client ID"
                  prepend-inner-icon="mdi-identifier"
                  variant="solo-filled"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="edcControlplaneTokenClientSecret"
                  :append-inner-icon="showEdcControlplaneTokenClientSecret ? 'mdi-eye-off' : 'mdi-eye'"
                  clearable
                  flat
                  hide-details="auto"
                  label="Client Secret"
                  prepend-inner-icon="mdi-key"
                  :type="showEdcControlplaneTokenClientSecret ? 'text' : 'password'"
                  variant="solo-filled"
                  @click:append-inner="showEdcControlplaneTokenClientSecret = !showEdcControlplaneTokenClientSecret"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Business Partners -->
    <v-card elevation="2" rounded="lg">
      <v-card-item prepend-icon="mdi-account-multiple">
        <v-card-title>Business Partners</v-card-title>

        <template #append>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            size="small"
            variant="flat"
            @click="createBusinessPartner()"
          >
            Add Partner
          </v-btn>
        </template>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <template v-if="businessPartners.length > 0">
          <v-row v-for="(partner, index) in businessPartners" :key="index" class="mb-2 align-center">
            <v-col cols="12" md="3">
              <v-text-field
                v-model="partner.name"
                clearable
                flat
                hide-details="auto"
                label="Name"
                prepend-inner-icon="mdi-account"
                variant="solo-filled"
              >
                <template #prepend>
                  <v-btn
                    color="error"
                    density="compact"
                    icon
                    variant="text"
                    @click="deleteBusinessPartner(index)"
                  >
                    <v-icon size="20">mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="bottom">Delete Business Partner</v-tooltip>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-text-field
                v-model="partner.bpn"
                clearable
                flat
                hide-details="auto"
                label="BPN"
                prepend-inner-icon="mdi-identifier"
                variant="solo-filled"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="partner.dsp"
                clearable
                flat
                hide-details="auto"
                label="DSP Endpoint"
                prepend-inner-icon="mdi-web"
                variant="solo-filled"
              />
            </v-col>
          </v-row>
        </template>

        <v-empty-state
          v-else
          icon="mdi-account-group-outline"
          text="No business partners configured yet. Add one to start exchanging data."
          title="No Partners Found"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import edcData from '@/pages/modules/EclipseDataspaceConnector/data/edc.json'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { EDC_TYPES } from '@/pages/modules/EclipseDataspaceConnector/types/Edc'

  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { checkControlplaneHealth, checkControlplaneLiveness, checkControlplaneReadiness, checkControlplaneStartup } = useEdcClient()

  // Data
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border

  const businessPartners = ref<Array<any>>([])
  const edcType = ref<null | (typeof EDC_TYPES)[number]>(
    EDC_TYPES.includes(edcStore.getEdcType as (typeof EDC_TYPES)[number])
      ? (edcStore.getEdcType as (typeof EDC_TYPES)[number])
      : null,
  )
  const edcTypeItems = EDC_TYPES

  // Computed
  const selectedEdcMeta = computed(() =>
    edcType.value ? (edcData as any[]).find(e => e.id === edcType.value) ?? null : null,
  )
  const edcControlplaneApiEndpoint = ref(edcStore.getControlplaneEndpoint)
  const edcControlplaneDspEndpoint = ref(edcStore.getControlplaneDspEndpoint)
  const edcControlplaneManagementApiEndpoint = ref(edcStore.getControlplaneMgmtEndpoint)
  const edcControlplaneManagementApiAuthKey = ref(edcStore.getControlplaneApiAuthKey)
  const showEdcControlplaneManagementApiAuthKey = ref(false)
  const edcControlplaneTokenServerEndpoint = ref(edcStore.getControlplaneTokenServerEndpoint)
  const edcControlplaneTokenClientId = ref(edcStore.getControlplaneTokenClientId)
  const edcControlplaneTokenClientSecret = ref(edcStore.getControlplaneTokenClientSecret)
  const showEdcControlplaneTokenClientSecret = ref(false)
  const testingEdcControlApiEndpointHealth = ref(false)
  const edcControlplaneApiEndpointIsHealthy = ref<boolean | null>(null)
  const edcControlplaneApiEndpointUnhealthyComponents = ref<Array<any> | null>(null)

  onMounted(() => {
    if (edcControlplaneApiEndpoint.value) {
      testControlplaneConnection()
    }
    loadBusinessPartners()
  })

  // Methods
  function loadBusinessPartners (): void {
    const config = edcStore.getEdcConfig
    businessPartners.value = config?.businessPartners ?? []
  }

  function createBusinessPartner (): void {
    businessPartners.value.push({
      name: '',
      bpn: '',
      dsp: '',
    })
  }

  function deleteBusinessPartner (index: number): void {
    businessPartners.value.splice(index, 1)
  }

  async function testControlplaneConnection (): Promise<void> {
    const endpoint = edcControlplaneApiEndpoint.value

    if (!endpoint) {
      console.warn('Endpoint is empty')
      return
    }

    testingEdcControlApiEndpointHealth.value = true

    try {
      const healthStatus = await checkControlplaneHealth(endpoint)
      const livenessStatus = await checkControlplaneLiveness(endpoint)
      const readinessStatus = await checkControlplaneReadiness(endpoint)
      const startupStatus = await checkControlplaneStartup(endpoint)

      const isHealthy = healthStatus && healthStatus.isSystemHealthy
        && livenessStatus && livenessStatus.isSystemHealthy
        && readinessStatus && readinessStatus.isSystemHealthy
        && startupStatus && startupStatus.isSystemHealthy

      const allComponentResults = [
        ...(healthStatus?.componentResults ?? []),
        ...(livenessStatus?.componentResults ?? []),
        ...(readinessStatus?.componentResults ?? []),
        ...(startupStatus?.componentResults ?? []),
      ]
      const componentResults = Array.from(
        new Map(allComponentResults.map(item => [item.component, item])).values(),
      )

      const unhealthyComponents = componentResults.filter(item => item.isHealthy !== true)
      edcControlplaneApiEndpointUnhealthyComponents.value = unhealthyComponents.length > 0
        ? unhealthyComponents
        : null

      edcControlplaneApiEndpointIsHealthy.value = isHealthy

      if (isHealthy) {
        // console.log(`✓ EDC Controlplane API endpoint is healthy`)
      } else if (healthStatus && livenessStatus && readinessStatus && startupStatus) {
        console.warn(`⚠ EDC Controlplane API responded but system is not fully healthy`)
        for (const item of unhealthyComponents) console.warn(item.component + ' not healthy')
        edcControlplaneApiEndpointIsHealthy.value = false
      } else {
        console.error(`✗ Failed to connect to EDC Controlplane API endpoint`)
        edcControlplaneApiEndpointIsHealthy.value = false
      }
    } catch (error) {
      console.error(`Error testing EDC Controlplane API endpoint:`, error)
      edcControlplaneApiEndpointIsHealthy.value = false
    } finally {
      testingEdcControlApiEndpointHealth.value = false
    }
  }

  // Watchers
  watch(
    () => edcStore.getEdcType,
    value => {
      edcType.value = EDC_TYPES.includes(value as (typeof EDC_TYPES)[number])
        ? (value as (typeof EDC_TYPES)[number])
        : null
    },
  )

  watch(
    () => edcStore.getControlplaneEndpoint,
    value => {
      edcControlplaneApiEndpoint.value = value
    },
  )

  watch(
    () => edcStore.getControlplaneMgmtEndpoint,
    value => {
      edcControlplaneManagementApiEndpoint.value = value
    },
  )

  watch(
    () => edcStore.getControlplaneDspEndpoint,
    value => {
      edcControlplaneDspEndpoint.value = value
    },
  )

  watch(
    () => edcStore.getControlplaneApiAuthKey,
    value => {
      edcControlplaneManagementApiAuthKey.value = value
    })

  watch(
    () => edcStore.getControlplaneTokenServerEndpoint,
    value => {
      edcControlplaneTokenServerEndpoint.value = value
    },
  )

  watch(
    () => edcStore.getControlplaneTokenClientId,
    value => {
      edcControlplaneTokenClientId.value = value
    },
  )

  watch(
    () => edcStore.getControlplaneTokenClientSecret,
    value => {
      edcControlplaneTokenClientSecret.value = value
    },
  )

  // Watchers to write back to store
  watch(
    () => edcType.value,
    value => {
      if (value) {
        edcStore.setEdcType(value)
      }
    },
  )

  watch(
    () => edcControlplaneApiEndpoint.value,
    value => {
      edcStore.setControlplaneEndpoint(value)
      edcControlplaneApiEndpointIsHealthy.value = null
      if (value) {
        testControlplaneConnection()
      }
    },
  )

  watch(
    () => edcControlplaneManagementApiEndpoint.value,
    value => {
      edcStore.setControlplaneMgmtEndpoint(value)
    },
  )

  watch(
    () => edcControlplaneDspEndpoint.value,
    value => {
      edcStore.setControlplaneDspEndpoint(value)
    },
  )

  watch(
    () => edcControlplaneManagementApiAuthKey.value,
    value => {
      edcStore.setControlplaneKey(value)
    },
  )

  watch(
    () => edcControlplaneTokenServerEndpoint.value,
    value => {
      edcStore.setSecurityConfigUrl(value)
    },
  )

  watch(
    () => edcControlplaneTokenClientId.value,
    value => {
      edcStore.setSecurityConfigClientId(value)
    },
  )

  watch(
    () => edcControlplaneTokenClientSecret.value,
    value => {
      edcStore.setSecurityConfigClientSecret(value)
    },
  )
  watch(
    () => edcStore.getEdcConfig,
    () => {
      loadBusinessPartners()
    },
  )
  const edcEndpointRule = [
    (value: string) => !!value || 'Endpoint required.',
    (value: string) => (value && (value.startsWith('http://') || value.startsWith('https://'))) || 'Endpoint should be start with http://... or https://...',
  ]
</script>
