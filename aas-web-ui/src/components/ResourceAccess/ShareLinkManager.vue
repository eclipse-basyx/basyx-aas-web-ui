<template>
  <v-card border flat>
    <v-card-title>Invite with a link</v-card-title>

    <v-card-text>
      <p class="text-body-2 mb-4">Send a link to one person. The first signed-in person who accepts it receives access. Only send it to the intended recipient.</p>

      <v-alert v-if="!hasLocalPolicy" class="mb-4" type="info" variant="tonal">
        To invite someone, this resource must stop inheriting access rules. You will review this change before continuing.
      </v-alert>

      <template v-if="created">
        <v-text-field
          density="compact"
          label="Invitation link"
          :model-value="created.url"
          readonly
          @click:control="($event.target as HTMLInputElement).select?.()"
        />

        <p class="text-body-2 mb-3">Expires {{ new Date(created.expiresAt).toLocaleString() }}. Usable once.</p>

        <div class="d-flex flex-wrap ga-2">
          <v-btn color="primary" prepend-icon="mdi-content-copy" @click="copy">Copy link</v-btn>

          <v-btn
            color="error"
            :disabled="disabled"
            :loading="busy"
            variant="text"
            @click="revoke"
          >Revoke link</v-btn>
        </div>
      </template>

      <template v-else>
        <SharingRolePicker v-model="rights" :disabled="disabled || busy" />

        <v-select
          v-model="expiresInSeconds"
          class="mt-4"
          density="compact"
          :disabled="disabled || busy"
          :items="expiryOptions"
          label="Link expires after"
        />

        <v-btn
          color="primary"
          :disabled="disabled || rights.length === 0"
          :loading="busy"
          prepend-icon="mdi-link-plus"
          @click="hasLocalPolicy ? create() : $emit('request-localize')"
        >{{ hasLocalPolicy ? 'Create invitation link' : 'Enable invitation links' }}</v-btn>
      </template>

      <p class="text-caption text-medium-emphasis mt-4">Changes to access rules invalidate unused links. Copy the link before closing this dialog; it cannot be retrieved later.</p>

      <v-alert
        v-if="message"
        class="mt-3"
        density="compact"
        role="status"
        :type="messageType"
        variant="tonal"
      >{{ message }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import type { AccessRight, ResourceAccessTarget } from '@/types/ResourceAccess'
  import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { buildInvitationUrl } from '@/utils/ShareLinks'

  const props = defineProps<{
    target: ResourceAccessTarget
    etag: string
    hasLocalPolicy: boolean
    disabled?: boolean
  }>()
  const emit = defineEmits<{
    'request-localize': []
    'refresh': []
    'busy': [value: boolean]
  }>()
  const client = useResourceAccessClient()
  const infrastructure = useInfrastructureStore()
  const rights = ref<AccessRight[]>(['READ'])
  const expiresInSeconds = ref(3600)
  const busy = ref(false)
  const created = ref<{ id: string, url: string, expiresAt: string }>()
  const message = ref('')
  const messageType = ref<'error' | 'success' | 'info'>('info')
  let unmounted = false
  const expiryOptions = [
    { title: '1 hour', value: 3600 },
    { title: '1 day', value: 86_400 },
    { title: '7 days', value: 604_800 },
  ]

  watch(() => [props.target.endpoint, props.etag, infrastructure.getSelectedInfrastructure?.id], () => {
    created.value = undefined
    message.value = ''
  })
  onBeforeUnmount(() => {
    unmounted = true
    created.value = undefined
  })

  function setBusy (value: boolean): void {
    busy.value = value
    emit('busy', value)
  }

  async function create (): Promise<void> {
    if (props.disabled || busy.value || !props.hasLocalPolicy || rights.value.length === 0) return
    const endpoint = props.target.endpoint
    const infrastructureId = infrastructure.getSelectedInfrastructure?.id
    const configured = infrastructure.getSelectedInfrastructure?.components[props.target.componentKey]?.url
    if (!configured) return
    setBusy(true)
    message.value = ''
    try {
      const result = await client.createShareLink(props.target, { rights: [...rights.value], expiresInSeconds: expiresInSeconds.value }, props.etag)
      if (unmounted || endpoint !== props.target.endpoint || infrastructureId !== infrastructure.getSelectedInfrastructure?.id) return
      if (result.ok && result.data) {
        created.value = {
          id: result.data.id,
          url: buildInvitationUrl(result.data.shareLink, configured, props.target.componentKey),
          expiresAt: result.data.expiresAt,
        }
      } else {
        messageType.value = 'error'
        message.value = result.message ?? 'The invitation could not be created.'
        if (result.status === 412) emit('refresh')
      }
    } catch {
      messageType.value = 'error'
      message.value = 'The invitation could not be prepared. Please try again.'
    } finally {
      setBusy(false)
    }
  }

  async function copy (): Promise<void> {
    if (!created.value) return
    try {
      await navigator.clipboard.writeText(created.value.url)
      messageType.value = 'success'
      message.value = 'Invitation link copied.'
    } catch {
      messageType.value = 'info'
      message.value = 'Select the link above and copy it manually.'
    }
  }

  async function revoke (): Promise<void> {
    if (!created.value || busy.value || props.disabled) return
    const invitation = created.value
    setBusy(true)
    try {
      const result = await client.revokeShareLink(props.target, created.value.id, props.etag)
      if (unmounted || created.value !== invitation) return
      messageType.value = result.ok ? 'success' : 'error'
      message.value = result.ok ? 'Invitation link revoked.' : result.message ?? 'The invitation could not be revoked.'
      if (result.ok) created.value = undefined
      if (result.status === 412) emit('refresh')
    } catch {
      messageType.value = 'error'
      message.value = 'The invitation could not be revoked. Please try again.'
    } finally {
      setBusy(false)
    }
  }
</script>
