<script setup lang="ts">
  import { ref } from 'vue'
  import { useDeleteRule } from '@/composables/Client/ABAC/queries/rule/useDeleteRule'
  import { useDuplicateRule } from '@/composables/Client/ABAC/queries/rule/useDuplicateRule'
  import { useMoveRule } from '@/composables/Client/ABAC/queries/rule/useMoveRule'
  import { useToggleRule } from '@/composables/Client/ABAC/queries/rule/useToggleRule'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { useRules } from '../../../hooks/useRules'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'

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

  const emit = defineEmits<{ (e: 'replace' | 'patch'): void }>()

  const { t, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, onSelectRule } = useAbacNavigation()
  const { rulesCount, selectedRule } = useRules()
  const isEnabled = computed(() => selectedRule.value?.access.toLocaleLowerCase() === 'ALLOW'.toLocaleLowerCase())

  const { mutateAsync: duplicateRule, isPending: isDuplicating } = useDuplicateRule()
  const { mutateAsync: moveRule, isPending: isMoving } = useMoveRule()
  const { mutateAsync: toggleRule, isPending: isToggling } = useToggleRule()
  const { mutateAsync: deleteRule, isPending: isDeleting } = useDeleteRule()

  const moveDialog = ref(false)
  const movePosition = ref<number | null>(null)

  const deleteDialog = ref(false)
  async function doAction (action: RuleAction): Promise<void> {
    const ruleIndex = selectedRule.value?.rule_index
    const versionId = selectedPolicyVersion.value
    if (!hasContent(ruleIndex?.toString()) || !hasContent(versionId)) return

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
        case 'duplicate': {
          await duplicateRule({ versionId, ruleIndex })
          break
        }
        case 'move': {
          if (!moveDialog.value) {
            moveDialog.value = true
            movePosition.value = selectedRule.value?.rule_index ?? null
            return
          }
          if (movePosition.value === null) return
          await moveRule({
            versionId,
            ruleIndex,
            payload: { position: movePosition.value },
          })
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
          onSelectRule(ruleIndex)
          deleteDialog.value = false
          break
        }
      }

      if (action === 'replace' || action === 'patch') return

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

<template>
  <v-row v-if="selectedRule" class="d-flex align-center pa-2 ga-2">
    <v-col class="d-flex flex-wrap align-center ga-2" cols="12">
      <v-btn
        size="small"
        variant="tonal"
        v-bind="i18nData('rules.replace')"
        @click="doAction('replace')"
      >
        <v-icon class="mr-1" :icon="ICONS.REPLACE" size="small" />
        {{ t('rules.replace') }}
      </v-btn>

      <v-btn
        size="small"
        variant="tonal"
        v-bind="i18nData('rules.patch')"
        @click="doAction('patch')"
      >
        <v-icon class="mr-1" :icon="ICONS.PATCH" size="small" />
        {{ t('rules.patch') }}
      </v-btn>

      <v-btn
        :loading="isDuplicating"
        size="small"
        variant="tonal"
        v-bind="i18nData('rules.duplicate')"
        @click="doAction('duplicate')"
      >
        <v-icon class="mr-1" :icon="ICONS.DUPLICATE" size="small" />
        {{ t('rules.duplicate') }}
      </v-btn>

      <v-btn
        size="small"
        variant="tonal"
        v-bind="i18nData('rules.move')"
        @click="doAction('move')"
      >
        <v-icon class="mr-1" :icon="ICONS.MOVE" size="small" />
        {{ t('rules.move') }}
      </v-btn>

      <v-btn
        :loading="isToggling"
        size="small"
        variant="tonal"
        v-bind="i18nData(`rules.${isEnabled ? 'disable' : 'enable'}`)"
        @click="doAction('toggle')"
      >
        <v-icon class="mr-1" :icon="isEnabled ? ICONS.DISABLE : ICONS.ENABLE" size="small" />
        {{ t(`rules.${isEnabled ? 'disable' : 'enable'}`) }}
      </v-btn>
    </v-col>

    <v-col class="d-flex justify-end align-center " cols="12">
      <v-btn
        color="error"
        :loading="isDeleting"
        size="small"
        variant="tonal"
        v-bind="i18nData('rules.delete')"
        @click="doAction('delete')"
      >
        <v-icon class="mr-1" :icon="ICONS.DELETE" size="small" />
        {{ t('rules.delete') }}
      </v-btn>
    </v-col>

    <!-- Move dialog -->
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
            :disabled="isMoving"
            :loading="isMoving"
            variant="flat"
            @click="doAction('move')"
          >
            {{ t('rules.moveDialog.move') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="pa-4">
          {{ t('rules.deleteDialog.title') }}
        </v-card-title>

        <v-card-text class="pa-4">
          {{ t('rules.deleteDialog.message', {index: selectedRule?.rule_index }) }}
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="deleteDialog = false">
            {{ t('rules.deleteDialog.cancel') }}
          </v-btn>

          <v-btn color="error" :loading="isDeleting" variant="flat" @click="doAction('delete')">
            {{ t('rules.deleteDialog.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row></template>
