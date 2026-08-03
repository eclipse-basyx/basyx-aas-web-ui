<script setup lang="ts">
  import type { VForm } from 'vuetify/components'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useTestConnection } from '@/composables/Client/CompanyLookup/queries/useTestConnection'
  import { hasContent } from '@/utils/StringUtils'
  import { useCompanyLookupI18n } from '../i18n/useCompanyLookupI18n'
  import { type CompanyLookupConfig, useCompanyLookupConfigStore } from '../stores/useCompanyLookupConfigStore'
  import { Locales } from '../types/locale'

  const { t } = useCompanyLookupI18n()
  const configStore = useCompanyLookupConfigStore()

  const isDialogOpen = ref(false)
  const form = ref<VForm | null>(null)
  const isValid = ref(false)

  const localState = ref<CompanyLookupConfig>({
    apiUrl: '',
    language: Locales.EN,
  })

  const effectiveUrl = computed(() =>
    isDialogOpen.value ? localState.value.apiUrl : configStore.apiUrl,
  )

  /*
  const rules = {
   required: (v: string) => !!v || t('config.required'),
    url: (v: string) => validateURL(v) || t('config.invalidUrl'),
  }
  */

  const localeOptions = Object.entries(Locales).map(([key, value]) => ({
    title: key,
    value,
  }))

  const {
    mutate: runTest,
    isPending: isTesting,
    isSuccess: testSucceeded,
    isError: testFailed,
    reset: resetTest,
  } = useTestConnection()

  const testIcon = computed(() => {
    if (!hasContent(effectiveUrl.value)) return 'mdi-circle-outline'
    if (isTesting.value) return 'mdi-help-circle'
    if (testSucceeded.value) return 'mdi-check-circle'
    if (testFailed.value) return 'mdi-alert-circle'
    return 'mdi-help-circle'
  })

  const testColor = computed(() => {
    if (isTesting.value) return 'grey'
    if (testSucceeded.value) return 'success'
    if (testFailed.value) return 'error'
    return 'grey'
  })

  const testMessage = computed(() => {
    if (isTesting.value) return t('config.testing')
    if (testSucceeded.value) return t('config.testOk')
    if (testFailed.value) return t('config.testFailed')
    return ''
  })

  watch(() => localState.value.apiUrl, (newVal, oldVal) => {
    if (!isDialogOpen.value) return
    if (newVal === oldVal) return
    if (newVal === configStore.apiUrl) return
    resetTest()
  })

  onMounted(() => {
    if (hasContent(effectiveUrl.value)) {
      runTest(effectiveUrl.value)
    }
  })

  function onOpenDialog (): void {
    localState.value = {
      apiUrl: configStore.apiUrl,
      language: configStore.language,
    }
    isDialogOpen.value = true
  }

  function onCloseDialog (): void {
    isDialogOpen.value = false
  }

  async function onTest (): Promise<void> {
    if (!form.value) return
    const { valid } = await form.value.validate()
    if (!valid) return
    runTest(localState.value.apiUrl)
  }

  async function onSave (): Promise<void> {
    if (!form.value) return
    const { valid } = await form.value.validate()
    if (!valid) return

    /*
    let trimmedUrl = localState.value.apiUrl.trim()
    if (trimmedUrl.endsWith('/')) {
      trimmedUrl = trimmedUrl.slice(0, -1)
    }
    configStore.setApiUrl(trimmedUrl)
    */
    configStore.setLanguage(localState.value.language)

    onCloseDialog()
  }
</script>

<template>
  <v-btn
    density="comfortable"
    icon="mdi-cog"
    size="small"
    variant="text"
    @click="onOpenDialog"
  >
    <v-icon>mdi-cog</v-icon>

    <v-tooltip activator="parent" location="bottom" :open-delay="600">
      {{ t('config.title') }}
    </v-tooltip>
  </v-btn>

  <v-dialog v-model="isDialogOpen" max-width="560" persistent>
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center">
        <span class="text-h6">{{ t('config.title') }}</span>
        <v-spacer />

        <v-btn
          density="comfortable"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="onCloseDialog"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="isValid" @submit.prevent="onSave">
          <v-text-field
            v-model="localState.apiUrl"
            class="mb-2"
            density="comfortable"
            :hint="testMessage"
            :label="t('config.apiUrl')"
            :persistent-hint="!!testMessage"
            placeholder="https://example.com/api"
            readonly
            variant="outlined"
          >
            <template #prepend-inner>
              <v-icon :color="testColor">{{ testIcon }}</v-icon>
            </template>

            <template #append-inner>
              <v-tooltip location="top" :open-delay="400">
                <template #activator="{ props: tipProps }">
                  <v-btn
                    v-bind="tipProps"
                    density="comfortable"
                    :disabled="!isValid"
                    :icon="isTesting ? '' : 'mdi-connection'"
                    :loading="isTesting"
                    size="small"
                    variant="text"
                    @click="onTest"
                  />
                </template>
                {{ t('config.testConnection') }}
              </v-tooltip>
            </template>
          </v-text-field>

          <v-select
            v-model="localState.language"
            density="comfortable"
            item-title="title"
            item-value="value"
            :items="localeOptions"
            :label="t('config.language')"
            variant="outlined"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />

        <v-btn variant="text" @click="onCloseDialog">
          {{ t('config.cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          :disabled="!isValid"
          variant="flat"
          @click="onSave"
        >
          {{ t('config.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
