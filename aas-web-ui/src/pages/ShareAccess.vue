<template>
  <v-container class="py-8">
    <v-card class="mx-auto" max-width="560" title="Accept invitation">
      <v-card-text>
        <v-alert v-if="accepted" type="success" variant="tonal">
          Access granted. You can now find the shared resource in the resource browser.
        </v-alert>

        <template v-else-if="pendingInvitation">
          <p class="mb-4">Accept this invitation to add the shared access to your signed-in account. The link can be used only once.</p>

          <v-alert v-if="!matchingService" class="mb-4" type="info" variant="tonal">
            Select the infrastructure this invitation belongs to using the infrastructure menu. Sharing must be enabled on that service.
          </v-alert>

          <p v-else class="text-body-2 mb-4">Infrastructure: {{ infrastructure.getSelectedInfrastructure?.name }}</p>

          <v-alert v-if="!authenticated" class="mb-4" type="info" variant="tonal">
            Sign in using the user menu, then return here to accept the invitation.
          </v-alert>
        </template>

        <v-alert v-else type="info" variant="tonal">
          No invitation is available. Open the invitation link again or ask the sender for a new one.
        </v-alert>

        <v-alert
          v-if="message"
          class="mt-4"
          role="alert"
          type="error"
          variant="tonal"
        >{{ message }}</v-alert>
      </v-card-text>

      <v-card-actions>
        <v-btn v-if="!accepted && pendingInvitation" :disabled="busy" @click="cancel">Cancel</v-btn>
        <v-spacer />
        <v-btn v-if="pendingInvitation && !authenticated && infrastructure.getSelectedInfrastructure?.auth?.oauth2" color="primary" @click="login">Sign in</v-btn>
        <v-btn v-if="accepted" color="primary" :to="{ name: 'AASViewer' }">Open resource browser</v-btn>

        <v-btn
          v-else-if="pendingInvitation"
          color="primary"
          :disabled="!matchingService || !authenticated"
          :loading="busy"
          variant="flat"
          @click="accept"
        >
          Accept invitation
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAuth } from '@/composables/Auth/useAuth'
  import { useShareInvitationClient } from '@/composables/Client/ShareInvitationClient'
  import { clearInvitation, pendingInvitation } from '@/composables/ShareInvitation'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'

  const infrastructure = useInfrastructureStore()
  const client = useShareInvitationClient()
  const { login } = useAuth(useRouter())
  const busy = ref(false)
  const accepted = ref(false)
  const message = ref('')
  const authenticated = computed(() => infrastructure.getHasAuthenticationCredentials)
  const matchingService = computed(() => Boolean(pendingInvitation.value && client.canRedeem(pendingInvitation.value)))

  onBeforeUnmount(clearInvitation)

  function cancel (): void {
    clearInvitation()
    message.value = ''
  }

  async function accept (): Promise<void> {
    const invitation = pendingInvitation.value
    if (!invitation || busy.value || !matchingService.value || !authenticated.value) return
    const infrastructureId = infrastructure.getSelectedInfrastructure?.id
    busy.value = true
    message.value = ''
    const result = await client.redeem(invitation)
    busy.value = false
    if (pendingInvitation.value !== invitation) return
    if (result.ok) {
      clearInvitation()
      if (infrastructure.getSelectedInfrastructure?.id === infrastructureId) accepted.value = true
    } else {
      message.value = result.message ?? 'The invitation could not be accepted.'
      if ([400, 403, 404, 409].includes(result.status ?? 0)) clearInvitation()
    }
  }
</script>
