<template>
  <v-btn
    density="comfortable"
    :icon="ICONS.CONFIGS"
    size="small"
    variant="text"
    v-bind="i18nData('config.title')"
    @click="onOpenDialog"
  >
    <v-icon>{{ ICONS.CONFIGS }}</v-icon>

    <v-tooltip activator="parent" location="bottom" :open-delay="600">
      {{ t('config.title') }}
    </v-tooltip>
  </v-btn>

  <v-dialog v-model="isDialogOpen" max-width="560" persistent>
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center">
        <span class="text-h6" v-bind="i18nData('config.title')">{{ t('config.title') }}</span>
        <v-spacer />

        <v-btn
          density="comfortable"
          :icon="ICONS.CLOSE"
          size="small"
          variant="text"
          @click="onCloseDialog"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="isValid" @submit.prevent="onSave">
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

        <v-btn
          variant="text"
          v-bind="i18nData('config.cancel')"
          @click="onCloseDialog"
        >
          {{ t('config.cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          :disabled="!isValid"
          variant="flat"
          v-bind="i18nData('config.save')"
          @click="onSave"
        >
          {{ t('config.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { VForm } from 'vuetify/components'
  import { ref } from 'vue'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import { useAbacConfigStore } from '@/pages/modules/ABAC/stores/useAbacConfigStore'
  import { type Locale, Locales } from '@/pages/modules/ABAC/types/locale'
  import { useNavigationStore } from '@/store/NavigationStore'

  const ICONS = {
    CONFIGS: 'mdi-cog',
    CLOSE: 'mdi-close',
  } as const

  const { t, i18nData } = useAbacI18n()
  const configStore = useAbacConfigStore()
  const navigationStore = useNavigationStore()

  const isDialogOpen = ref(false)
  const form = ref<VForm | null>(null)
  const isValid = ref(false)

  const localState = ref<{ language: Locale }>({
    language: Locales.EN,
  })

  const localeOptions = Object.entries(Locales).map(([key, value]) => ({
    title: key,
    value,
  }))

  function onOpenDialog (): void {
    localState.value = {
      language: configStore.language,
    }
    isDialogOpen.value = true
  }

  function onCloseDialog (): void {
    isDialogOpen.value = false
  }

  async function onSave (): Promise<void> {
    if (!form.value) return
    const { valid } = await form.value.validate()
    if (!valid) return

    configStore.setLanguage(localState.value.language)

    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 3000,
      color: 'success',
      btnColor: 'buttonText',
      text: t('config.saved'),
    })

    onCloseDialog()
  }
</script>
