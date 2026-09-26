<template>
  <v-sheet border rounded="lg">
    <v-card-title class="bg-cardHeader">Audit trail</v-card-title>
    <v-divider />
    <v-progress-linear v-if="loading" color="primary" indeterminate />

    <v-card-text>
      <p class="text-body-medium text-medium-emphasis mb-4">
        Every access change is recorded in a tamper-evident hash chain. Verification recomputes the chain and, when an
        evidence store is configured, checks each archived event.
      </p>

      <v-alert
        v-if="loaded && !available"
        density="compact"
        text="Only ReBAC administrators can view the audit trail."
        type="info"
        variant="tonal"
      />

      <template v-else-if="available">
        <div class="d-flex flex-wrap align-start ga-2 mb-3">
          <v-text-field
            v-model="expectedHead"
            class="flex-grow-1"
            density="compact"
            hint="Optional. A head hash retained outside the database reveals removed events."
            label="Expected head hash"
            min-width="260"
            persistent-hint
            variant="outlined"
          />

          <v-btn
            class="text-buttonText"
            color="primary"
            height="40"
            :loading="verifying"
            prepend-icon="mdi-shield-check-outline"
            rounded="lg"
            text="Verify"
            variant="flat"
            @click="verify"
          />
        </div>

        <v-alert
          v-if="verification"
          class="mb-3"
          density="compact"
          :title="verification.valid ? 'The audit trail is intact' : 'The audit trail is not intact'"
          :type="verification.valid ? 'success' : 'error'"
          variant="tonal"
        >
          {{ verification.checked }} events checked, {{ verification.evidenceVerified }} archived events verified<span
            v-if="verification.evidenceMissing"
          >, {{ verification.evidenceMissing }} without archive</span>
          .
          <span v-if="verification.reason">Event {{ verification.firstInvalidId }}: {{ verification.reason }}.</span>
          <div v-if="verification.headHash" class="text-break mt-1">Head hash: <code>{{ verification.headHash }}</code></div>
        </v-alert>

        <v-table class="border rounded" density="compact">
          <thead>
            <tr>
              <th>Time</th>
              <th>Change</th>
              <th>Object</th>
              <th>Actor</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="event in events" :key="event.id">
              <td class="text-no-wrap">{{ new Date(event.occurredAt).toLocaleString() }}</td>

              <td>
                <v-chip label size="x-small" :text="eventLabels[event.type] ?? event.type" />
                <div class="text-body-small text-medium-emphasis text-break">{{ summarize(event) }}</div>
              </td>

              <td class="text-break text-body-small">{{ event.object }}</td>
              <td class="text-break text-body-small">{{ shortSubject(event.actor) }}</td>
            </tr>
          </tbody>
        </v-table>

        <v-btn
          v-if="hasMore"
          block
          class="mt-3"
          :loading="loading"
          rounded="lg"
          text="Load more"
          variant="tonal"
          @click="loadMore"
        />
      </template>
    </v-card-text>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { BaSyxComponentKey } from '@/types/BaSyx'
  import type { AuditEvent, AuditVerification } from '@/types/ResourceAccess'
  import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
  import { base64Decode } from '@/utils/EncodeDecodeUtils'

  const props = defineProps<{
    component: BaSyxComponentKey
  }>()

  const pageSize = 50

  const eventLabels: Record<string, string> = {
    grants_changed: 'Grants changed',
    invitation_created: 'Invitation created',
    invitation_revoked: 'Invitation revoked',
    invitation_redeemed: 'Invitation accepted',
    inheritance_changed: 'Shell links changed',
    reconciled: 'Reconciled',
  }

  const client = useResourceAccessClient()

  const events = ref<AuditEvent[]>([])
  const verification = ref<AuditVerification>()
  const expectedHead = ref('')
  const loading = ref(false)
  const loaded = ref(false)
  const available = ref(false)
  const hasMore = ref(false)
  const verifying = ref(false)

  watch(() => props.component, () => {
    events.value = []
    verification.value = undefined
    void loadMore()
  }, { immediate: true })

  async function loadMore (): Promise<void> {
    loading.value = true
    const afterId = events.value.at(-1)?.id ?? 0
    const result = await client.listAudit(props.component, afterId, pageSize)
    loading.value = false
    loaded.value = true
    available.value = result.ok
    const page = result.data ?? []
    events.value = [...events.value, ...page]
    hasMore.value = page.length === pageSize
  }

  async function verify (): Promise<void> {
    verifying.value = true
    const result = await client.verifyAudit(props.component, expectedHead.value)
    verifying.value = false
    verification.value = result.ok ? result.data : { valid: false, checked: 0, evidenceVerified: 0, evidenceMissing: 0, reason: result.message }
  }

  function summarize (event: AuditEvent): string {
    const details = event.details
    if (event.type === 'grants_changed') {
      const describe = (key: string, prefix: string) => ((details[key] as Array<{ relation: string, subject: string }>) ?? [])
        .map(grant => `${prefix}${grant.relation} ${shortSubject(grant.subject)}`)
      return [...describe('added', '+ '), ...describe('removed', '− ')].join(', ')
    }
    return typeof details.relation === 'string' ? details.relation : ''
  }

  function shortSubject (subjectKey: string): string {
    const [type, scoped] = subjectKey.split(':', 2)
    const decoded = base64Decode(scoped?.split('.', 2)[1] ?? '')
    return decoded ? `${type} ${decoded}` : subjectKey
  }
</script>
