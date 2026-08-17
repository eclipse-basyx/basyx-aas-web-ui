<script setup lang="ts">
  import { ref } from 'vue'
  import { useActivatePolicy } from '@/pages/modules/ABAC/api/queries/policy/useActivatePolicy'
  import { useCloneVersion } from '@/pages/modules/ABAC/api/queries/policy/useCloneVersion'
  import { useRejectPolicy } from '@/pages/modules/ABAC/api/queries/policy/useRejectPolicy'
  import { useValidatePolicy } from '@/pages/modules/ABAC/api/queries/policy/useValidatePolicy'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { usePolicy } from '../../../hooks/usePolicy'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import PolicyValidationDialog from './PolicyValidationDialog.vue'

  const ICONS = {
    CLONE: 'mdi-source-branch',
    VALIDATE: 'mdi-check-circle',
    ACTIVATE: 'mdi-play-circle',
    REJECT: 'mdi-cancel',
  } as const

  type ConfirmAction = 'activate' | 'reject'
  type PolicyAction = 'clone' | 'validate' | 'activate' | 'reject'

  const { t, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()
  const { onSelectPolicy } = useAbacNavigation()
  const { selectedPolicyVersion, policy } = usePolicy()

  const { mutateAsync: clone, isPending: isCloning } = useCloneVersion()
  const { mutateAsync: validate, isPending: isValidating } = useValidatePolicy()
  const { mutateAsync: activate, isPending: isActivating } = useActivatePolicy()
  const { mutateAsync: reject, isPending: isRejecting } = useRejectPolicy()

  const confirmDialog = ref(false)
  const confirmAction = ref<ConfirmAction | null>(null)

  function openConfirm (action: ConfirmAction): void {
    confirmAction.value = action
    confirmDialog.value = true
  }

  const policyValidationDialog = ref<InstanceType<typeof PolicyValidationDialog> | null>(null)

  async function doAction (action: PolicyAction): Promise<void> {
    if (!hasContent(selectedPolicyVersion.value)) return

    try {
      switch (action) {
        case 'clone': {
          const clonedPolicy = await clone(selectedPolicyVersion.value)
          onSelectPolicy(clonedPolicy.version_id)
          break
        }
        case 'validate': {
          const result = await validate(selectedPolicyVersion.value)
          if (result) policyValidationDialog.value?.open(result)
          break
        }
        case 'activate': {
          await activate(selectedPolicyVersion.value)
          break
        }
        case 'reject': {
          await reject(selectedPolicyVersion.value)
          break
        }
      }

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 3000,
        color: 'success',
        btnColor: 'buttonText',
        text: t(`policies.policy.success.${action}`),
      })
    } catch {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: t(`policies.policy.error.${action}`),
      })
    }
  }

  function onConfirm (): void {
    confirmDialog.value = false
    if (confirmAction.value) {
      void doAction(confirmAction.value)
    }
  }
</script>

<template>
  <div class="d-flex flex-wrap justify-end ga-2">
    <v-btn
      color="surface-light"
      :loading="isCloning"
      size="small"
      v-bind="i18nData('policies.policy.clone')"
      @click="doAction('clone')"
    >
      <v-icon class="mr-1" :icon="ICONS.CLONE" size="small" />
      {{ t('policies.policy.clone') }}
    </v-btn>

    <template v-if="policy?.status === 'staged'">
      <v-btn
        color="warning"
        :loading="isValidating"
        size="small"
        v-bind="i18nData('policies.policy.validate')"
        @click="doAction('validate')"
      >
        <v-icon class="mr-1" :icon="ICONS.VALIDATE" size="small" />
        {{ t('policies.policy.validate') }}
      </v-btn>

      <v-btn
        color="success"
        :loading="isActivating"
        size="small"
        v-bind="i18nData('policies.policy.activate')"
        @click="openConfirm('activate')"
      >
        <v-icon class="mr-1" :icon="ICONS.ACTIVATE" size="small" />
        {{ t('policies.policy.activate') }}
      </v-btn>

      <v-btn
        color="error"
        :loading="isRejecting"
        size="small"
        v-bind="i18nData('policies.policy.reject')"
        @click="openConfirm('reject')"
      >
        <v-icon class="mr-1" :icon="ICONS.REJECT" size="small" />
        {{ t('policies.policy.reject') }}
      </v-btn>
    </template>
  </div>

  <v-dialog v-if="confirmAction" v-model="confirmDialog" max-width="420" persistent>
    <v-card>
      <v-card-title class="pa-4" v-bind="i18nData(`policies.policy.confirmDialog.${confirmAction}.title`)">
        {{ t(`policies.policy.confirmDialog.${confirmAction}.title`) }}
      </v-card-title>

      <v-card-text class="pa-4" v-bind="i18nData(`policies.policy.confirmDialog.${confirmAction}.message`)">
        {{ t(`policies.policy.confirmDialog.${confirmAction}.message`,{ version: selectedPolicyVersion }) }}
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="text" v-bind="i18nData('policies.policy.confirmDialog.cancel')" @click="confirmDialog = false">
          {{ t('policies.policy.confirmDialog.cancel') }}
        </v-btn>

        <v-btn
          :color="confirmAction === 'reject' ? 'error' : 'warning'"
          variant="flat"
          v-bind="i18nData(`policies.policy.confirmDialog.${confirmAction}.confirm`)"
          @click="onConfirm"
        >
          {{ t(`policies.policy.confirmDialog.${confirmAction}.confirm`) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <PolicyValidationDialog ref="policyValidationDialog" />
</template>
