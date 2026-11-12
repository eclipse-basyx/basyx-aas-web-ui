<template>
  <!-- Persistent live region: screen readers announce the banner when it appears. -->
  <div aria-live="polite" role="status">
    <v-banner
      v-if="displayedKind && !managementOpen"
      bg-color="cardHeader"
      border
      class="ma-4"
      density="compact"
      elevation="4"
      location="bottom end"
      :max-height="`calc(100dvh - ${BANNER_VERTICAL_CLEARANCE}px)`"
      max-width="calc(100vw - 32px)"
      position="fixed"
      rounded="lg"
      stacked
      :style="bannerStyle"
      width="360"
    >
      <template #prepend>
        <v-icon
          :color="displayedKind === 'setup' ? 'primary' : 'warning'"
          icon="mdi-server-network-off"
          size="small"
        />
      </template>

      <template #text>
        <strong>{{ title }}</strong>

        <p class="mt-1">
          {{ message }}
          <a
            v-if="displayedKind === 'unreachable' && canEditEndpoints"
            class="text-primary"
            :href="SETUP_GUIDE_URL"
            rel="noopener noreferrer"
            target="_blank"
          >Setup guide</a>
        </p>
      </template>

      <template v-if="canEditEndpoints || displayedKind === 'unreachable'" #actions>
        <!-- Buttons would otherwise inherit the banner's compact density. -->
        <v-defaults-provider :defaults="{ VBtn: { density: 'default', rounded: 'lg', size: 'small' } }">
          <div class="d-flex flex-wrap ga-2">
            <template v-if="displayedKind === 'setup'">
              <v-btn
                class="text-none"
                :href="SETUP_GUIDE_URL"
                rel="noopener noreferrer"
                target="_blank"
                text="Setup guide"
                variant="outlined"
              />

              <v-btn
                class="text-none text-buttonText"
                color="primary"
                text="Connect server"
                variant="flat"
                @click="managementOpen = true"
              />
            </template>

            <template v-else>
              <v-btn
                v-if="canEditEndpoints"
                class="text-none"
                text="Connection settings"
                variant="outlined"
                @click="managementOpen = true"
              />

              <v-btn
                class="text-none text-buttonText"
                color="primary"
                :loading="retrying"
                text="Retry"
                variant="flat"
                @click="retryConnection"
              />
            </template>
          </div>
        </v-defaults-provider>
      </template>
    </v-banner>
  </div>

  <InfrastructureManagement v-if="managementOpen" v-model:open="managementOpen" edit-selected />
</template>

<script lang="ts" setup>
  import type { BackendSetupNoticeKind } from '@/composables/Infrastructure/useBackendSetupNotice'
  import { useBackendSetupNotice } from '@/composables/Infrastructure/useBackendSetupNotice'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  const SETUP_GUIDE_URL = 'https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html#quick-start'
  // Clears the 40px app footer on desktop and the mobile menu button (bottom 50px + 48px) on phones.
  const BANNER_BOTTOM_OFFSET = { desktop: 48, mobile: 104 }
  // Keeps the banner below the app bar when the viewport is short.
  const BANNER_VERTICAL_CLEARANCE = 112
  // Above app bars and navigation drawers, below Vuetify overlays such as dialogs, menus and snackbars.
  const BANNER_Z_INDEX = 1500
  // Keeps Retry visibly busy even when a refused connection fails within milliseconds.
  const MIN_RETRY_FEEDBACK_MS = 500

  const envStore = useEnvStore()
  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()
  const { noticeKind, infrastructureName, hasUsableConnection } = useBackendSetupNotice()

  const managementOpen = ref(false)
  const retrying = ref(false)

  const canEditEndpoints = computed(() => envStore.getEndpointConfigAvailable)
  // Rechecking makes the connection state pending; keep the banner and its Retry button in place meanwhile.
  const displayedKind = computed<BackendSetupNoticeKind | null>(() => retrying.value ? 'unreachable' : noticeKind.value)
  const title = computed(() => displayedKind.value === 'setup'
    ? 'No data source configured'
    : `Cannot reach ${infrastructureName.value}`)
  const message = computed(() => {
    if (displayedKind.value === 'setup') {
      return canEditEndpoints.value
        ? 'Connect a server that provides data for this view.'
        : 'No server is configured for this view. Contact your administrator.'
    }
    return canEditEndpoints.value
      ? 'Check that the server is running and that its URL and CORS settings are correct.'
      : 'The server is not responding. Retry later or contact your administrator.'
  })
  const bannerStyle = computed(() => ({
    zIndex: BANNER_Z_INDEX,
    bottom: `${navigationStore.getIsMobile ? BANNER_BOTTOM_OFFSET.mobile : BANNER_BOTTOM_OFFSET.desktop}px`,
  }))

  async function retryConnection (): Promise<void> {
    const infrastructureId = infrastructureStore.getSelectedInfrastructure?.id
    retrying.value = true
    try {
      await Promise.all([
        infrastructureStore.connectComponents(),
        new Promise(resolve => setTimeout(resolve, MIN_RETRY_FEEDBACK_MS)),
      ])
      if (infrastructureId === infrastructureStore.getSelectedInfrastructure?.id && hasUsableConnection.value) {
        navigationStore.dispatchTriggerAASListReload()
        navigationStore.dispatchTriggerTreeviewReload()
      }
    } finally {
      retrying.value = false
    }
  }
</script>
