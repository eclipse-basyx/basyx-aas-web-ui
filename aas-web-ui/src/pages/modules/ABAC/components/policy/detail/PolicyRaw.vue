<template>
  <div class="d-flex flex-column pa-2 bg-card">
    <div class="d-flex align-center mb-2">
      <v-spacer />

      <v-btn
        :prepend-icon="copyIcon"
        size="small"
        variant="text"
        v-bind="i18nData('policies.policy.copy')"
        @click="onCopy"
      >
        {{ t('policies.policy.copy') }}
      </v-btn>

      <v-btn
        :prepend-icon="ICONS.DOWNLOAD"
        size="small"
        variant="text"
        v-bind="i18nData('policies.policy.download')"
        @click="onDownload"
      >
        {{ t('policies.policy.download') }}
      </v-btn>
    </div>

    <JsonCodeEditor
      :disabled="true"
      :model-value="policyJson"
    />
  </div>
</template>

<script setup lang="ts">
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import JsonCodeEditor from '@/pages/modules/ABAC/components/shared/JsonCodeEditor.vue'
  import { usePolicy } from '@/pages/modules/ABAC/hooks/usePolicy'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import { downloadJson } from '@/utils/generalUtils'

  const ICONS = {
    COPY: 'mdi-content-copy',
    DOWNLOAD: 'mdi-download',
  } as const

  const { t, i18nData } = useAbacI18n()
  const { copyJsonToClipboard } = useClipboardUtil()
  const { selectedPolicyVersion, policy } = usePolicy()

  const fileName = computed(() => `Policy_v${selectedPolicyVersion.value}.json`)
  const copyIcon = ref<string>(ICONS.COPY)

  const policyJson = computed(() => {
    if (!policy.value) return ''
    return JSON.stringify(policy.value, null, 2)
  })

  function onCopy (): void {
    copyJsonToClipboard(policy.value, fileName.value, copyIcon, false)
  }

  function onDownload (): void {
    downloadJson(policy.value, fileName.value)
  }
</script>
