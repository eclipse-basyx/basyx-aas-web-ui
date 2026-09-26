<template>
  <v-alert
    class="mb-3"
    density="compact"
    text="An invitation link grants a role to whoever signs in and accepts it. Share it only with the intended people."
    type="info"
    variant="tonal"
  />

  <v-list-subheader class="mb-1">New invitation link</v-list-subheader>

  <v-sheet border class="pa-3" rounded="lg">
    <div class="d-flex flex-wrap ga-2">
      <v-select
        v-model="relation"
        density="compact"
        :disabled="busy"
        :items="roles"
        label="Role"
        min-width="150"
        variant="outlined"
        width="170"
      />

      <v-select
        v-model="lifetime"
        density="compact"
        :disabled="busy"
        :items="lifetimes"
        label="Valid for"
        min-width="140"
        variant="outlined"
        width="160"
      />

      <v-number-input
        v-model="maxUses"
        control-variant="split"
        density="compact"
        :disabled="busy"
        label="Uses"
        :max="100"
        :min="1"
        variant="outlined"
        width="140"
      />
    </div>

    <v-switch
      v-model="restricted"
      class="mt-n2"
      color="primary"
      density="compact"
      :disabled="busy"
      hide-details
      label="Only for one person"
    />

    <v-text-field
      v-if="restricted"
      v-model="expectedSubject"
      class="mt-2"
      density="compact"
      :disabled="busy"
      hint="User ID (subject) of the person who may accept the invitation."
      label="User ID"
      persistent-hint
      variant="outlined"
    />

    <div class="d-flex mt-3">
      <v-spacer />

      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="restricted && !expectedSubject.trim()"
        :loading="busy"
        prepend-icon="mdi-link-plus"
        rounded="lg"
        text="Create link"
        variant="flat"
        @click="create"
      />
    </div>
  </v-sheet>

  <v-alert
    v-if="createdLink"
    class="mt-3"
    density="compact"
    type="success"
    variant="tonal"
  >
    <div class="mb-2">Copy the link now. For security reasons it cannot be shown again.</div>

    <v-text-field
      bg-color="surface"
      density="compact"
      hide-details
      :model-value="createdLink"
      readonly
      variant="outlined"
      @focus="($event.target as HTMLInputElement).select()"
    >
      <template #append-inner>
        <v-btn
          aria-label="Copy invitation link"
          :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
          size="small"
          variant="text"
          @click="copy"
        />
      </template>
    </v-text-field>
  </v-alert>

  <v-list-subheader class="mt-2 mb-1">Open invitations</v-list-subheader>

  <v-alert
    v-if="invitations.length === 0"
    density="compact"
    text="There are no open invitations."
    type="info"
    variant="tonal"
  />

  <v-list v-else border class="rounded-lg pa-0" lines="two">
    <template v-for="(invitation, index) in invitations" :key="invitation.id">
      <v-divider v-if="index > 0" />

      <v-list-item :prepend-icon="roleOption(invitation.relation).icon">
        <v-list-item-title class="d-flex align-center flex-wrap ga-2">
          {{ roleOption(invitation.relation).title }}
          <v-chip v-if="invitation.restricted" label size="x-small">One person</v-chip>
        </v-list-item-title>

        <v-list-item-subtitle>
          Expires {{ formatDate(invitation.expiresAt) }} · used {{ invitation.usedCount ?? 0 }} of {{ invitation.maxUses }}
        </v-list-item-subtitle>

        <template #append>
          <v-tooltip location="top" text="Revoke invitation">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                aria-label="Revoke invitation"
                :disabled="busy"
                icon="mdi-link-off"
                size="small"
                variant="text"
                @click="revoke(invitation)"
              />
            </template>
          </v-tooltip>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
  import type { AccessPrincipal, Invitation, InvitationRelation, ResourceAccessTarget } from '@/types/ResourceAccess'
  import type { AccessRoleOption } from '@/utils/AccessRoles'
  import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { roleOption } from '@/utils/AccessRoles'
  import { buildInvitationUrl } from '@/utils/ShareLinks'

  const props = defineProps<{
    target: ResourceAccessTarget
    roles: AccessRoleOption[]
    currentPrincipal?: AccessPrincipal
  }>()

  const emit = defineEmits<{
    message: [text: string, type: 'success' | 'error']
  }>()

  const client = useResourceAccessClient()
  const infrastructureStore = useInfrastructureStore()

  const lifetimes = [
    { title: '1 hour', value: 3600 },
    { title: '1 day', value: 86_400 },
    { title: '7 days', value: 604_800 },
    { title: '30 days', value: 2_592_000 },
  ]

  const invitations = ref<Invitation[]>([])
  const relation = ref<InvitationRelation>('viewer')
  const lifetime = ref(86_400)
  const maxUses = ref(1)
  const restricted = ref(false)
  const expectedSubject = ref('')
  const busy = ref(false)
  const createdLink = ref('')
  const copied = ref(false)

  watch(() => props.target.endpoint, () => {
    createdLink.value = ''
    void load()
  }, { immediate: true })

  async function load (): Promise<void> {
    const result = await client.listInvitations(props.target)
    invitations.value = result.ok ? result.data ?? [] : []
  }

  async function create (): Promise<void> {
    busy.value = true
    copied.value = false
    const result = await client.createInvitation(props.target, {
      relation: relation.value,
      expiresAt: new Date(Date.now() + lifetime.value * 1000).toISOString(),
      maxUses: maxUses.value,
      ...(restricted.value && props.currentPrincipal
        ? { expectedPrincipal: { issuer: props.currentPrincipal.issuer, subject: expectedSubject.value.trim() } }
        : {}),
    })
    busy.value = false
    if (!result.ok || !result.data?.token) {
      emit('message', result.message ?? 'The invitation could not be created.', 'error')
      return
    }
    const configured = infrastructureStore.getSelectedInfrastructure?.components[props.target.componentKey]?.url ?? ''
    createdLink.value = buildInvitationUrl(result.data.token, configured, props.target.componentKey)
    expectedSubject.value = ''
    await load()
  }

  async function revoke (invitation: Invitation): Promise<void> {
    busy.value = true
    const result = await client.revokeInvitation(props.target, invitation.id)
    busy.value = false
    emit('message', result.ok ? 'Invitation revoked.' : result.message ?? 'The invitation could not be revoked.', result.ok ? 'success' : 'error')
    await load()
  }

  async function copy (): Promise<void> {
    try {
      await navigator.clipboard.writeText(createdLink.value)
      copied.value = true
    } catch {
      emit('message', 'Copying failed. Select the link and copy it manually.', 'error')
    }
  }

  function formatDate (value: string): string {
    return new Date(value).toLocaleString()
  }
</script>
