<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : '860px'"
    persistent
  >
    <v-sheet
      border
      class="d-flex flex-column"
      :rounded="isMobile ? undefined : 'lg'"
      :style="isMobile ? { height: '100vh' } : undefined"
    >
      <v-card-title class="bg-cardHeader">Add SubmodelElement from JSON</v-card-title>
      <v-divider />

      <v-card-text
        class="overflow-y-auto"
        :style="isMobile ? { flex: '1 1 auto', minHeight: '0' } : { maxHeight: 'calc(100vh - 200px)' }"
      >
        <v-alert class="mb-3" density="compact" type="info" variant="tonal">
          This child has no endpoint. Saving updates the complete owning Operation.
        </v-alert>

        <AasJsonEditor
          v-if="dialog"
          v-model="jsonInput"
          :errors="errors"
          label="SubmodelElement JSON"
          @update:model-value="errors = []"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn rounded="lg" @click="dialog = false">Cancel</v-btn>

        <v-btn
          class="text-buttonText"
          color="primary"
          :loading="saving"
          rounded="lg"
          variant="flat"
          @click="insert"
        >Add SubmodelElement</v-btn>
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { OperationNodeLocator } from '@/types/OperationTree'
  import type { JsonValue } from '@aas-core-works/aas-core3.1-typescript/jsonization'
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useRouter } from 'vue-router'
  import { useOperationTreeMutation } from '@/composables/AAS/OperationTreeMutation'
  import { useNavigationStore } from '@/store/NavigationStore'
  import {
    getOperationChildCollectionKey,
    serializeOperationLocator,
    stripTreeMetadata,
  } from '@/utils/AAS/OperationTreeUtils'
  import { isChildTypeAllowed } from '@/utils/AAS/SubmodelElementRegistry'

  const props = defineProps<{ modelValue: boolean, parentElement: any }>()
  const emit = defineEmits<{ 'update:model-value': [value: boolean] }>()
  const router = useRouter()
  const navigationStore = useNavigationStore()
  const { mutateOperation } = useOperationTreeMutation()
  const dialog = ref(false)
  const jsonInput = ref('')
  const errors = ref<string[]>([])
  const saving = ref(false)

  const isMobile = computed(() => navigationStore.getIsMobile)

  watch(() => props.modelValue, value => {
    dialog.value = value
    if (value) {
      jsonInput.value = ''
      errors.value = []
    }
  })
  watch(dialog, value => emit('update:model-value', value))

  async function insert (): Promise<void> {
    errors.value = []
    let value: unknown
    try {
      value = JSON.parse(jsonInput.value)
    } catch {
      errors.value = ['Enter valid JSON.']
      return
    }
    if (Array.isArray(value) || !value || typeof value !== 'object' || !('modelType' in value)) {
      errors.value = ['Insert exactly one SubmodelElement object with modelType.']
      return
    }
    const parsed = jsonization.submodelElementFromJsonable(value as JsonValue)
    if (parsed.error !== null) {
      errors.value = [parsed.error.message || String(parsed.error)]
      return
    }
    const modelType = (value as { modelType?: string }).modelType
    if (!isChildTypeAllowed(props.parentElement, modelType || '')) {
      errors.value = [`${modelType} is not compatible with this parent element.`]
      return
    }
    const childKey = getOperationChildCollectionKey(props.parentElement)
    if (!childKey) return
    let addedLocator: OperationNodeLocator | null = null
    saving.value = true
    const result = await mutateOperation(props.parentElement.persistence, ({ target }) => {
      const children = Array.isArray(target[childKey]) ? target[childKey] : []
      const index = children.length
      children.push(stripTreeMetadata(jsonization.toJsonable(parsed.mustValue())))
      target[childKey] = children
      addedLocator = [...props.parentElement.persistence.locator, childKey, index]
    })
    saving.value = false
    if (!result.success || !addedLocator) return
    dialog.value = false
    navigationStore.dispatchTriggerTreeviewReload()
    await router.push({
      query: {
        ...router.currentRoute.value.query,
        path: props.parentElement.persistence.operationPath,
        fragment: serializeOperationLocator(addedLocator),
      },
    })
  }
</script>
