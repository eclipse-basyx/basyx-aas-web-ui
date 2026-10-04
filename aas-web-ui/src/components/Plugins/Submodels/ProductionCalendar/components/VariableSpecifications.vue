<template>
  <v-card>
    <v-card-title class="text-body-large">Specification Extension Variables</v-card-title>

    <v-card-text class="pt-0">
      <v-expansion-panels v-model="opened" variant="accordion">
        <v-expansion-panel v-for="spec in specifications" :key="spec.name" :value="spec.name">
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100 ga-2">
              <span class="font-weight-medium">{{ spec.name }}</span>
              <v-spacer />

              <v-chip
                v-if="usedNames.has(spec.name.toUpperCase())"
                color="primary"
                size="x-small"
                variant="tonal"
              >
                used in calendar
              </v-chip>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-skeleton-loader v-if="states[spec.name]?.loading" type="paragraph" />

            <v-alert v-else-if="states[spec.name]?.error" type="error" variant="tonal">
              {{ states[spec.name]?.error }}
            </v-alert>

            <pre v-else class="text-body-small specification-text">{{ states[spec.name]?.text }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import type { VariableSpecification } from '../types'
  import { useFileText } from '../composables/useFileText'

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
    /** Upper-case names of the X- properties found in the calendar */
    xProperties: string[]
  }>()

  // Reactive state
  const opened = ref<string | undefined>()
  const states = reactive<Record<string, LoadState>>({})

  // Computed properties
  const usedNames = computed(() => new Set(props.xProperties))

  // Watchers
  watch(opened, name => {
    const spec = props.specifications.find(candidate => candidate.name === name)
    if (spec) {
      loadSpecification(spec)
    }
  })

  // Methods
  async function loadSpecification (spec: VariableSpecification): Promise<void> {
    if (states[spec.name] && !states[spec.name]!.error) {
      return
    }
    states[spec.name] = { loading: true, text: '', error: '' }
    try {
      states[spec.name] = { loading: false, text: await fetchFileText(spec.file), error: '' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      states[spec.name] = { loading: false, text: '', error: `No specification available: ${message}` }
    }
  }
</script>

<style scoped>
  .specification-text {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
  }
</style>
