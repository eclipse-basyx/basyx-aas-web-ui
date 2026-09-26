<template>
  <v-sheet border class="pa-3" rounded="lg">
    <v-btn-toggle
      v-model="principalType"
      aria-label="Share with a person or a group"
      class="mb-3"
      color="primary"
      density="compact"
      :disabled="disabled"
      divided
      mandatory
      rounded="lg"
      variant="outlined"
    >
      <v-btn value="user"><v-icon class="me-2" size="small">mdi-account-outline</v-icon>Person</v-btn>
      <v-btn value="group"><v-icon class="me-2" size="small">mdi-account-group-outline</v-icon>Group</v-btn>
    </v-btn-toggle>

    <div class="d-flex flex-wrap ga-2 align-start">
      <v-text-field
        v-model="subject"
        class="flex-grow-1"
        density="compact"
        :disabled="disabled"
        :hint="principalType === 'group' ? 'Group name as issued in the token, for example engineering.' : 'User ID (subject) of the person. Everyone finds their ID in the user menu.'"
        :label="principalType === 'group' ? 'Group name' : 'User ID'"
        min-width="220"
        persistent-hint
        variant="outlined"
        @keydown.enter.prevent="submit"
      />

      <v-select
        v-model="relation"
        density="compact"
        :disabled="disabled"
        :items="roles"
        label="Role"
        min-width="150"
        variant="outlined"
        width="170"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :prepend-icon="item.icon" :subtitle="item.description" />
        </template>
      </v-select>

      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="disabled || !subject.trim() || !issuer.trim()"
        height="40"
        :loading="loading"
        rounded="lg"
        :text="submitLabel ?? 'Share'"
        variant="flat"
        @click="submit"
      />
    </div>

    <div class="d-flex flex-wrap align-center ga-2 mt-1">
      <v-btn
        v-if="currentPrincipal && principalType === 'user'"
        :disabled="disabled"
        prepend-icon="mdi-account-arrow-left-outline"
        size="small"
        text="Use my account"
        variant="text"
        @click="useMyAccount"
      />

      <v-btn
        :append-icon="showIssuer ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="small"
        :text="`Identity provider: ${issuerLabel}`"
        variant="text"
        @click="showIssuer = !showIssuer"
      />
    </div>

    <v-expand-transition>
      <v-text-field
        v-if="showIssuer"
        v-model="issuer"
        class="mt-2"
        density="compact"
        :disabled="disabled"
        hint="Issuer (iss) of the tokens of the person or group. It defaults to your own identity provider."
        label="Identity provider (issuer)"
        persistent-hint
        variant="outlined"
      />
    </v-expand-transition>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { AccessPrincipal, GrantRelation, PrincipalType } from '@/types/ResourceAccess'
  import type { AccessRoleOption } from '@/utils/AccessRoles'

  const props = defineProps<{
    roles: AccessRoleOption[]
    currentPrincipal?: AccessPrincipal
    disabled?: boolean
    loading?: boolean
    submitLabel?: string
  }>()

  const emit = defineEmits<{
    add: [principal: AccessPrincipal, relation: GrantRelation]
  }>()

  const principalType = ref<PrincipalType>('user')
  const subject = ref('')
  const issuer = ref(props.currentPrincipal?.issuer ?? '')
  const relation = ref<GrantRelation>(props.roles[0]?.value ?? 'viewer')
  const showIssuer = ref(!props.currentPrincipal)

  const issuerLabel = computed(() => issuer.value.trim() || 'not set')

  watch(() => props.currentPrincipal?.issuer, value => {
    if (!issuer.value && value) issuer.value = value
  })

  watch(() => props.roles, roles => {
    if (!roles.some(role => role.value === relation.value)) relation.value = roles[0]?.value ?? 'viewer'
  })

  function useMyAccount (): void {
    if (!props.currentPrincipal) return
    issuer.value = props.currentPrincipal.issuer
    subject.value = props.currentPrincipal.subject
  }

  function submit (): void {
    const principal: AccessPrincipal = { type: principalType.value, issuer: issuer.value.trim(), subject: subject.value.trim() }
    if (props.disabled || !principal.issuer || !principal.subject) return
    emit('add', principal, relation.value)
    subject.value = ''
  }
</script>
