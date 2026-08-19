<script setup lang="ts">
  import { provide, watch } from 'vue'
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
  const { selectedService, onSelectService } = useAbacNavigation()

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

<template>
  <AbacLayout :loading="isPending" />
</template>
