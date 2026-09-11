<template>
  <div v-if="people.length > 0" class="mb-4">
    <v-sheet v-for="person in people" :key="person.key" border class="pa-3 mb-2 rounded">
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-icon color="medium-emphasis" :icon="person.principal.type === 'group' ? 'mdi-account-group-outline' : 'mdi-account-circle-outline'" />
        <strong class="text-break">{{ person.principal.subject }}</strong>
        <v-chip v-if="person.principal.type === 'group'" size="small" variant="tonal">Group</v-chip>
        <v-chip v-if="isMe(person.principal)" size="small" variant="tonal">You</v-chip>
        <v-chip v-for="role in person.roles" :key="role" size="small">{{ role }}</v-chip>
      </div>

      <p v-if="person.principal.type === 'group'" class="text-body-2 text-medium-emphasis mt-2">Access applies to group members.</p>

      <div v-for="grant in person.grants" :key="grant.id" class="d-flex align-center flex-wrap ga-2 mt-2">
        <span class="text-body-2 flex-grow-1">{{ sharingRoleLabel(grant.rights) }}</span>

        <v-btn
          :aria-label="`Edit access for ${accessPrincipalLabel(person.principal)}`"
          :disabled="loading"
          size="small"
          variant="text"
          @click="$emit('edit', grant)"
        >Edit</v-btn>

        <v-btn
          :aria-label="`Remove access for ${accessPrincipalLabel(person.principal)}`"
          :disabled="loading"
          size="small"
          variant="text"
          @click="$emit('delete', grant.id)"
        >Remove</v-btn>
      </div>

      <details class="text-body-2 text-medium-emphasis mt-2">
        <summary>{{ person.principal.type === 'group' ? 'Group details' : 'Account details' }}</summary>
        <p class="text-break mt-2">Sign-in provider: {{ person.principal.issuer }}</p>
        <p v-for="grant in person.grants" :key="grant.id">{{ grant.rights.map(right => sharingRightLabels[right]).join(', ') }}</p>
      </details>
    </v-sheet>
  </div>

  <p v-else class="text-body-2 text-medium-emphasis mb-4">No people or groups are listed here yet.</p>
  <p class="text-body-2 text-medium-emphasis mb-4">This list shows people and groups assigned directly here. Other access rules may also apply.</p>
</template>

<script setup lang="ts">
  import type { AccessPrincipal, ManagedGrant } from '@/types/ResourceAccess'
  import { accessPrincipalKey, accessPrincipalLabel } from '@/utils/AccessPrincipal'
  import { sharingRightLabels, sharingRoleLabel } from '@/utils/SharingRoles'

  const props = defineProps<{
    grants: ManagedGrant[]
    owners?: AccessPrincipal[]
    managers?: AccessPrincipal[]
    currentPrincipal?: AccessPrincipal
    loading?: boolean
  }>()
  defineEmits<{ edit: [grant: ManagedGrant], delete: [id: string] }>()

  const people = computed(() => {
    const result = new Map<string, { key: string, principal: AccessPrincipal, roles: string[], grants: ManagedGrant[] }>()
    function add (principal: AccessPrincipal, role?: string, grant?: ManagedGrant): void {
      const key = accessPrincipalKey(principal)
      const person = result.get(key) ?? { key, principal, roles: [], grants: [] }
      if (role && !person.roles.includes(role)) person.roles.push(role)
      if (grant) person.grants.push(grant)
      result.set(key, person)
    }
    for (const owner of props.owners ?? []) add(owner, 'Owner')
    for (const manager of props.managers ?? []) add(manager, 'Access manager')
    for (const grant of props.grants) add(grant.principal, undefined, grant)
    return [...result.values()]
  })

  function isMe (principal: AccessPrincipal): boolean {
    return principal.type !== 'group' && principal.subject === props.currentPrincipal?.subject && principal.issuer === props.currentPrincipal?.issuer
  }
</script>
