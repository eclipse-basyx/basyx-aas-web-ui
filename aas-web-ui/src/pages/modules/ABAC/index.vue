<script setup lang="ts">
  import { provide, watch } from 'vue'
  import AbacLayout from './components/AbacLayout.vue'
  import { ABAC_I18N_KEY } from './constants/i18n'
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

  // Providers
  provide(ABAC_I18N_KEY, i18nGlobal)

  watch(
    () => configStore.language,
    lang => {
      i18nGlobal.locale.value = lang
    },
    { immediate: true },
  )
</script>

<template>
  <AbacLayout />
</template>
