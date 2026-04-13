<template>
  <v-card
    v-if="isRepeatable"
    class="pa-4"
    variant="outlined"
  >
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <div class="text-subtitle-1 font-weight-medium">
          {{ formatLabel(element.idShort) }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ repeatableItems.length }} item<span v-if="repeatableItems.length !== 1">s</span>
        </div>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        @click="onAddRepeatableCollection"
      >
        Add
      </v-btn>
    </div>

    <div v-if="repeatableItems.length === 0" class="text-body-2 text-medium-emphasis">
      No entries added yet.
    </div>

    <v-expansion-panels
      v-else
      v-model="openPanel"
      class="ga-3"
      multiple
      variant="accordion"
    >
      <v-expansion-panel
        v-for="(item, index) in repeatableItems"
        :key="`${element.idShort}-${index}`"
        :value="index"
      >
        <v-expansion-panel-title>
          <div class="d-flex justify-space-between align-center w-100 pr-2">
            <div class="text-subtitle-2 font-weight-medium">
              {{ formatLabel(element.idShort) }} {{ index + 1 }}
            </div>

            <v-btn
              color="error"
              prepend-icon="mdi-delete"
              variant="text"
              @click.stop="onRemoveRepeatableCollection(index)"
            >
              Remove
            </v-btn>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <NameplateRenderer
            :elements="element.value"
            :form-state="item"
            @update:form-state="onUpdateRepeatableCollection(index, $event)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>

  <v-card
    v-else-if="isOptionalSingle && !isPresent"
    class="pa-4"
    variant="outlined"
  >
    <div class="d-flex justify-space-between align-center">
      <div class="text-subtitle-1 font-weight-medium">
        {{ formatLabel(element.idShort) }}
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        @click="onAddCollection"
      >
        Add
      </v-btn>
    </div>
  </v-card>

  <v-expansion-panels v-else v-model="openPanel" multiple>
    <v-expansion-panel :value="0">
      <v-expansion-panel-title>
        <div class="d-flex justify-space-between align-center w-100 pr-2">
          <div class="text-subtitle-1 font-weight-medium">
            {{ formatLabel(element.idShort) }}
          </div>

          <v-btn
            v-if="isOptionalSingle"
            color="error"
            prepend-icon="mdi-delete"
            variant="text"
            @click.stop="onRemoveCollection"
          >
            Remove
          </v-btn>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <NameplateRenderer
          :elements="element.value"
          :form-state="collectionValue"
          @update:form-state="onCollectionUpdate"
        />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts" setup>
  import type { FormStateObject, FormStateValue } from '../../types/form'
  import type { SubmodelElementCollectionElement } from '../../types/template'
  import { computed, nextTick, ref } from 'vue'
  import {
    isOptionalSingleElement,
    isRepeatableElement,
  } from '../../utils/cardinalityUtils'
  import { createInitialFormState } from '../../utils/createInitialFormState'
  import { asFormStateObject, asFormStateObjectArray, formatLabel } from '../../utils/formFieldUtils'
  import { addopenPanelIndex, appendListItem, removeAndReindexOpenPanels, removeListItem, updateListItem } from '../../utils/subModelListUtils'
  import NameplateRenderer from './NameplateRenderer.vue'

  const props = defineProps<{
    element: SubmodelElementCollectionElement
    modelValue: FormStateValue
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: FormStateValue): void
  }>()

  const openPanel = ref<number[]>([])

  const collectionValue = computed<FormStateObject>(() => {
    return asFormStateObject(props.modelValue)
  })

  function onCollectionUpdate (value: FormStateObject): void {
    emit('update:modelValue', value)
  }

  // helpers to check cardinality
  const isOptionalSingle = computed<boolean>(() => {
    return isOptionalSingleElement(props.element)
  })

  const isRepeatable = computed<boolean>(() => {
    return isRepeatableElement(props.element)
  })

  const isPresent = computed<boolean>(() => {
    return props.modelValue !== null
  })
  const repeatableItems = computed<FormStateObject[]>(() => {
    return asFormStateObjectArray(props.modelValue)
  })

  function createCollectionInstance (): FormStateObject {
    return Array.isArray(props.element.value) ? createInitialFormState(props.element.value) : {}
  }
  async function onAddCollection (): Promise<void> {
    emit('update:modelValue', createCollectionInstance())
    await nextTick()
    openPanel.value = [0]
  }

  function onRemoveCollection (): void {
    emit('update:modelValue', null)
    openPanel.value = []
  }
  // rendering {0..*} collection items
  async function onAddRepeatableCollection (): Promise<void> {
    const newItem = createCollectionInstance()
    const updated = appendListItem(repeatableItems.value, newItem)

    emit('update:modelValue', updated)

    await nextTick()
    const newIndex = updated.length - 1
    openPanel.value = addopenPanelIndex(openPanel.value, newIndex)
  }

  function onRemoveRepeatableCollection (index: number): void {
    const updated = removeListItem(repeatableItems.value, index)
    emit('update:modelValue', updated)

    openPanel.value = removeAndReindexOpenPanels(openPanel.value, index)
  }

  function onUpdateRepeatableCollection (index: number, value: FormStateObject): void {
    const updated = updateListItem(repeatableItems.value, index, value)
    emit('update:modelValue', updated)
  }
</script>
