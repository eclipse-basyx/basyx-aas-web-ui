<template>
  <ActionMenu v-model="isMenuOpen" :icon-size="iconSize">
    <ActionMenuItem
      :icon="copyIcon"
      :label="t('policies.policy.copy')"
      @click="doAction('copy')"
    />

    <ActionMenuItem
      :icon="ICONS.DOWNLOAD"
      :label="t('policies.policy.download')"
      @click="doAction('download')"
    />

    <ActionMenuItem
      :icon="ICONS.CLONE"
      :label="t('policies.policy.clone')"
      @click="doAction('clone')"
    />

    <template v-if="policy?.status === 'staged'">
      <v-divider />

      <ActionMenuItem
        color="warning"
        :icon="ICONS.VALIDATE"
        :label="t('policies.policy.validate')"
        @click="doAction('validate')"
      />

      <ActionMenuItem
        color="success"
        :icon="ICONS.ACTIVATE"
        :label="t('policies.policy.activate')"
        @click="doAction('activate')"
      />

      <ActionMenuItem
        color="error"
        :icon="ICONS.REJECT"
        :label="t('policies.policy.reject')"
        @click="doAction('reject')"
      />
    </template>
  </ActionMenu>

  <ConfirmDialog
    v-if="confirmAction"
    v-model="confirmDialog"
    :cancel-label="t('policies.policy.confirmDialog.cancel')"
    :confirm-color="confirmAction === 'reject' ? 'error' : 'warning'"
    :confirm-label="t(`policies.policy.confirmDialog.${confirmAction}.confirm`)"
    :message="t(`policies.policy.confirmDialog.${confirmAction}.message`, { version: selectedPolicyVersion })"
    :title="t(`policies.policy.confirmDialog.${confirmAction}.title`)"
    @confirm="doAction(confirmAction)"
  />

  <PolicyValidationDialog ref="policyValidationDialog" />
</template>

<script setup lang="ts">
  import type { PolicyVersion } from '../../../types/policy'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { downloadJson } from '@/utils/generalUtils'
  import { hasContent } from '@/utils/StringUtils'
  import { useActivatePolicy } from '../../../api/policy/useActivatePolicy'
  import { useCloneVersion } from '../../../api/policy/useCloneVersion'
  import { useRejectPolicy } from '../../../api/policy/useRejectPolicy'
  import { useValidatePolicy } from '../../../api/policy/useValidatePolicy'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import ConfirmDialog from '../../shared/ConfirmDialog.vue'
  import ActionMenu from '../../shared/menu/ActionMenu.vue'
  import ActionMenuItem from '../../shared/menu/ActionMenuItem.vue'
  import PolicyValidationDialog from '../detail/PolicyValidationDialog.vue'

  const ICONS = {
    COPY: 'mdi-clipboard-file-outline',
    DOWNLOAD: 'mdi-download',
    CLONE: 'mdi-source-branch',
    VALIDATE: 'mdi-check-circle',
    ACTIVATE: 'mdi-play-circle',
    REJECT: 'mdi-cancel',
  } as const

  type ConfirmAction = 'activate' | 'reject'
  type PolicyAction = 'copy' | 'download' | 'clone' | 'validate' | 'activate' | 'reject'

  const { policy, iconSize } = defineProps<{ policy: PolicyVersion, iconSize?: string }>()

  const { t } = useAbacI18n()
  const { copyJsonToClipboard } = useClipboardUtil()
  const navigationStore = useNavigationStore()
  const { onSelectPolicy } = useAbacNavigation()

  const selectedPolicyVersion = computed(() => policy.version_id.toString())

  const { mutateAsync: clone } = useCloneVersion()
  const { mutateAsync: validate } = useValidatePolicy()
  const { mutateAsync: activate } = useActivatePolicy()
  const { mutateAsync: reject } = useRejectPolicy()

  const copyIcon = ref<string>(ICONS.COPY)
  const fileName = computed(() => `Policy_v${selectedPolicyVersion.value}.json`)

  const isMenuOpen = ref(false)
  const confirmDialog = ref(false)
  const confirmAction = ref<ConfirmAction | null>(null)

  const policyValidationDialog = ref<InstanceType<typeof PolicyValidationDialog> | null>(null)

  async function doAction (action: PolicyAction): Promise<void> {
    isMenuOpen.value = false

    if (!hasContent(selectedPolicyVersion.value)) return

    try {
      switch (action) {
        case 'copy': {
          copyJsonToClipboard(policy, fileName.value, copyIcon, false)
          return
        }
        case 'download': {
          downloadJson(policy, fileName.value)
          return
        }
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
        case 'activate':
        case 'reject': {
          if (!confirmDialog.value) {
            confirmAction.value = action
            confirmDialog.value = true
            return
          }
          await (action === 'activate' ? activate(selectedPolicyVersion.value) : reject(selectedPolicyVersion.value))
          confirmDialog.value = false
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
</script>
