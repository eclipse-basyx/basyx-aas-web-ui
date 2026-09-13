<template>
  <v-dialog v-model="open" max-width="900" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-account-lock</v-icon>
        Share
        <v-spacer />

        <v-btn
          aria-label="Close access management"
          :disabled="loading || linkBusy"
          icon="mdi-close"
          title="Close"
          variant="text"
          @click="requestClose"
        />
      </v-card-title>

      <v-card-subtitle class="text-wrap text-break">{{ target?.label }}</v-card-subtitle>
      <v-progress-linear v-if="loading" indeterminate />

      <v-card-text>
        <v-alert v-if="!enabled" type="info" variant="tonal">Sharing is not available for this resource.</v-alert>

        <v-alert
          v-if="message"
          class="mb-4"
          closable
          :type="messageType"
          variant="tonal"
          @click:close="message = ''"
        >
          {{ message }}
        </v-alert>

        <v-btn
          v-if="!refreshed && !loading && message"
          class="mb-4"
          prepend-icon="mdi-refresh"
          variant="tonal"
          @click="load()"
        >Try again</v-btn>

        <v-skeleton-loader v-if="loading && !overview" type="article, actions" />

        <template v-else-if="overview && enabled">
          <v-tabs
            v-model="tab"
            class="mb-4"
            color="primary"
            :disabled="linkBusy"
            show-arrows
          >
            <v-tab value="grants">People and groups</v-tab>
            <v-tab value="links">Invitation link</v-tab>
            <v-tab value="settings">Administration</v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="grants">
              <GrantManager
                :current-principal="currentPrincipal"
                :grants="overview.grants"
                :has-local-policy="overview.localPolicy !== null"
                :loading="loading || !refreshed"
                :managers="overview.managers"
                :owners="overview.owners"
                :saved-version="savedGrantVersion"
                @create="createGrant"
                @delete="requestDeleteGrant"
                @draft-change="sharingDraft = $event"
                @update="updateGrant"
              />
            </v-window-item>

            <v-window-item value="links">
              <ShareLinkManager
                v-if="target"
                :key="target.endpoint"
                :disabled="loading || !refreshed || !enabled"
                :etag="etag"
                :has-local-policy="overview.localPolicy !== null"
                :target="target"
                @busy="linkBusy = $event"
                @refresh="load()"
                @request-localize="confirmLocalize = true"
              />
            </v-window-item>

            <v-window-item value="settings">
              <p class="text-body-2 text-medium-emphasis mb-4">Manage ownership, access managers and advanced access rules.</p>

              <v-expansion-panels variant="accordion">
                <v-expansion-panel title="Owners">
                  <v-expansion-panel-text>
                    <PrincipalManager
                      v-model="owners"
                      :current-principal="currentPrincipal"
                      description="Owners (people or groups) can administer access and transfer ownership. At least one owner must remain."
                      :loading="loading || !refreshed"
                      required
                      title="Owners"
                      @save="saveOwners"
                    />
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel title="Access managers">
                  <v-expansion-panel-text>
                    <PrincipalManager
                      v-model="managers"
                      :current-principal="currentPrincipal"
                      description="Managers (people or groups) can administer access without owning the resource."
                      :loading="loading || !refreshed"
                      title="Managers"
                      @save="saveManagers"
                    />
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel title="Advanced access rules">
                  <v-expansion-panel-text>
                    <PolicyManager
                      :effective-policy="overview.effectivePolicy"
                      :loading="loading || !refreshed"
                      :local-policy="overview.localPolicy"
                      :resource="overview.resource"
                      @request-delete="confirmDeletePolicy = true"
                      @request-localize="confirmLocalize = true"
                      @save="savePolicy"
                    />
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-window-item>
          </v-window>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirmLocalize" max-width="560" persistent>
    <v-card title="Do not inherit access rules?">
      <v-card-text>This resource will stop inheriting access rules. The currently inherited rules will be copied here. Future permission changes to the parent will no longer apply to this resource. You can enable “Inherit access rules” again in Administration.</v-card-text>

      <v-card-actions class="flex-wrap">
        <v-spacer />
        <v-btn variant="text" @click="cancelLocalize">Cancel</v-btn>
        <v-btn class="text-wrap h-auto py-2" color="primary" @click="localizePolicy">{{ pendingGrant ? 'Do not inherit and share' : 'Do not inherit access rules' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirmDeletePolicy" max-width="560">
    <v-card title="Inherit access rules?">
      <v-card-text>Access rules will be inherited from the parent again, including future changes. Local rules, access managers and permissions added here will be removed. Owners remain.</v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmDeletePolicy = false">Cancel</v-btn>
        <v-btn color="error" @click="deletePolicy">Inherit access rules</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirmGrantDelete" max-width="480">
    <v-card title="Remove access?">
      <v-card-text>{{ grantToDeleteLabel }} will lose the permissions granted here. Access through other rules may still apply.</v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmGrantDelete = false">Cancel</v-btn>
        <v-btn color="error" @click="deleteGrant">Remove access</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirmDiscard" max-width="480" persistent>
    <v-card title="Discard unsaved changes?">
      <v-card-text>Your unsaved changes will be lost.</v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmDiscard = false">Keep editing</v-btn>
        <v-btn color="error" @click="open = false">Discard changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type {
    AccessPrincipal,
    GrantInput,
    ResourceAccessOverview,
    ResourceAccessResult,
    ResourceAccessTarget,
    ResourceBoundPolicy,
  } from '@/types/ResourceAccess'
  import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { usesAasEnvironment } from '@/utils/InfrastructureUtils'
  import { createLocalPolicy } from '@/utils/ResourceAccessValidation'
  import { getAccessPrincipalFromToken } from '@/utils/TokenUtil'

  const props = defineProps<{
    target?: ResourceAccessTarget
  }>()

  const client = useResourceAccessClient()
  const infrastructureStore = useInfrastructureStore()
  const open = defineModel<boolean>({ required: true })
  const overview = ref<ResourceAccessOverview>()
  const etag = ref('')
  const loading = ref(false)
  const linkBusy = ref(false)
  const message = ref('')
  const messageType = ref<'error' | 'success' | 'warning'>('error')
  const tab = ref('grants')
  const owners = ref<AccessPrincipal[]>([])
  const managers = ref<AccessPrincipal[]>([])
  const confirmLocalize = ref(false)
  const confirmDeletePolicy = ref(false)
  const confirmGrantDelete = ref(false)
  const grantToDelete = ref('')
  const savedGrantVersion = ref(0)
  const pendingGrant = ref<GrantInput>()
  const refreshed = ref(false)
  const sharingDraft = ref(false)
  const confirmDiscard = ref(false)

  const enabled = computed(() => Boolean(props.target && !(props.target.kind.includes('descriptor') && usesAasEnvironment(infrastructureStore.getSelectedInfrastructure)) && infrastructureStore.supportsResourceAccess?.(props.target.componentKey, props.target.endpoint)))

  const grantToDeleteLabel = computed(() => {
    const principal = overview.value?.grants.find(grant => grant.id === grantToDelete.value)?.principal
    if (!principal) return 'This recipient'
    return principal.type === 'group' ? `Members of group ${principal.subject}` : principal.subject
  })

  const currentPrincipal = computed(() => {
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    const token = infrastructure?.token?.accessToken ?? infrastructure?.auth?.bearerToken?.token
    if (!token) return undefined
    try {
      return getAccessPrincipalFromToken(token)
    } catch {
      return undefined
    }
  })

  watch([open, () => props.target?.endpoint, enabled], ([isOpen]) => {
    if (isOpen && enabled.value) void load()
    else reset()
  })

  async function load (preserveMessage = false): Promise<void> {
    if (!props.target || loading.value || !enabled.value) return
    loading.value = true
    refreshed.value = false
    const result = await client.getOverview(props.target)
    loading.value = false
    applyOverview(result, preserveMessage)
  }

  function applyOverview (result: ResourceAccessResult<ResourceAccessOverview>, preserveMessage: boolean): void {
    if (!result.ok || !result.data) {
      showResult(result)
      return
    }
    refreshed.value = true
    overview.value = result.data
    etag.value = result.etag ?? ''
    owners.value = structuredClone(result.data.owners)
    managers.value = structuredClone(result.data.managers)
    if (!preserveMessage) message.value = ''
  }

  async function runMutation (operation: () => Promise<ResourceAccessResult>, successMessage: string): Promise<boolean> {
    if (!enabled.value || loading.value || linkBusy.value || !refreshed.value) return false
    loading.value = true
    const result = await operation()
    loading.value = false
    if (!result.ok) {
      showResult(result)
      if (result.status === 412) await load(true)
      return false
    }
    await load()
    messageType.value = refreshed.value ? 'success' : 'warning'
    message.value = refreshed.value ? successMessage : `${successMessage} The updated list could not be loaded. Reload before making more changes.`
    return true
  }

  function showResult (result: ResourceAccessResult): void {
    messageType.value = result.status === 412 ? 'warning' : 'error'
    message.value = result.message ?? 'Access request failed.'
  }

  async function createGrant (grant: GrantInput): Promise<void> {
    if (!props.target || !overview.value || loading.value || !refreshed.value) return
    if (!overview.value.localPolicy) {
      pendingGrant.value = { principal: { ...grant.principal }, rights: [...grant.rights] }
      confirmLocalize.value = true
      return
    }
    if (await runMutation(() => client.createGrant(props.target!, grant, etag.value), 'Access granted.')) savedGrantVersion.value++
  }

  async function updateGrant (id: string, grant: GrantInput): Promise<void> {
    if (!props.target) return
    if (await runMutation(() => client.updateGrant(props.target!, id, grant, etag.value), 'Access updated.')) savedGrantVersion.value++
  }

  function requestDeleteGrant (id: string): void {
    grantToDelete.value = id
    confirmGrantDelete.value = true
  }

  async function deleteGrant (): Promise<void> {
    confirmGrantDelete.value = false
    if (!props.target || !grantToDelete.value) return
    await runMutation(() => client.deleteGrant(props.target!, grantToDelete.value, etag.value), 'Access removed.')
    grantToDelete.value = ''
  }

  async function saveOwners (): Promise<void> {
    if (!props.target) return
    await runMutation(() => client.replaceOwners(props.target!, owners.value, etag.value), 'Owners updated.')
  }

  async function saveManagers (): Promise<void> {
    if (!props.target) return
    await runMutation(() => client.replaceManagers(props.target!, managers.value, etag.value), 'Managers updated.')
  }

  async function savePolicy (policy: ResourceBoundPolicy): Promise<void> {
    if (!props.target) return
    await runMutation(() => client.putPolicy(props.target!, policy, etag.value), 'Policy updated.')
  }

  async function localizePolicy (): Promise<void> {
    confirmLocalize.value = false
    if (!props.target || !overview.value) return
    const policy = createLocalPolicy(overview.value.resource, overview.value.effectivePolicy)
    const grant = pendingGrant.value
    pendingGrant.value = undefined
    const saved = await runMutation(() => client.putPolicy(props.target!, policy, etag.value), 'Access rules are no longer inherited.')
    if (saved && grant && refreshed.value && overview.value?.localPolicy) await createGrant(grant)
    else if (saved && grant) {
      messageType.value = 'warning'
      message.value = 'Access rules are no longer inherited, but sharing could not continue. Reload access and try sharing again.'
    }
  }

  function cancelLocalize (): void {
    confirmLocalize.value = false
    pendingGrant.value = undefined
  }

  async function deletePolicy (): Promise<void> {
    confirmDeletePolicy.value = false
    if (!props.target) return
    await runMutation(() => client.deletePolicy(props.target!, etag.value), 'Access rules are now inherited.')
  }

  function requestClose (): void {
    if (sharingDraft.value || (overview.value && (
      JSON.stringify(owners.value) !== JSON.stringify(overview.value.owners)
      || JSON.stringify(managers.value) !== JSON.stringify(overview.value.managers)
    ))) confirmDiscard.value = true
    else open.value = false
  }

  function reset (): void {
    sharingDraft.value = false
    confirmDiscard.value = false
    overview.value = undefined
    etag.value = ''
    pendingGrant.value = undefined
    message.value = ''
    owners.value = []
    managers.value = []
    tab.value = 'grants'
    confirmLocalize.value = false
    confirmDeletePolicy.value = false
    confirmGrantDelete.value = false
  }
</script>
