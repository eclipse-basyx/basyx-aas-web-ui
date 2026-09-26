<template>
  <v-sheet border rounded="lg">
    <v-card-title class="bg-cardHeader">Audit trail</v-card-title>
    <v-divider />
    <v-progress-linear v-if="loading" color="primary" indeterminate />

    <v-card-text>
      <p class="text-body-medium text-medium-emphasis mb-4">
        Every access change is recorded in a tamper-evident hash chain, newest first. Verification recomputes the chain
        and, when an evidence store is configured, checks each archived event.
      </p>

      <v-alert
        v-if="loaded && !available"
        density="compact"
        text="Only ReBAC administrators can view the audit trail."
        type="info"
        variant="tonal"
      />

      <template v-else-if="available">
        <v-list-subheader class="mb-1">Verify</v-list-subheader>
        <AuditVerificationPanel :component="component" />

        <v-list-subheader class="mb-1">Access changes</v-list-subheader>
        <AuditFilterForm v-model="filter" :issuer="currentPrincipal?.issuer" />

        <v-alert
          v-if="error"
          class="mb-3"
          closable
          density="compact"
          :text="error"
          type="error"
          variant="tonal"
          @click:close="error = ''"
        />

        <AuditEventTable :events="events" :loading="loading" @filter-object="filter = { object: $event }" />

        <v-btn
          v-if="hasMore"
          block
          class="mt-3"
          :loading="loading"
          rounded="lg"
          text="Load older changes"
          variant="tonal"
          @click="load(false)"
        />
      </template>
    </v-card-text>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { BaSyxComponentKey } from '@/types/BaSyx'
  import type { AuditEvent, AuditFilter } from '@/types/ResourceAccess'
  import { useCurrentPrincipal } from '@/composables/Auth/CurrentPrincipal'
  import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
  import AuditEventTable from '@/pages/modules/ResourceAccess/components/AuditEventTable.vue'
  import AuditFilterForm from '@/pages/modules/ResourceAccess/components/AuditFilterForm.vue'
  import AuditVerificationPanel from '@/pages/modules/ResourceAccess/components/AuditVerificationPanel.vue'

  const props = defineProps<{
    component: BaSyxComponentKey
  }>()

  const pageSize = 50

  const client = useResourceAccessClient()
  const { currentPrincipal } = useCurrentPrincipal()

  const filter = ref<AuditFilter>({})
  const events = ref<AuditEvent[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const available = ref(false)
  const hasMore = ref(false)
  const error = ref('')

  watch([() => props.component, filter], () => load(true), { immediate: true })

  async function load (reset: boolean): Promise<void> {
    loading.value = true
    error.value = ''
    const beforeId = reset ? undefined : events.value.at(-1)?.id
    const result = await client.listAudit(props.component, { ...filter.value, beforeId, limit: pageSize })
    loading.value = false
    loaded.value = true
    if (!result.ok || !result.data) {
      available.value = result.status !== 404
      if (result.status !== 404) error.value = result.message ?? 'The audit trail could not be loaded.'
      return
    }
    available.value = true
    events.value = reset ? result.data.events : [...events.value, ...result.data.events]
    hasMore.value = result.data.hasMore
  }
</script>
