<template>
  <ActionMenu v-model="isMenuOpen">
    <ActionMenuItem
      :icon="ICONS.REPLACE"
      :label="t('definitions.replace')"
      @click="doAction('replace')"
    />

    <ActionMenuItem
      :icon="ICONS.PATCH"
      :label="t('definitions.patch')"
      @click="doAction('patch')"
    />

    <v-divider />

    <ActionMenuItem
      color="error"
      :icon="ICONS.DELETE"
      :label="t('definitions.delete')"
      @click="doAction('delete')"
    />
  </ActionMenu>

  <ConfirmDialog
    v-model="deleteDialog"
    :cancel-label="t('definitions.deleteDialog.cancel')"
    confirm-color="error"
    :confirm-label="t('definitions.deleteDialog.delete')"
    :loading="isDeleting"
    :message="t('definitions.deleteDialog.message', { name: definition.name })"
    :title="t('definitions.deleteDialog.title')"
    @confirm="doAction('delete')"
  />
</template>

<script setup lang="ts">
  import type { Definition, DefinitionKind } from '../../../types/definitions'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useDeleteDefinition } from '../../../api/definition/useDeleteDefinition'
  import { DEFINITION_DIALOG_KEY } from '../../../constants/inject'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import ConfirmDialog from '../../shared/ConfirmDialog.vue'
  import ActionMenu from '../../shared/menu/ActionMenu.vue'
  import ActionMenuItem from '../../shared/menu/ActionMenuItem.vue'

  type DefinitionAction = 'replace' | 'patch' | 'delete'

  const ICONS = {
    REPLACE: 'mdi-pencil',
    PATCH: 'mdi-pencil-box',
    DELETE: 'mdi-delete',
  } as const

  const { definition, kind } = defineProps<{ definition: Definition, kind: DefinitionKind }>()

  const openDialog = inject(DEFINITION_DIALOG_KEY)

  const { t } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, selectedDefinitionName, selectedDefinitionKind, onSelectDefinition } = useAbacNavigation()

  const { mutateAsync: deleteDefinition, isPending: isDeleting } = useDeleteDefinition()

  const isMenuOpen = ref(false)
  const deleteDialog = ref(false)

  async function doAction (action: DefinitionAction): Promise<void> {
    isMenuOpen.value = false

    const name = definition.name
    const versionId = selectedPolicyVersion.value
    if (!hasContent(name) || !hasContent(kind) || !hasContent(versionId)) return

    try {
      switch (action) {
        case 'replace':
        case 'patch': {
          // Select definition only if it was not selected already
          if (selectedDefinitionName.value !== name || selectedDefinitionKind.value !== kind) {
            onSelectDefinition(name, kind)
          }
          openDialog?.({ mode: action, definition, kind })
          return
        }
        case 'delete': {
          if (!deleteDialog.value) {
            deleteDialog.value = true
            return
          }
          await deleteDefinition({ versionId, kind, name })
          // Remove selected definition only if it was selected already
          // e.g. user can select DEF-A but open the menu on DEF-B
          if (selectedDefinitionName.value === name && selectedDefinitionKind.value === kind) onSelectDefinition(name, kind, true)

          deleteDialog.value = false
          break
        }
      }

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
