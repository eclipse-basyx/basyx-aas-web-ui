<template>
  <AbacLayout :loading="isPending" />
</template>

<script setup lang="ts">
  import { useGetPolicies } from './api/policy/useGetPolicies'
  import { useAbacServiceDiscovery } from './api/useAbacServiceDiscovery'
  import AbacLayout from './components/AbacLayout.vue'
  import { ABAC_I18N_KEY } from './constants/i18n'
  import { useAbacNavigation } from './hooks/useAbacNavigation'
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
    if (active) onSelectPolicy(active.version_id)
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
