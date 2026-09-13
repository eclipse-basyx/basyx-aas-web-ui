<template>
  <div class="mb-3">
    <v-btn-toggle
      v-model="recipientType"
      aria-label="Share with a person or group"
      class="mb-4"
      color="primary"
      :disabled="disabled"
      mandatory
      variant="outlined"
    >
      <v-btn prepend-icon="mdi-account-outline" value="user">Person</v-btn>
      <v-btn prepend-icon="mdi-account-group-outline" value="group">Group</v-btn>
    </v-btn-toggle>

    <v-text-field
      v-model="subject"
      density="compact"
      :disabled="disabled"
      :hint="recipientType === 'group' ? 'Enter the exact group name or path provided by your administrator, for example /engineering. Group search is not available.' : 'Ask the person for their account ID. Name and email search is not available.'"
      :label="recipientType === 'group' ? 'Group name or path' : 'Account ID'"
      persistent-hint
      :placeholder="recipientType === 'group' ? 'For example /engineering' : 'Paste the person’s account ID'"
      @keydown.enter.prevent="add"
    />

    <p v-if="recipientType === 'group'" class="text-body-2 text-medium-emphasis mb-3">Access applies to members of this group. Group membership is managed outside this app.</p>

    <v-expansion-panels v-model="providerPanel" class="mb-3" variant="accordion">
      <v-expansion-panel title="Sign-in provider">
        <v-expansion-panel-text>
          <v-text-field
            v-model="issuer"
            density="compact"
            :disabled="disabled"
            hint="Your sign-in provider is filled in when available. Change it only for an account from another provider."
            label="Provider URL"
            persistent-hint
            placeholder="https://identity-provider.example"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div class="d-flex ga-2 flex-wrap">
      <v-btn
        v-if="currentPrincipal && recipientType === 'user'"
        :disabled="disabled"
        size="small"
        variant="text"
        @click="useMe"
      >Use my account</v-btn>

      <v-btn
        color="primary"
        :disabled="disabled || !issuer.trim() || !subject.trim()"
        prepend-icon="mdi-check"
        variant="tonal"
        @click="add"
      >{{ actionLabel ?? (recipientType === 'group' ? 'Add group' : 'Add person') }}</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { AccessPrincipal } from '@/types/ResourceAccess'

  const props = defineProps<{
    currentPrincipal?: AccessPrincipal
    actionLabel?: string
    disabled?: boolean
  }>()

  const emit = defineEmits<{
    add: [principal: AccessPrincipal]
  }>()

  const recipientType = ref<'user' | 'group'>('user')
  const issuer = ref('')
  const subject = ref('')
  const providerPanel = ref<number | undefined>(props.currentPrincipal?.issuer ? undefined : 0)

  watch(() => props.currentPrincipal?.issuer, value => {
    if (!issuer.value && value) issuer.value = value
  }, { immediate: true })

  watch(recipientType, () => {
    subject.value = ''
  })

  function useMe (): void {
    if (!props.currentPrincipal) return
    issuer.value = props.currentPrincipal.issuer
    subject.value = props.currentPrincipal.subject
  }

  function add (): void {
    const principal: AccessPrincipal = { ...(recipientType.value === 'group' ? { type: 'group' as const } : {}), issuer: issuer.value.trim(), subject: subject.value.trim() }
    if (props.disabled || !principal.issuer || !principal.subject) return
    emit('add', principal)
    issuer.value = props.currentPrincipal?.issuer ?? ''
    subject.value = ''
  }
</script>
