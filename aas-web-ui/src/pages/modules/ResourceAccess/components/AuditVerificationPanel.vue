<template>
  <v-sheet border class="pa-3 mb-3" rounded="lg">
    <div class="d-flex flex-wrap align-start ga-2">
      <v-text-field
        v-model="expectedHead"
        class="flex-grow-1"
        density="compact"
        :disabled="verifying"
        hint="Optional. A head hash kept outside BaSyx reveals events removed from the end of the trail."
        label="Expected head hash"
        min-width="260"
        persistent-hint
        variant="outlined"
      />

      <v-btn
        v-if="verifying"
        border
        color="surface-light"
        height="40"
        rounded="lg"
        text="Stop"
        variant="flat"
        @click="stopped = true"
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

    <v-btn
      :append-icon="showCheckpoint ? 'mdi-chevron-up' : 'mdi-chevron-down'"
      class="mt-2"
      size="small"
      text="Start from a checkpoint"
      variant="text"
      @click="showCheckpoint = !showCheckpoint"
    />

    <v-expand-transition>
      <div v-if="showCheckpoint" class="d-flex flex-wrap ga-2 mt-2">
        <v-number-input
          v-model="checkpointId"
          control-variant="hidden"
          density="compact"
          :disabled="verifying"
          hide-details
          label="Event ID"
          :min="0"
          variant="outlined"
          width="160"
        />

        <v-text-field
          v-model="checkpointHash"
          class="flex-grow-1"
          density="compact"
          :disabled="verifying"
          hint="Head hash of that event from an earlier verification. Only newer events are checked."
          label="Hash of the event"
          min-width="260"
          persistent-hint
          variant="outlined"
        />
      </div>
    </v-expand-transition>

    <v-progress-linear v-if="verifying" class="mt-3" color="primary" indeterminate />
    <div v-if="verifying" class="text-body-small text-medium-emphasis mt-1">{{ report.checked }} events checked…</div>

    <v-alert
      v-if="result"
      class="mt-3"
      density="compact"
      :title="resultTitle"
      :type="result.valid ? (result.complete ? 'success' : 'warning') : 'error'"
      variant="tonal"
    >
      {{ summary }}
      <span v-if="result.reason">Event {{ result.firstInvalidId }}: {{ result.reason }}.</span>

      <div v-if="result.valid && result.headHash" class="mt-2">
        Last event <strong>{{ result.lastId }}</strong>, head hash <code class="text-break">{{ result.headHash }}</code>

        <v-btn
          aria-label="Copy head hash"
          icon="mdi-content-copy"
          size="x-small"
          variant="text"
          @click="copy(result.headHash)"
        />

        <div class="text-body-small mt-1">
          Keep the event ID and head hash outside BaSyx. Later, use them as checkpoint to check only newer events, or as
          expected head hash to detect removed events.
        </div>
      </div>
    </v-alert>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { BaSyxComponentKey } from '@/types/BaSyx'
  import type { AuditRange, AuditVerification } from '@/types/ResourceAccess'
  import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'

  const props = defineProps<{
    component: BaSyxComponentKey
  }>()

  const rangeSize = 1000

  const client = useResourceAccessClient()

  const expectedHead = ref('')
  const showCheckpoint = ref(false)
  const checkpointId = ref<number | null>(null)
  const checkpointHash = ref('')
  const verifying = ref(false)
  const stopped = ref(false)
  const report = ref<AuditVerification>(emptyReport())
  const result = ref<AuditVerification>()

  const resultTitle = computed(() => {
    if (!result.value?.valid) return 'The audit trail is not intact'
    return result.value.complete ? 'The audit trail is intact' : 'Verification stopped before the end of the trail'
  })

  const summary = computed(() => {
    const value = result.value
    if (!value) return ''
    const missing = value.evidenceMissing ? `, ${value.evidenceMissing} without archive` : ''
    return `${value.checked} events checked, ${value.evidenceVerified} archived events verified${missing}.`
  })

  watch(() => props.component, () => {
    result.value = undefined
  })

  async function verify (): Promise<void> {
    verifying.value = true
    stopped.value = false
    result.value = undefined
    report.value = emptyReport()
    let range: AuditRange = {
      ...(checkpointId.value && checkpointHash.value.trim() ? { afterId: checkpointId.value, afterHash: checkpointHash.value.trim() } : {}),
      limit: rangeSize,
      expectedHead: expectedHead.value,
    }
    while (!stopped.value) {
      const response = await client.verifyAudit(props.component, range)
      if (!response.ok || !response.data) {
        report.value = { ...report.value, valid: false, reason: response.message ?? 'The verification failed' }
        break
      }
      accumulate(response.data)
      if (!response.data.valid || response.data.complete) break
      range = { ...range, afterId: response.data.lastId, afterHash: response.data.headHash }
    }
    verifying.value = false
    result.value = report.value
  }

  function accumulate (range: AuditVerification): void {
    const total = report.value
    report.value = {
      ...range,
      checked: total.checked + range.checked,
      evidenceVerified: total.evidenceVerified + range.evidenceVerified,
      evidenceMissing: total.evidenceMissing + range.evidenceMissing,
      lastId: range.lastId ?? total.lastId,
      headHash: range.headHash ?? total.headHash,
    }
  }

  function emptyReport (): AuditVerification {
    return { valid: true, complete: false, checked: 0, evidenceVerified: 0, evidenceMissing: 0 }
  }

  async function copy (text?: string): Promise<void> {
    if (text) await navigator.clipboard.writeText(text).catch(() => undefined)
  }
</script>
