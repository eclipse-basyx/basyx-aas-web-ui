<template>
  <v-dialog
    v-model="dialogOpen"
    :fullscreen="mobile"
    max-width="1100"
    :transition="mobile ? false : undefined"
  >
    <v-card color="card">
      <v-toolbar color="cardHeader">
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="dialogOpen = false" />
      </v-toolbar>

      <v-card-text>
        <v-alert
          class="mb-4"
          density="compact"
          icon="mdi-server"
          type="info"
          variant="tonal"
        >
          <div class="font-weight-medium">{{ targetLabel }}</div>
          <div class="text-caption text-break">{{ endpoint }}</div>
        </v-alert>

        <QueryLanguageEditor
          v-model="queryText"
          :height="mobile ? 'calc(100svh - 310px)' : 'min(55vh, 520px)'"
          @validation-change="schemaValidation = $event"
        />

        <v-alert
          v-if="schemaValidation.isValid && !contextValidation.isValid"
          class="mt-2"
          density="compact"
          role="alert"
          type="error"
          variant="tonal"
        >
          {{ contextValidation.message }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-btn text="Reset example" variant="text" @click="emit('reset')" />
        <v-spacer />
        <v-btn text="Cancel" variant="text" @click="dialogOpen = false" />

        <v-btn
          color="primary"
          :disabled="!canExecute"
          :loading="loading"
          text="Run query"
          variant="elevated"
          @click="execute"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { QueryLanguageValidation } from '@/pages/modules/queryLanguage/queryLanguageValidation'
  import type { QueryLanguageQuery, QueryTarget } from '@/types/QueryLanguage'
  import { buildQueryEndpoint, validateQueryForTarget } from '@/utils/QueryLanguageUtils'

  const props = defineProps<{
    endpoint: string
    loading: boolean
    mobile: boolean
    query: string
    target: QueryTarget
    title: string
  }>()

  const emit = defineEmits<{
    'execute': [query: QueryLanguageQuery]
    'reset': []
    'update:query': [query: string]
  }>()

  const dialogOpen = defineModel<boolean>({ required: true })
  const schemaValidation = ref<QueryLanguageValidation>({ isValid: false, messages: [] })

  const queryText = computed({
    get: () => props.query,
    set: value => emit('update:query', value),
  })
  const contextValidation = computed(() => validateQueryForTarget(props.query, props.target))
  const canExecute = computed(() => schemaValidation.value.isValid && contextValidation.value.isValid && !props.loading)
  const targetLabel = computed(() => {
    if (props.target === 'aas-registry') return 'AAS Registry'
    if (props.target === 'aas-repository') return 'AAS Repository'
    return 'Submodel Repository'
  })
  const endpoint = computed(() => buildQueryEndpoint(props.endpoint, props.target))

  function execute (): void {
    if (!canExecute.value || !contextValidation.value.query) return
    emit('execute', contextValidation.value.query)
  }
</script>
