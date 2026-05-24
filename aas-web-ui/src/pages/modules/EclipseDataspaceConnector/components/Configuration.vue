<template>
  <v-container fluid>
    <v-row class="mt-2">
      <v-col cols="2">
        <v-list-item-title>EDC</v-list-item-title>
      </v-col>

      <v-col cols="4">
        <v-select
          v-model="edcType"
          hide-details="auto"
          :items="edcTypeItems"
          label="EDC Type"
          variant="solo"
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

      <v-col v-if="selectedEdcMeta" cols="4" offset="2">
        <v-card density="compact" rounded="lg">
          <v-list density="compact" lines="one">
            <v-list-item
              prepend-icon="mdi-origin"
              subtitle="Original EDC"
              :title="selectedEdcMeta.edc_original"
            />

            <v-divider />

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

    <v-row>
      <v-divider />
    </v-row>

    <v-row>
      <v-col cols="2">
        <v-list-item-title>EDC Controlplane </v-list-item-title>
      </v-col>

      <v-col cols="10">
        <v-text-field
          v-model="edcControlplaneApiEndpoint"
          clearable
          hide-details="auto"
          hint="e.g. https://.../api"
          label="API Endpoint"
          prepend-inner-icon="mdi-web"
          :rules="edcEndpointRule"
          variant="solo"
        >
          <template #prepend-inner>
            <v-icon
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

        <template v-if="edcControlplaneApiEndpointIsHealthy === false">

          <v-alert
            border="start"
            class="mt-2"
            closable
            density="compact"
            text="Ensure proper CORS config of EDC Controlplane !"
            type="warning"
            variant="flat"
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
            variant="flat"
          >
            <div>Unhealthy EDC components:</div>

            <v-list-item-title
              v-for="(component, index) in edcControlplaneApiEndpointUnhealthyComponents"
              :key="index"
              class="text-body-small pl-2"
            >
              - {{ component.component || 'unknown' }} <template v-if="component.failure">({{ component.failure }})</template>
            </v-list-item-title>
          </v-alert>

        </template>

      </v-col>
    </v-row>

    <v-row>
      <v-col cols="10" offset="2">
        <v-text-field
          v-model="edcControlplaneManagementApiEndpoint"
          clearable
          hide-details="auto"
          hint="e.g. https://.../api/management/v3"
          label="Management API Endpoint"
          prepend-inner-icon="mdi-web"
          :rules="edcEndpointRule"
          variant="solo"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4" offset="2">

        <v-list-subheader>API Key</v-list-subheader>

        <v-text-field
          v-model="edcControlplaneManagementApiAuthKey"
          :append-inner-icon="showEdcControlplaneManagementApiAuthKey ? 'mdi-eye-off' : 'mdi-eye'"
          clearable
          hide-details="auto"
          label="X-Api-Key"
          prepend-inner-icon="mdi-key-variant"
          :type="showEdcControlplaneManagementApiAuthKey ? 'text' : 'password'"
          variant="solo"
          @click:append-inner="showEdcControlplaneManagementApiAuthKey = !showEdcControlplaneManagementApiAuthKey"
        />
      </v-col>

      <v-col class="d-flex justify-center align-start" cols="1">
        <v-list-subheader class="text-center">or</v-list-subheader>
      </v-col>

      <v-col cols="5">

        <v-list-subheader>Token Server</v-list-subheader>

        <v-text-field
          v-model="edcControlplaneTokenServerEndpoint"
          clearable
          hide-details="auto"
          label="Token Endpoint"
          prepend-inner-icon="mdi-web"
          variant="solo"
        />

        <v-text-field
          v-model="edcControlplaneTokenClientId"
          class="my-4"
          clearable
          hide-details="auto"
          label="Client ID"
          prepend-inner-icon="mdi-identifier"
          variant="solo"
        />

        <v-text-field
          v-model="edcControlplaneTokenClientSecret"
          :append-inner-icon="showEdcControlplaneTokenClientSecret ? 'mdi-eye-off' : 'mdi-eye'"
          clearable
          hide-details="auto"
          label="Client Secret"
          prepend-inner-icon="mdi-key"
          :type="showEdcControlplaneTokenClientSecret ? 'text' : 'password'"
          variant="solo"
          @click:append-inner="showEdcControlplaneTokenClientSecret = !showEdcControlplaneTokenClientSecret"
        />

      </v-col>

    </v-row>

    <v-row>
      <v-divider />
    </v-row>

    <v-row>
      <v-col cols="2">
        <v-list-item-title>Business Partners</v-list-item-title>

        <div class="mt-2 d-flex justify-start">
          <v-btn
            color="gray"
            density="compact"
            prepend-icon="mdi-plus"
            variant="tonal"
            @click="createBusinessPartner()"
          >
            Create Business Partner
          </v-btn>
        </div>
      </v-col>

      <v-col cols="10">

        <template v-if="businessPartners.length > 0">
          <template
            v-for="(partner, index) in businessPartners"
            :key="index"
          >
            <v-row>
              <v-col cols="3">
                <v-text-field
                  v-model="partner.name"
                  clearable
                  hide-details="auto"
                  label="Name"
                  prepend-inner-icon="mdi-account"
                  variant="solo"
                >
                  <template #prepend>
                    <v-btn
                      color="gray"
                      density="compact"
                      icon
                      size="small"
                      variant="text"
                      @click="deleteBusinessPartner(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                      <v-tooltip activator="parent" location="bottom">Delete Business Partner</v-tooltip>
                    </v-btn>
                  </template>
                </v-text-field>
              </v-col>

              <v-col cols="3">
                <v-text-field
                  v-model="partner.bpn"
                  clearable
                  hide-details="auto"
                  label="BPN"
                  prepend-inner-icon="mdi-identifier"
                  variant="solo"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="partner.dsp"
                  clearable
                  hide-details="auto"
                  label="DSP Endpoint"
                  prepend-inner-icon="mdi-web"
                  variant="solo"
                />
              </v-col>
            </v-row>
          </template>
        </template>

        <v-empty-state
          v-else
          text="No business partners configured"
          title="Business Partners"
        />
      </v-col>
    </v-row>

  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useEdcClient } from '../composables/Client/EdcClient'
  import edcData from '../data/edc.json'
  import { useEdcStore } from '../store/EdcStore'
  import { EDC_TYPES } from '../types/Edc'

  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { checkControlplaneHealth, checkControlplaneLiveness, checkControlplaneReadiness, checkControlplaneStartup } = useEdcClient()

  // Data
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
  const edcControlplaneManagementApiEndpoint = ref(edcStore.getControlplaneMgmtEndpoint)
  const edcControlplaneApiEndpoint = ref(edcStore.getControlplaneEndpoint)
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
