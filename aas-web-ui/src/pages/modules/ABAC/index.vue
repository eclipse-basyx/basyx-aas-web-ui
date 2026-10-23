<template>
  <AbacLayout :loading="isPending" />
</template>

<script setup lang="ts">
  import { useGetPolicies } from './api/policy/useGetPolicies'
  import { useAbacServiceDiscovery } from './api/useAbacServiceDiscovery'
  import AbacLayout from './components/AbacLayout.vue'
  import { ABAC_I18N_KEY } from './constants/i18n'
  import { useAbacNavigation } from './hooks/navigation/useAbacNavigation'
  import { i18nGlobal } from './i18n/setup'
  import { useAbacConfigStore } from './stores/useAbacConfigStore'

  defineOptions({
    moduleName: 'ABAC',
    moduleTitle: 'ABAC Policy Editor',
    isDesktopModule: true,
    isMobileModule: true,
    isVisibleModule: true,
    needsAuthentication: true,
    supportedInfrastructureTemplates: ['full', 'identifiable', 'mono-repo', 'mono-all'],
  })

  const configStore = useAbacConfigStore()
  void configStore.initialize()

  // URL <-> store sync
  const { data: discoveredServices, isPending } = useAbacServiceDiscovery()
  const { selectedService, onSelectService, selectedPolicyVersion, onSelectPolicy } = useAbacNavigation()

  watch(
    discoveredServices,
    services => {
      if (services === undefined) return

      const isInitialized = configStore.initializeServices(services, selectedService.value)

      if (isInitialized && !selectedService.value) {
        // Auto-selected: update URL to match
        const match = services.find(s => s.url === configStore.apiUrl)
        if (match) onSelectService(match.componentKey)
      }
    },
    { immediate: true })

  // Sync store when the user navigates back/forward or ?service= changes externally.
  // The discovery watcher above only fires on initial load / refetch.
  watch(selectedService, key => {
    if (!key || configStore.services.length === 0) return
    const match = configStore.services.find(s => s.componentKey === key)
    if (match) configStore.setApiUrl(match.url)
  })

  // Select active policy if no policy param is passed
  const { data: policies } = useGetPolicies()
  watch([policies, selectedService], ([list, service]) => {
    if (selectedPolicyVersion.value || !service) return
    const active = list?.find(policy => policy.status === 'active')
    if (active) onSelectPolicy(active.version_id, { replace: true })
  }, { immediate: true, flush: 'post' })

  watch(
    () => configStore.language,
    lang => {
      i18nGlobal.locale.value = lang
    },
    { immediate: true },
  )

  // Providers
  provide(ABAC_I18N_KEY, i18nGlobal)
</script>

<style scoped>
  :global(.abac-field-warning .v-messages) {
    color: rgb(var(--v-theme-warning));
  }

  /* Menu-opened dialogs can inherit a lower Vuetify stack level than the FAB.
     Hide mobile navigation only while an ABAC modal is active, including its
     teleported menu; visibility also removes those controls from keyboard focus. */
  :global(body:has(.abac-dialog.v-overlay--active) .app-mobile-menu) {
    visibility: hidden;
  }

  /* Dialog overlays are teleported outside AbacLayout's scoped descendants. */
  :global(:is(.abac-scroll, .abac-dialog) ::-webkit-scrollbar) {
    width: 4px;
    height: 4px;
  }

  :global(:is(.abac-scroll, .abac-dialog) ::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(:is(.abac-scroll, .abac-dialog) ::-webkit-scrollbar-thumb) {
    background: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 2px;
  }

  :global(:is(.abac-scroll, .abac-dialog) ::-webkit-scrollbar-thumb:hover) {
    background: rgba(var(--v-theme-on-surface), 0.4);
  }
</style>
