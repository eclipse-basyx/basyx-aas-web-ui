<template>
  <div>
    <CodeEditor
      v-if="schema"
      :key="root"
      v-model="value"
      :accessible-label="label"
      :error="errors.length > 0"
      :height="height"
      :model-namespace="namespace"
      :schemas="[schema]"
    />

    <v-progress-linear v-else-if="!schemaError" aria-label="Loading AAS schema" indeterminate />
    <v-alert v-if="schemaError" role="alert" type="error" variant="tonal">{{ schemaError }}</v-alert>

    <v-alert
      v-if="errors.length > 0"
      class="mt-2"
      role="alert"
      type="error"
      variant="tonal"
    >
      <div v-for="message in errors" :key="message">{{ message }}</div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
  import type { CodeSchema } from './codeSchema'
  import type * as AasSchemaIntegration from '@/schemas/aas/aasEditorSchema'
  import type { AasEditorRoot } from '@/schemas/aas/aasEditorSchema'

  const props = withDefaults(defineProps<{
    root?: AasEditorRoot
    label?: string
    height?: string
    errors?: string[]
  }>(), {
    root: 'SubmodelElement',
    label: 'SubmodelElement JSON',
    height: '320px',
    errors: () => [],
  })
  const value = defineModel<string>({ required: true })
  const integration = shallowRef<typeof AasSchemaIntegration>()
  const schemaError = ref('')
  let unmounted = false

  const schema = computed<CodeSchema | undefined>(() => integration.value?.createAasEditorSchema(props.root))
  const namespace = computed(() => integration.value?.getAasEditorNamespace(props.root))

  onMounted(async () => {
    try {
      const loaded = await import('@/schemas/aas/aasEditorSchema')
      if (!unmounted) integration.value = loaded
    } catch {
      if (!unmounted) schemaError.value = 'Unable to load the AAS editor schema.'
    }
  })
  onBeforeUnmount(() => {
    unmounted = true
  })
</script>
