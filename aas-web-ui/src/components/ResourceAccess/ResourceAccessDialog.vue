<template>
  <v-dialog
    v-model="open"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : '900px'"
    persistent
    :scrollable="!isMobile"
  >
    <v-sheet
      border
      class="d-flex flex-column"
      :rounded="isMobile ? undefined : 'lg'"
      :style="isMobile ? { height: '100vh' } : undefined"
    >
      <v-card-title class="bg-cardHeader">Share {{ kindLabel }}</v-card-title>
      <v-divider />
      <v-progress-linear v-if="state.loading.value" color="primary" indeterminate />

      <v-card-text
        class="overflow-y-auto"
        :style="isMobile ? { flex: '1 1 auto', minHeight: '0' } : { maxHeight: '640px' }"
      >
        <v-list-item class="px-0 mb-2" :prepend-icon="resourceAccessIcon(target)">
          <v-list-item-title class="text-break">{{ resourceIdentity }}</v-list-item-title>

          <v-list-item-subtitle v-if="state.loaded.value" class="mt-2">
            <EffectiveAccess :rights="state.effective.value" />
          </v-list-item-subtitle>
        </v-list-item>

        <v-alert
          v-if="state.error.value"
          class="mb-3"
          closable
          density="compact"
          :text="state.error.value"
          type="error"
          variant="tonal"
          @click:close="state.error.value = ''"
        />

        <v-alert
          v-if="derivedFrom"
          class="mb-3"
          density="compact"
          icon="mdi-source-branch"
          type="info"
          variant="tonal"
        >
          This entry was created from <strong>{{ derivedFrom }}</strong> and follows its access. Change who has access there;
          direct access added here applies in addition.
        </v-alert>

        <v-skeleton-loader v-if="!state.loaded.value" type="list-item-two-line, list-item-two-line" />

        <v-alert
          v-else-if="!state.manageable.value && !state.error.value"
          density="compact"
          text="Only owners and administrators can change who has access to this resource."
          type="info"
          variant="tonal"
        />

        <template v-else-if="state.document.value">
          <v-tabs
            v-model="tab"
            class="mb-3"
            color="primary"
            density="compact"
            show-arrows
          >
            <v-tab prepend-icon="mdi-account-multiple-outline" text="People and groups" value="people" />
            <v-tab prepend-icon="mdi-link-variant" text="Invitation links" value="links" />
            <v-tab v-if="target?.kind === 'submodel'" prepend-icon="mdi-source-merge" text="Shell links" value="inheritance" />
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="people">
              <v-list-subheader class="mb-1">Add a person or group</v-list-subheader>

              <AccessPrincipalForm
                :current-principal="currentPrincipal"
                :disabled="state.loading.value"
                :loading="saving"
                :roles="roles"
                @add="addGrant"
              />

              <v-list-subheader class="mt-2 mb-1">People and groups with access</v-list-subheader>

              <AccessGrantList
                :current-principal="currentPrincipal"
                :disabled="saving"
                empty-text="Not shared with anyone yet."
                :grants="state.document.value.grants"
                :roles="roles"
                @change="changeRole"
                @remove="grantToRemove = $event"
              />
            </v-window-item>

            <v-window-item value="links">
              <InvitationManager
                v-if="target"
                :current-principal="currentPrincipal"
                :roles="invitationRoles"
                :target="target"
                @message="notify"
              />
            </v-window-item>

            <v-window-item value="inheritance">
              <InheritanceManager
                :disabled="saving"
                :links="state.document.value.inheritance ?? []"
                :suggested-aas-id="contextAasId"
                @update="updateInheritance"
              />
            </v-window-item>
          </v-window>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          border
          color="surface-light"
          :loading="state.loading.value"
          prepend-icon="mdi-refresh"
          rounded="lg"
          text="Refresh"
          variant="flat"
          @click="state.load()"
        />

        <v-spacer />
        <v-btn rounded="lg" text="Close" @click="open = false" />
      </v-card-actions>
    </v-sheet>

    <AccessConfirmDialog
      confirm-text="Remove"
      :model-value="Boolean(grantToRemove)"
      :text="removeText"
      title="Remove access?"
      @confirm="removeGrant"
      @update:model-value="closeRemoveDialog"
    />
  </v-dialog>
</template>

<script setup lang="ts">
  import type { AccessGrant, AccessPrincipal, GrantRelation, ResourceAccessTarget } from '@/types/ResourceAccess'
  import { useCurrentPrincipal } from '@/composables/Auth/CurrentPrincipal'
  import { useResourceAccessState } from '@/composables/ResourceAccess/ResourceAccessState'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { grantPrincipal, samePrincipal } from '@/utils/AccessPrincipal'
  import { rolesFor } from '@/utils/AccessRoles'
  import { resourceAccessIcon, resourceAccessTargets } from '@/utils/ResourceAccessTargets'

  const props = defineProps<{
    target?: ResourceAccessTarget
    contextAasId?: string
  }>()

  const open = defineModel<boolean>({ required: true })

  const navigationStore = useNavigationStore()
  const { currentPrincipal } = useCurrentPrincipal()
  const state = useResourceAccessState(toRef(props, 'target'))

  const tab = ref('people')
  const saving = ref(false)
  const grantToRemove = ref<AccessGrant>()

  const isMobile = computed(() => navigationStore.getIsMobile)
  const kindLabel = computed(() => props.target ? resourceAccessTargets[props.target.kind].label : 'Resource')
  const resourceIdentity = computed(() => {
    const object = state.document.value?.object ?? state.effective.value?.object
    return object?.idShortPath ? `${object.id} · ${object.idShortPath}` : object?.id ?? props.target?.label ?? ''
  })
  const roles = computed(() => props.target ? rolesFor(props.target.kind) : [])
  const invitationRoles = computed(() => roles.value.filter(role => role.value !== 'owner'))
  const derivedFrom = computed(() => {
    const source = state.document.value?.derivedFrom
    return source ? `${source.type === 'aas' ? 'the shell' : (source.type === 'submodel' ? 'the Submodel' : 'the descriptor')} ${source.id}` : ''
  })
  const removeText = computed(() => {
    const grant = grantToRemove.value
    if (!grant) return ''
    const self = samePrincipal(grantPrincipal(grant), currentPrincipal.value)
    return self
      ? 'You will lose this role. If it is your only way to manage access, you cannot undo this yourself.'
      : `${grant.subject} will lose the ${grant.relation} role. Access through groups or the access policy may still apply.`
  })

  watch([open, () => props.target?.endpoint], ([isOpen]) => {
    if (!isOpen) return
    tab.value = 'people'
    grantToRemove.value = undefined
    state.reset()
    void state.load()
  })

  async function run (change: () => Promise<boolean>, successText: string): Promise<void> {
    saving.value = true
    const saved = await change()
    saving.value = false
    if (saved) notify(successText, 'success')
  }

  function addGrant (principal: AccessPrincipal, relation: GrantRelation): Promise<void> {
    return run(() => state.addGrant(principal, relation), `Shared with ${principal.subject}.`)
  }

  function changeRole (grant: AccessGrant, relation: GrantRelation): Promise<void> {
    return run(() => state.changeRole(grant, relation), 'Role changed.')
  }

  function updateInheritance (aasIds: string[]): Promise<void> {
    return run(() => state.replaceInheritance(aasIds), 'Shell links updated.')
  }

  function closeRemoveDialog (value: boolean): void {
    if (!value) grantToRemove.value = undefined
  }

  async function removeGrant (): Promise<void> {
    const grant = grantToRemove.value
    grantToRemove.value = undefined
    if (grant) await run(() => state.removeGrant(grant), 'Access removed.')
  }

  function notify (text: string, type: 'success' | 'error'): void {
    if (type === 'error') {
      state.error.value = text
      return
    }
    navigationStore.dispatchSnackbar({ status: true, timeout: 4000, color: 'success', btnColor: 'buttonText', text })
  }
</script>
