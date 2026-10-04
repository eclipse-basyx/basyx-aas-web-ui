<template>
  <v-sheet border rounded>
    <v-btn
      block
      class="justify-start px-3"
      :prepend-icon="open ? 'mdi-chevron-down' : 'mdi-chevron-right'"
      size="large"
      variant="text"
      @click="open = !open"
    >
      <span class="text-title-small">Extension variables</span>
      <v-chip border class="ml-2" label size="x-small">{{ specifications.length }}</v-chip>
    </v-btn>

    <v-expand-transition>
      <div v-show="open">
        <div v-for="spec in rows" :key="spec.name">
          <v-divider />

          <div
            :aria-expanded="spec.file ? opened === spec.name : undefined"
            class="px-3 py-3"
            :class="{ 'specification-row': spec.file }"
            :role="spec.file ? 'button' : undefined"
            :tabindex="spec.file ? 0 : undefined"
            @click="toggle(spec)"
            @keydown.enter.prevent="toggle(spec)"
            @keydown.space.prevent="toggle(spec)"
          >
            <div class="d-flex align-center ga-2">
              <v-icon :color="spec.style.color" :icon="spec.style.icon" size="16" />
              <span class="text-body-medium font-weight-medium text-break">{{ spec.name }}</span>
              <span v-if="spec.info" class="text-body-small text-subtitleText">{{ spec.info.label }}</span>

              <v-spacer />

              <v-chip
                v-if="spec.used"
                color="primary"
                label
                size="x-small"
                variant="tonal"
              >in use</v-chip>

              <v-icon v-if="spec.file" :icon="opened === spec.name ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small" />
            </div>

            <div v-if="spec.info" class="mt-1 text-body-small text-subtitleText">{{ spec.info.description }}</div>
          </div>

          <v-expand-transition>
            <div v-show="opened === spec.name" class="px-3 pb-3">
              <v-skeleton-loader v-if="states[spec.name]?.loading" class="mt-2" type="paragraph" />

              <v-alert v-else-if="states[spec.name]?.error" class="mt-2" type="error" variant="tonal">
                {{ states[spec.name]?.error }}
              </v-alert>

              <pre v-else class="specification-text mt-2 pa-3 rounded border bg-cardHeader text-body-small">{{ states[spec.name]?.text }}</pre>
            </div>
          </v-expand-transition>
        </div>
      </div>
    </v-expand-transition>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { VariableSpecification } from '../types'
  import { KIND_STYLES } from '../categories'
  import { useFileText } from '../composables/useFileText'
  import { getVariableInfo, normalizeVariableName } from '../variables'

  interface LoadState {
    loading: boolean
    text: string
    error: string
  }

  // Composables
  const { fetchFileText } = useFileText()

  // Properties
  const props = defineProps<{
    specifications: VariableSpecification[]
    /** Normalized names of the X- properties found in the calendar */
    xProperties: string[]
  }>()

  // Reactive state
  const open = ref(false)
  const opened = ref('')
  const states = reactive<Record<string, LoadState>>({})

  // Computed properties
  const rows = computed(() => props.specifications.map(spec => {
    const info = getVariableInfo(spec.name)
    return {
      ...spec,
      info,
      style: KIND_STYLES[info?.kind ?? 'other'],
      used: props.xProperties.includes(normalizeVariableName(spec.name)),
    }
  }))

  // Methods
  function toggle (spec: VariableSpecification): void {
    if (!spec.file) {
      return
    }
    opened.value = opened.value === spec.name ? '' : spec.name
    if (opened.value) {
      loadSpecification(spec)
    }
  }

  async function loadSpecification (spec: VariableSpecification): Promise<void> {
    if (states[spec.name] && !states[spec.name]!.error) {
      return
    }
    states[spec.name] = { loading: true, text: '', error: '' }
    try {
      states[spec.name] = { loading: false, text: await fetchFileText(spec.file), error: '' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      states[spec.name] = { loading: false, text: '', error: `The specification could not be loaded: ${message}` }
    }
  }
</script>

<style scoped>
  .specification-row {
    cursor: pointer;
  }

  .specification-row:hover,
  .specification-row:focus-visible {
    background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
    outline: none;
  }

  .specification-text {
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
