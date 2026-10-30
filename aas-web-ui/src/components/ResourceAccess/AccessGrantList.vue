<template>
  <v-alert
    v-if="grants.length === 0"
    density="compact"
    :text="emptyText"
    type="info"
    variant="tonal"
  />

  <v-list v-else border class="rounded-lg pa-0" lines="two">
    <template v-for="(grant, index) in sortedGrants" :key="grantKey(grant)">
      <v-divider v-if="index > 0" />

      <v-list-item>
        <template #prepend>
          <v-avatar color="surface-light" rounded>
            <v-icon color="medium-emphasis" :icon="grant.subjectType === 'group' ? 'mdi-account-group-outline' : 'mdi-account-outline'" />
          </v-avatar>
        </template>

        <v-list-item-title class="d-flex align-center flex-wrap ga-2 text-wrap">
          <span class="text-break">{{ grant.subject }}</span>
          <v-chip v-if="grant.subjectType === 'group'" label size="x-small">Group</v-chip>
          <v-chip v-if="isMe(grant)" color="primary" size="x-small">You</v-chip>
        </v-list-item-title>

        <v-list-item-subtitle class="text-break">{{ grant.issuer }}</v-list-item-subtitle>

        <template #append>
          <div class="d-flex align-center ga-1 ml-2">
            <v-select
              :aria-label="`Role of ${grant.subject}`"
              density="compact"
              :disabled="disabled"
              hide-details
              :items="roleItems(grant)"
              :model-value="grant.relation"
              variant="outlined"
              :width="smAndDown ? 124 : 160"
              @update:model-value="relation => $emit('change', grant, relation)"
            />

            <v-tooltip location="top" text="Remove access">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  :aria-label="`Remove access of ${grant.subject}`"
                  :disabled="disabled"
                  icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  @click="$emit('remove', grant)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
  import type { AccessGrant, AccessPrincipal, GrantRelation } from '@/types/ResourceAccess'
  import type { AccessRoleOption } from '@/utils/AccessRoles'
  import { useDisplay } from 'vuetify'
  import { grantPrincipal, samePrincipal } from '@/utils/AccessPrincipal'
  import { roleOption } from '@/utils/AccessRoles'

  const relationOrder: GrantRelation[] = ['owner', 'admin', 'editor', 'executor', 'creator', 'viewer']

  const props = defineProps<{
    grants: AccessGrant[]
    roles: AccessRoleOption[]
    currentPrincipal?: AccessPrincipal
    disabled?: boolean
    emptyText?: string
  }>()

  defineEmits<{
    change: [grant: AccessGrant, relation: GrantRelation]
    remove: [grant: AccessGrant]
  }>()

  const { smAndDown } = useDisplay()

  const sortedGrants = computed(() => props.grants.toSorted((left, right) =>
    relationOrder.indexOf(left.relation) - relationOrder.indexOf(right.relation)
    || left.subject.localeCompare(right.subject)))

  function roleItems (grant: AccessGrant): AccessRoleOption[] {
    return props.roles.some(role => role.value === grant.relation) ? props.roles : [...props.roles, roleOption(grant.relation)]
  }

  function grantKey (grant: AccessGrant): string {
    return JSON.stringify([grant.relation, grant.subjectType, grant.issuer, grant.subject])
  }

  function isMe (grant: AccessGrant): boolean {
    return samePrincipal(grantPrincipal(grant), props.currentPrincipal)
  }
</script>
