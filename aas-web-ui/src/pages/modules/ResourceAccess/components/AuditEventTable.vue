<template>
  <v-alert
    v-if="events.length === 0 && !loading"
    density="compact"
    text="No access changes match."
    type="info"
    variant="tonal"
  />

  <v-table v-else class="border rounded" density="compact">
    <thead>
      <tr>
        <th>Time</th>
        <th>Change</th>
        <th>Resource</th>
        <th>Changed by</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="event in events" :key="event.id">
        <td class="text-no-wrap text-body-small">{{ new Date(event.occurredAt).toLocaleString() }}</td>

        <td>
          <v-chip label size="x-small" :text="eventLabels[event.type] ?? event.type" />
          <div class="text-body-small text-medium-emphasis text-break">{{ summarize(event) }}</div>
        </td>

        <td class="text-break text-body-small">
          <div class="d-flex align-center ga-1">
            <span>{{ event.resource ? auditResourceLabel(event.resource) : `Deleted or unknown resource (${event.object})` }}</span>

            <v-btn
              :aria-label="`Show all changes of ${event.object}`"
              icon="mdi-filter-outline"
              size="x-small"
              title="Show all changes of this resource"
              variant="text"
              @click="$emit('filter-object', event.object)"
            />
          </div>
        </td>

        <td class="text-break text-body-small">{{ shortSubject(event.actor) }}</td>
      </tr>
    </tbody>
  </v-table>
</template>

<script setup lang="ts">
  import type { AuditEvent } from '@/types/ResourceAccess'
  import { auditResourceLabel } from '@/utils/AccessObjects'
  import { base64Decode } from '@/utils/EncodeDecodeUtils'

  defineProps<{
    events: AuditEvent[]
    loading?: boolean
  }>()

  defineEmits<{
    'filter-object': [object: string]
  }>()

  const eventLabels: Record<string, string> = {
    grants_changed: 'Grants changed',
    invitation_created: 'Invitation created',
    invitation_revoked: 'Invitation revoked',
    invitation_redeemed: 'Invitation accepted',
    inheritance_changed: 'Shell links changed',
    reconciled: 'Reconciled',
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
