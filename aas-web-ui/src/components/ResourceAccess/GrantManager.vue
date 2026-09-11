<template>
  <v-card border flat>
    <v-card-title>{{ formOpen ? (editingId ? 'Edit access' : 'Share access') : 'People and groups' }}</v-card-title>

    <v-card-text>
      <p v-if="!hasLocalPolicy && !formOpen" class="text-body-2 text-medium-emphasis mb-4">
        Access rules are inherited from the parent resource. You can share with someone below.
      </p>

      <SharingPeopleList
        v-if="!formOpen"
        :current-principal="currentPrincipal"
        :grants="grants"
        :loading="loading"
        :managers="managers"
        :owners="owners"
        @delete="$emit('delete', $event)"
        @edit="edit"
      />

      <v-btn
        v-if="!formOpen"
        color="primary"
        :disabled="loading"
        prepend-icon="mdi-account-plus"
        variant="flat"
        @click="formOpen = true"
      >
        Share access
      </v-btn>

      <div v-if="formOpen">
        <PrincipalInput
          v-if="!principal"
          action-label="Continue"
          :current-principal="currentPrincipal"
          :disabled="loading"
          @add="setPrincipal"
        />

        <v-sheet v-else border class="pa-3 mb-4 rounded d-flex align-center ga-3 flex-wrap">
          <div class="flex-grow-1 text-break">
            <v-icon v-if="principal.type === 'group'" class="mr-2" icon="mdi-account-group-outline" /><strong>{{ principal.subject }}</strong>
            <v-chip v-if="principal.type === 'group'" class="ml-2" size="small">Group</v-chip>
            <details class="text-body-2 text-medium-emphasis mt-1"><summary>{{ principal.type === 'group' ? 'Group details' : 'Account details' }}</summary>{{ principal.issuer }}</details>
          </div>

          <v-btn :disabled="loading" size="small" variant="text" @click="principal = undefined">Change recipient</v-btn>
        </v-sheet>

        <template v-if="principal">
          <SharingRolePicker v-model="rights" :disabled="loading" />

          <p class="text-body-2 text-medium-emphasis" role="status">
            {{ rights.length > 0 ? `${principal.subject}: ${sharingRoleLabel(rights)}.` : 'Choose at least one permission to continue.' }}
          </p>
        </template>
      </div>
    </v-card-text>

    <v-card-actions v-if="formOpen">
      <v-btn :disabled="loading" variant="text" @click="reset">Cancel</v-btn>
      <v-spacer />

      <v-btn
        color="primary"
        :disabled="!principal || rights.length === 0"
        :loading="loading"
        variant="flat"
        @click="save"
      >{{ editingId ? 'Save changes' : 'Share' }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  import type { AccessPrincipal, AccessRight, GrantInput, ManagedGrant } from '@/types/ResourceAccess'
  import { sharingRoleLabel } from '@/utils/SharingRoles'

  const props = defineProps<{
    grants: ManagedGrant[]
    owners?: AccessPrincipal[]
    managers?: AccessPrincipal[]
    hasLocalPolicy: boolean
    currentPrincipal?: AccessPrincipal
    loading?: boolean
    savedVersion?: number
  }>()

  const emit = defineEmits<{
    'create': [grant: GrantInput]
    'update': [id: string, grant: GrantInput]
    'delete': [id: string]
    'draft-change': [active: boolean]
  }>()

  const formOpen = ref(false)
  const principal = ref<AccessPrincipal>()
  const rights = ref<AccessRight[]>(['READ'])
  const editingId = ref('')

  watch(() => props.savedVersion, reset)
  watch(formOpen, value => emit('draft-change', value))

  function setPrincipal (value: AccessPrincipal): void {
    principal.value = value
  }

  function edit (grant: ManagedGrant): void {
    formOpen.value = true
    editingId.value = grant.id
    principal.value = { ...grant.principal }
    rights.value = [...grant.rights]
  }

  function save (): void {
    if (props.loading || !principal.value || rights.value.length === 0) return
    const value = { principal: principal.value, rights: [...new Set(rights.value)] }
    if (editingId.value) emit('update', editingId.value, value)
    else emit('create', value)
  }

  function reset (): void {
    formOpen.value = false
    editingId.value = ''
    principal.value = undefined
    rights.value = ['READ']
  }
</script>
