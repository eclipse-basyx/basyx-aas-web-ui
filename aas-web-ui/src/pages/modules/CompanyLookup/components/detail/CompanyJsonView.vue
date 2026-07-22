<script setup lang="ts">
  import type { CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
  import { computed, ref } from 'vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { downloadJson } from '@/utils/generalUtils'
  import { useCompanyLookupI18n } from '../../i18n/useCompanyLookupI18n'

  const { company } = defineProps<{ company: CompanyDescriptor }>()

  const { t } = useCompanyLookupI18n()
  const { copyJsonToClipboard } = useClipboardUtil()

  const jsonString = computed(() =>
    company ? JSON.stringify(company, null, 2) : '',
  )

  const fileName = `${company.idShort || 'data'}.json`
  const copyIcon = ref<string>('mdi-content-copy')

  function onCopy (): void {
    copyJsonToClipboard(jsonString.value, fileName, copyIcon)
  }

  function onDownload (): void {
    downloadJson(jsonString.value, fileName)
  }
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <div class="d-flex align-center mb-2">
      <v-spacer />

      <v-btn
        :prepend-icon="copyIcon"
        size="small"
        variant="text"
        @click="onCopy"
      >
        {{ t('detail.json.copy') }}
      </v-btn>

      <v-btn
        prepend-icon="mdi-download"
        size="small"
        variant="text"
        @click="onDownload"
      >
        {{ t('detail.json.download') }}
      </v-btn>
    </div>

    <pre class="json-view flex-grow-1"><code>{{ jsonString }}</code></pre>
  </div>
</template>

<style scoped>
.fill-height { height: 100%; }

.json-view {
  background: white;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  overflow: auto;
  white-space: pre;
  margin: 0;
  color:black;
}
</style>
