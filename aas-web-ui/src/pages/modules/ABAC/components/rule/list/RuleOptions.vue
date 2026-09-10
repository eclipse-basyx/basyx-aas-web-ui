<template>
  <ActionMenu v-model="isMenuOpen">
    <ActionMenuItem
      :icon="ICONS.REPLACE"
      :label="t('rules.replace')"
      @click="doAction('replace')"
    />

    <ActionMenuItem
      :icon="ICONS.PATCH"
      :label="t('rules.patch')"
      @click="doAction('patch')"
    />

    <ActionMenuItem
      :icon="ICONS.DUPLICATE"
      :label="t('rules.duplicate')"
      @click="doAction('duplicate')"
    />

    <ActionMenuItem
      :icon="ICONS.MOVE"
      :label="t('rules.move')"
      @click="doAction('move')"
    />

    <ActionMenuItem
      :color="isEnabled ? 'error' :'green'"
      :icon="isEnabled ? ICONS.DISABLE : ICONS.ENABLE"
      :label="t(`rules.${isEnabled ? 'disable' : 'enable'}`)"
      @click="doAction('toggle')"
    />

    <v-divider />

    <ActionMenuItem
      color="error"
      :icon="ICONS.DELETE"
      :label="t('rules.delete')"
      @click="doAction('delete')"
    />
  </ActionMenu>

  <v-dialog v-model="moveDialog" max-width="400" persistent>
    <v-card>
      <v-card-title class="pa-4">
        {{ t('rules.moveDialog.title') }}
      </v-card-title>

      <v-card-text class="pa-4">
        <v-select
          v-model.number="movePosition"
          class="mb-3"
          density="comfortable"
          hide-details
          :items="Array.from({ length: rulesCount }, (_, i) => i + 1)"
          :label="t('rules.moveDialog.position')"
          variant="outlined"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="moveDialog = false">
          {{ t('rules.moveDialog.cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          :loading="isMoving"
          variant="flat"
          @click="doAction('move')"
        >
          {{ t('rules.moveDialog.move') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <ConfirmDialog
    v-model="deleteDialog"
    :cancel-label="t('rules.deleteDialog.cancel')"
    confirm-color="error"
    :confirm-label="t('rules.deleteDialog.delete')"
    :loading="isDeleting"
    :message="t('rules.deleteDialog.message', { index: rule.rule_index })"
    :title="t('rules.deleteDialog.title')"
    @confirm="doAction('delete')"
  />
</template>

<script setup lang="ts">
  import type { Rule } from '../../../types/rules'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useDeleteRule } from '../../../api/rule/useDeleteRule'
  import { useDuplicateRule } from '../../../api/rule/useDuplicateRule'
  import { useMoveRule } from '../../../api/rule/useMoveRule'
  import { useToggleRule } from '../../../api/rule/useToggleRule'
  import { RULE_DIALOG_KEY } from '../../../constants/inject'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { useRules } from '../../../hooks/useRules'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import ConfirmDialog from '../../shared/ConfirmDialog.vue'
  import ActionMenu from '../../shared/menu/ActionMenu.vue'
  import ActionMenuItem from '../../shared/menu/ActionMenuItem.vue'

  type RuleAction = 'replace' | 'patch' | 'duplicate' | 'move' | 'toggle' | 'delete'

  const ICONS = {
    REPLACE: 'mdi-pencil',
    PATCH: 'mdi-pencil-box',
    DUPLICATE: 'mdi-content-copy',
    MOVE: 'mdi-arrow-right',
    ENABLE: 'mdi-toggle-switch',
    DISABLE: 'mdi-toggle-switch-off',
    DELETE: 'mdi-delete',
  } as const

  const { rule } = defineProps<{ rule: Rule }>()

  const openDialog = inject(RULE_DIALOG_KEY)

  const { t } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, selectedRuleIndex, onSelectRule } = useAbacNavigation()
  const { rulesCount } = useRules()
  const isEnabled = computed(() => rule.access?.toUpperCase() === 'ALLOW')

  const { mutateAsync: duplicateRule } = useDuplicateRule()
  const { mutateAsync: moveRule, isPending: isMoving } = useMoveRule()
  const { mutateAsync: toggleRule } = useToggleRule()
  const { mutateAsync: deleteRule, isPending: isDeleting } = useDeleteRule()

  const isMenuOpen = ref(false)
  const moveDialog = ref(false)
  const movePosition = ref<number | null>(null)
  const deleteDialog = ref(false)

  async function doAction (action: RuleAction): Promise<void> {
    isMenuOpen.value = false

    const ruleIndex = rule.rule_index
    const versionId = selectedPolicyVersion.value
    const selectedIndex = Number(selectedRuleIndex.value)

    if (!hasContent(ruleIndex?.toString()) || !hasContent(versionId)) return

    try {
      switch (action) {
        case 'replace':
        case 'patch': {
          // Select rule only if it was not selected already
          if (selectedIndex !== ruleIndex) {
            onSelectRule(ruleIndex)
          }
          openDialog?.({ mode: action, rule })
          return
        }
        case 'duplicate': {
          await duplicateRule({ versionId, ruleIndex })
          onSelectRule(ruleIndex + 1)
          break
        }
        case 'move': {
          if (!moveDialog.value) {
            moveDialog.value = true
            movePosition.value = ruleIndex
            return
          }
          if (movePosition.value === null) return
          const position = movePosition.value
          await moveRule({
            versionId,
            ruleIndex,
            payload: { position },
          })

          if (position !== ruleIndex) {
            onSelectRule(position, true)
          }
          moveDialog.value = false
          break
        }
        case 'toggle': {
          await toggleRule({
            versionId,
            ruleIndex,
            payload: { enabled: !isEnabled.value },
          })
          break
        }
        case 'delete': {
          if (!deleteDialog.value) {
            deleteDialog.value = true
            return
          }
          await deleteRule({ versionId, ruleIndex })

          // Remove selected rule only if it was selected already
          // e.g. user can select DEF-A but open the menu on DEF-B
          if (selectedIndex === ruleIndex) onSelectRule(ruleIndex, true)

          // Update selected rule index if the deleted index is smaller then the selected
          else if (selectedIndex > ruleIndex) onSelectRule(selectedIndex - 1, true)

          deleteDialog.value = false
          break
        }
      }

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 3000,
        color: 'success',
        btnColor: 'buttonText',
        text: t(`rules.success.${action}`),
      })
    } catch {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: t(`rules.error.${action}`),
      })
    }
  }
</script>
