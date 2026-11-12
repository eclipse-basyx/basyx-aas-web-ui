<template>
  <v-banner
    v-if="showNotice && !managementOpen"
    bg-color="cardHeader"
    border
    class="ma-4"
    density="compact"
    elevation="4"
    location="bottom end"
    max-height="calc(100dvh - 112px)"
    max-width="calc(100vw - 32px)"
    position="fixed"
    role="status"
    rounded="lg"
    stacked
    :style="{ zIndex: 2000, bottom: navigationStore.getIsMobile ? '104px' : '48px' }"
    width="360"
  >
    <template #prepend>
      <v-icon color="primary" icon="mdi-server-network-off" size="small" />
    </template>

    <template #text>
      <strong>{{ noticeKind === 'setup' ? 'No data source configured' : `Cannot reach ${infrastructureName}` }}</strong>

      <div class="mt-1">
        <template v-if="noticeKind === 'setup'">
          Connect a server that provides data for this view.
        </template>

        <template v-else>
          Check the server, URL and CORS settings.
          <a class="text-primary" :href="setupGuideUrl" rel="noopener noreferrer" target="_blank">Setup guide</a>
        </template>

        <span v-if="!envStore.getEndpointConfigAvailable">Contact your administrator to check the connection.</span>
      </div>
    </template>

    <template #actions>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          v-if="noticeKind === 'setup'"
          class="text-none"
          density="default"
          :href="setupGuideUrl"
          rel="noopener noreferrer"
          rounded="lg"
          size="small"
          target="_blank"
          variant="outlined"
        >
          Setup guide
        </v-btn>

        <v-btn
          v-if="envStore.getEndpointConfigAvailable"
          :class="noticeKind === 'setup' ? 'text-none text-buttonText' : 'text-none'"
          :color="noticeKind === 'setup' ? 'primary' : undefined"
          density="default"
          rounded="lg"
          size="small"
          :variant="noticeKind === 'setup' ? 'flat' : 'outlined'"
          @click="managementOpen = true"
        >
          {{ noticeKind === 'setup' ? 'Connect server' : 'Connection settings' }}
        </v-btn>

        <v-btn
          v-if="noticeKind === 'unreachable'"
          class="text-none text-buttonText"
          color="primary"
          density="default"
          :loading="retrying"
          rounded="lg"
          size="small"
          variant="flat"
          @click="retryConnection"
        >
          Retry
        </v-btn>
      </div>
    </template>
  </v-banner>

  <InfrastructureManagement v-if="managementOpen" v-model:open="managementOpen" />
</template>

<script lang="ts" setup>
  import { useBackendSetupNotice } from '@/composables/Infrastructure/useBackendSetupNotice'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  const envStore = useEnvStore()
  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()
  const { showNotice, noticeKind, infrastructureName, hasUsableConnection } = useBackendSetupNotice()

  const managementOpen = ref(false)
  const retrying = ref(false)
  const setupGuideUrl = 'https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html#quick-start'

  async function retryConnection (): Promise<void> {
    const infrastructureId = infrastructureStore.getSelectedInfrastructure?.id
    retrying.value = true
    try {
      await infrastructureStore.connectComponents()
      if (infrastructureId === infrastructureStore.getSelectedInfrastructure?.id && hasUsableConnection.value) {
        navigationStore.dispatchTriggerAASListReload()
        navigationStore.dispatchTriggerTreeviewReload()
      }
    } finally {
      retrying.value = false
    }
  }
</script>
