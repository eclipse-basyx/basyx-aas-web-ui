<script setup lang="ts">
  import { provide, watch } from 'vue'
  import CompanyLookupLayout from './components/CompanyLookupLayout.vue'
  import { COMPANY_LOOKUP_I18N_KEY } from './constants/i18n'
  import { i18nGlobal } from './i18n/setup'
  import { useCompanyLookupConfigStore } from './stores/useCompanyLookupConfigStore'

  defineOptions({
    moduleName: 'CompanyLookup',
    moduleTitle: 'Company Lookup',
    isDesktopModule: true,
    isMobileModule: true,
    isVisibleModule: true,
    supportedInfrastructureTemplates: ['full'],
  })

  const configStore = useCompanyLookupConfigStore()
  void configStore.initialize()

  // Providers
  provide(COMPANY_LOOKUP_I18N_KEY, i18nGlobal)

  watch(
    () => configStore.language,
    lang => {
      i18nGlobal.locale.value = lang
    },
    { immediate: true },
  )
</script>

<template>
  <CompanyLookupLayout />
</template>
