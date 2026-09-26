<template>
  <v-container class="py-8">
    <v-sheet border class="mx-auto" max-width="600" rounded="lg">
      <v-card-title class="bg-cardHeader">Accept invitation</v-card-title>
      <v-divider />

      <v-card-text>
        <v-alert v-if="accepted" density="compact" type="success" variant="tonal">
          You are now <strong>{{ roleOption(accepted.relation).title.toLowerCase() }}</strong> of
          {{ objectLabels[accepted.object.type] ?? accepted.object.type }} <strong class="text-break">{{ accepted.object.id }}</strong>

          <span
            v-if="accepted.object.idShortPath"
          > ({{ accepted.object.idShortPath }})</span>.
        </v-alert>

        <template v-else-if="pendingInvitation">
          <p class="text-body-medium mb-4">
            Accept this invitation to get access with your signed-in account. The role is granted to you personally.
          </p>

          <v-alert
            v-if="!matchingService"
            class="mb-3"
            density="compact"
            text="Select the infrastructure this invitation belongs to in the infrastructure menu. Sharing must be enabled there."
            type="info"
            variant="tonal"
          />

          <v-list-item
            v-else
            class="px-0"
            prepend-icon="mdi-server-network"
            subtitle="Infrastructure"
            :title="infrastructure.getSelectedInfrastructure?.name"
          />

          <v-alert
            v-if="!authenticated"
            density="compact"
            text="Sign in first, then accept the invitation."
            type="info"
            variant="tonal"
          />
        </template>

        <v-alert
          v-else
          density="compact"
          text="No invitation is pending. Open the invitation link again or ask the sender for a new one."
          type="info"
          variant="tonal"
        />

        <v-alert
          v-if="message"
          class="mt-3"
          density="compact"
          role="alert"
          :text="message"
          type="error"
          variant="tonal"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          v-if="!accepted && pendingInvitation"
          :disabled="busy"
          rounded="lg"
          text="Cancel"
          @click="cancel"
        />

        <v-btn
          v-if="pendingInvitation && !authenticated && infrastructure.getSelectedInfrastructure?.auth?.oauth2"
          class="text-buttonText"
          color="primary"
          rounded="lg"
          text="Sign in"
          variant="flat"
          @click="login"
        />

        <v-btn
          v-if="accepted"
          class="text-buttonText"
          color="primary"
          rounded="lg"
          :text="viewerRoute.query ? 'Open' : 'Open viewer'"
          :to="viewerRoute"
          variant="flat"
        />

        <v-btn
          v-else-if="pendingInvitation && authenticated"
          class="text-buttonText"
          color="primary"
          :disabled="!matchingService"
          :loading="busy"
          rounded="lg"
          text="Accept invitation"
          variant="flat"
          @click="accept"
        />
      </v-card-actions>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
  import type { AcceptedInvitation } from '@/types/ResourceAccess'
  import type { LocationQueryRaw } from 'vue-router'
  import { useRouter } from 'vue-router'
  import { useAuth } from '@/composables/Auth/useAuth'
  import { useShareInvitationClient } from '@/composables/Client/ShareInvitationClient'
  import { clearInvitation, pendingInvitation } from '@/composables/ShareInvitation'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { roleOption } from '@/utils/AccessRoles'
  import { targetFromAccessObject } from '@/utils/ResourceAccessTargets'

  const objectLabels: Record<string, string> = {
    aas: 'the shell', submodel: 'the Submodel', element: 'an element of the Submodel', concept_description: 'the Concept Description',
    aas_descriptor: 'the AAS descriptor', submodel_descriptor: 'the Submodel descriptor', asset_links: 'the discovery entry',
  }

  const infrastructure = useInfrastructureStore()
  const envStore = useEnvStore()
  const client = useShareInvitationClient()
  const { login } = useAuth(useRouter())

  const busy = ref(false)
  const accepted = ref<AcceptedInvitation>()
  const message = ref('')
  const authenticated = computed(() => infrastructure.getHasAuthenticationCredentials)
  const matchingService = computed(() => Boolean(pendingInvitation.value && client.canRedeem(pendingInvitation.value)))
  const viewerRoute = computed((): { name: string, query?: LocationQueryRaw } => {
    const target = accepted.value
      ? targetFromAccessObject(accepted.value.object, component => infrastructure.getSelectedInfrastructure?.components[component]?.url)
      : undefined
    if (target?.kind === 'aas') return { name: 'AASViewer', query: { aas: target.endpoint } }
    if (target && envStore.getSmViewerEditor) return { name: 'SMViewer', query: { path: target.endpoint } }
    return { name: 'AASViewer' }
  })

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
      if (infrastructure.getSelectedInfrastructure?.id === infrastructureId) accepted.value = result.data
    } else {
      message.value = result.message ?? 'The invitation could not be accepted.'
      if ([400, 403, 404, 409].includes(result.status ?? 0)) clearInvitation()
    }
  }
</script>
