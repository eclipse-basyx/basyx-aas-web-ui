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
      <strong>No AAS server connection</strong>

      <div class="mt-1">
        The Web UI needs a separate AAS server to browse data.
        <span v-if="!envStore.getEndpointConfigAvailable">Contact your administrator to connect one.</span>
      </div>
    </template>

    <template #actions>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          class="text-none"
          density="default"
          href="https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html#quick-start"
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
          class="text-none text-buttonText"
          color="primary"
          density="default"
          rounded="lg"
          size="small"
          variant="flat"
          @click="managementOpen = true"
        >
          Connect server
        </v-btn>
      </div>
    </template>
  </v-banner>

  <InfrastructureManagement v-if="managementOpen" v-model:open="managementOpen" />
</template>

<script lang="ts" setup>
  import { useBackendSetupNotice } from '@/composables/Infrastructure/useBackendSetupNotice'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  const envStore = useEnvStore()
  const navigationStore = useNavigationStore()
  const { showNotice } = useBackendSetupNotice()

  const managementOpen = ref(false)
</script>
