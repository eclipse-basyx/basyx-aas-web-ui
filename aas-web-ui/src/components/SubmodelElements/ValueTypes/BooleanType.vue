<template>
  <v-list-item class="px-3 py-2">
    <div v-if="isOperationVariable" class="text-caption text-subtitleText">
      {{ displayLabel }}
    </div>

    <v-switch
      v-model="newBooleanValue"
      :aria-label="`${displayLabel}: ${booleanStateLabel}`"
      color="primary"
      density="compact"
      :error-messages="saveStatus === 'error' ? helperText : undefined"
      :hide-details="isOperationVariable"
      :hint="isOperationVariable || saveStatus === 'error' ? undefined : helperText"
      inset
      :label="booleanStateLabel"
      :loading="saveStatus === 'saving'"
      :persistent-hint="!isOperationVariable"
      :readonly="isOutputVariable || !isEditable || saveStatus === 'saving'"
      @update:model-value="changeState"
    />
  </v-list-item>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useSMEHandling } from '@/composables/AAS/SMEHandling'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useAASStore } from '@/store/AASDataStore'

  // Stores
  const aasStore = useAASStore()

  // Composables
  const { patchRequest } = useRequestHandling()
  const { fetchAndDispatchSme } = useSMEHandling()

  const props = defineProps({
    booleanValue: {
      type: Object,
      default: () => ({}),
    },
    isOperationVariable: {
      type: Boolean,
      default: false,
    },
    variableType: {
      type: String,
      default: 'number',
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
  })

  const emit = defineEmits<{
    (event: 'update-value', updatedBooleanValue: any): void
  }>()

  // Data
  const newBooleanValue = ref<boolean>(false)
  const confirmedBooleanValue = ref<boolean>(false)
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  let savedStatusTimeout: ReturnType<typeof setTimeout> | undefined

  // Computed Properties
  const selectedNode = computed(() => aasStore.getSelectedNode)
  const isOperationVariable = computed(() => props.isOperationVariable)
  const isOutputVariable = computed(() => props.isOperationVariable && props.variableType === 'outputVariables')
  const displayLabel = computed(() => {
    if (!isOperationVariable.value) return 'Boolean value'
    const displayName = props.booleanValue.displayName?.find((name: any) => name?.text?.trim())
    return displayName?.text || props.booleanValue.idShort || 'Boolean value'
  })
  const booleanStateLabel = computed(() => newBooleanValue.value ? 'True' : 'False')
  const hasChanges = computed(() => {
    return !isOperationVariable.value && newBooleanValue.value !== confirmedBooleanValue.value
  })
  const helperText = computed(() => {
    if (isOperationVariable.value) return ''
    if (!props.isEditable) return 'Stored in the AAS'
    if (saveStatus.value === 'saving') return 'Saving to the AAS…'
    if (saveStatus.value === 'saved') return 'Saved to the AAS'
    if (saveStatus.value === 'error') return `Couldn’t save · AAS is still ${confirmedBooleanValue.value}`
    if (hasChanges.value) return 'Not saved'
    return 'Changes save automatically'
  })
  // Watchers
  watch(
    () => selectedNode.value,
    () => {
      initialize(props.booleanValue.value)
    },
  )

  watch(
    () => props.booleanValue,
    propsBooleanValue => {
      initialize(propsBooleanValue.value)
    },
    { deep: true },
  )

  onMounted(() => {
    initialize(props.booleanValue.value)
  })

  onBeforeUnmount(() => {
    clearSavedStatusTimeout()
  })

  function initialize (booleanValue: string | boolean): void {
    clearSavedStatusTimeout()
    const parsedBooleanValue = parseBoolean(booleanValue)
    newBooleanValue.value = parsedBooleanValue
    confirmedBooleanValue.value = parsedBooleanValue
    saveStatus.value = 'idle'
  }

  function parseBoolean (booleanValue: string | boolean): boolean {
    return typeof booleanValue === 'string' ? booleanValue === 'true' : booleanValue
  }

  function clearSavedStatusTimeout (): void {
    if (savedStatusTimeout !== undefined) {
      clearTimeout(savedStatusTimeout)
      savedStatusTimeout = undefined
    }
  }

  function showSavedStatus (): void {
    clearSavedStatusTimeout()
    saveStatus.value = 'saved'
    savedStatusTimeout = setTimeout(() => {
      if (saveStatus.value === 'saved') saveStatus.value = 'idle'
      savedStatusTimeout = undefined
    }, 2500)
  }

  async function updateValue (): Promise<void> {
    if (isOperationVariable.value) {
      emit('update-value', newBooleanValue.value)
      return
    }

    if (saveStatus.value === 'saving') return

    const path = `${props.booleanValue.path}/$value`
    const content = JSON.stringify(newBooleanValue.value.toString())
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const context = `updating ${props.booleanValue.modelType} "${props.booleanValue.idShort}"`
    const disableMessage = false
    clearSavedStatusTimeout()
    saveStatus.value = 'saving'

    try {
      const response = await patchRequest(path, content, headers, context, disableMessage)
      if (response.success) {
        // After successful patch request fetch and dispatch updated SME
        await fetchAndDispatchSme(selectedNode.value.path, false)
        confirmedBooleanValue.value = newBooleanValue.value
        showSavedStatus()
      } else {
        saveStatus.value = 'error'
      }
    } catch {
      saveStatus.value = 'error'
    }
  }

  function changeState (): void {
    if (isOperationVariable.value) {
      updateValue()
      return
    }

    if (!hasChanges.value) {
      saveStatus.value = 'idle'
      return
    }

    updateValue()
  }
</script>
