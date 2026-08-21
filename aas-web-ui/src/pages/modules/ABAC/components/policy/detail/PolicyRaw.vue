<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { downloadJson } from '@/utils/generalUtils'
  import { usePolicy } from '../../../hooks/usePolicy'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import JsonCodeEditor from '../../shared/JsonCodeEditor.vue'

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

<template>
  <div class="d-flex flex-column h-100 pa-2 bg-card">
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
