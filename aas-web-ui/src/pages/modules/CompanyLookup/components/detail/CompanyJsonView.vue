<template>
  <CodeViewer
    :copy-label="t('detail.json.copy')"
    :download-label="t('detail.json.download')"
    :file-name="`${company.idShort || 'data'}.json`"
    :text="jsonString"
    title="JSON"
  />
</template>

<script setup lang="ts">
  import type { CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
  import { useCompanyLookupI18n } from '../../i18n/useCompanyLookupI18n'

  const { company } = defineProps<{ company: CompanyDescriptor }>()
  const { t } = useCompanyLookupI18n()
  const jsonString = computed(() => company ? JSON.stringify(company, null, 2) : '')
</script>
