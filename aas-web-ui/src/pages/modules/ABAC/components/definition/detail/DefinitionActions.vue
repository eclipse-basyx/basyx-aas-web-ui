<template>
  <v-row v-if="selectedDefinition" class="d-flex align-center pa-2 ga-2">
    <v-col class="d-flex flex-wrap align-center ga-2" cols="12">
      <v-btn
        size="small"
        variant="tonal"
        v-bind="i18nData('definitions.replace')"
        @click="doAction('replace')"
      >
        <v-icon class="mr-1" :icon="ICONS.REPLACE" size="small" />
        {{ t('definitions.replace') }}
      </v-btn>

      <v-btn
        size="small"
        variant="tonal"
        v-bind="i18nData('definitions.patch')"
        @click="doAction('patch')"
      >
        <v-icon class="mr-1" :icon="ICONS.PATCH" size="small" />
        {{ t('definitions.patch') }}
      </v-btn>
    </v-col>

    <v-col class="d-flex justify-end align-center " cols="12">
      <v-btn
        color="error"
        :loading="isDeleting"
        size="small"
        variant="tonal"
        v-bind="i18nData('definitions.delete')"
        @click="doAction('delete')"
      >
        <v-icon class="mr-1" :icon="ICONS.DELETE" size="small" />
        {{ t('definitions.delete') }}
      </v-btn>
    </v-col>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="pa-4">
          {{ t('definitions.deleteDialog.title') }}
        </v-card-title>

        <v-card-text class="pa-4">
          {{ t('definitions.deleteDialog.message', {name: selectedDefinition.name }) }}
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="deleteDialog = false">
            {{ t('definitions.deleteDialog.cancel') }}
          </v-btn>

          <v-btn color="error" :loading="isDeleting" variant="flat" @click="doAction('delete')">
            {{ t('definitions.deleteDialog.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row></template>

<script setup lang="ts">
  import { useDeleteDefinition } from '@/pages/modules/ABAC/api/definition/useDeleteDefinition'
  import { useAbacNavigation } from '@/pages/modules/ABAC/hooks/useAbacNavigation'
  import { useDefinitions } from '@/pages/modules/ABAC/hooks/useDefinitions'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'

  type DefinitionAction = 'replace' | 'patch' | 'delete'

  const ICONS = {
    REPLACE: 'mdi-pencil',
    PATCH: 'mdi-pencil-box',
    DELETE: 'mdi-delete',
  } as const

  const emit = defineEmits<{ (e: 'replace' | 'patch'): void }>()

  const { t, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, onSelectDefinition } = useAbacNavigation()
  const { selectedDefinition, selectedDefinitionKind } = useDefinitions()

  const { mutateAsync: deleteDefinition, isPending: isDeleting } = useDeleteDefinition()

  const deleteDialog = ref(false)

  async function doAction (action: DefinitionAction): Promise<void> {
    const name = selectedDefinition.value?.name
    const kind = selectedDefinitionKind.value
    const versionId = selectedPolicyVersion.value
    if (!hasContent(name) || !hasContent(kind) || !hasContent(versionId)) return

    try {
      switch (action) {
        case 'replace': {
          emit('replace')
          break
        }
        case 'patch': {
          emit('patch')
          break
        }
        case 'delete': {
          if (!deleteDialog.value) {
            deleteDialog.value = true
            return
          }
          await deleteDefinition({ versionId, kind, name })
          onSelectDefinition(name, kind)
          deleteDialog.value = false
          break
        }
      }

      if (['replace', 'patch'].includes(action)) return

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 3000,
        color: 'success',
        btnColor: 'buttonText',
        text: t(`definitions.success.${action}`),
      })
    } catch {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: t(`definitions.error.${action}`),
      })
    }
  }

</script>
