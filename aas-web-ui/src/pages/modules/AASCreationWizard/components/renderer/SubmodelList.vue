<template>
  <v-card class="pa-4" variant="flat">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <div class="text-subtitle-1 font-weight-medium">
          {{ getDisplayLabel() }}
        </div>

        <div class="text-body-2 text-medium-emphasis">
          {{ items.length }} item<span v-if="items.length !== 1">s</span>
        </div>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" variant="tonal" @click="onAddItem"> Add New </v-btn>
    </div>

    <div v-if="items.length === 0" class="text-body-2 text-medium-emphasis">No entries added yet.</div>

    <v-expansion-panels
      v-else
      v-model="openPanels"
      class="ga-3"
      multiple
      variant="accordion"
    >
      <v-expansion-panel v-for="(item, index) in items" :key="`${element.idShort}-${index}`" :value="index">
        <v-expansion-panel-title>
          <div class="d-flex justify-space-between align-center w-100 pr-2">
            <div class="text-subtitle-2 font-weight-medium">
              {{ getDisplayLabel() }} {{ index + 1 }}
            </div>

            <v-btn
              v-if="canRemoveItem"
              color="error"
              prepend-icon="mdi-delete"
              variant="text"
              @click.stop="onRemoveItem(index)"
            >
              Remove
            </v-btn>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <SubmodelRenderer
            v-if="itemRendererElements.length > 0"
            :elements="itemRendererElements"
            :form-state="item"
            :show-validation="props.showValidation"
            @update:form-state="onUpdateItem(index, $event)"
          />

          <div v-else class="text-body-2 text-medium-emphasis">
            This list item type is not supported yet.
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script lang="ts" setup>
  import type { FormStateObject, FormStateValue } from '../../types/form'
  import type { SubmodelElementListElement, TemplateElement } from '../../types/template'
  import { computed, onMounted, ref } from 'vue'
  import { isRequiredElement } from '../../utils/cardinalityUtils'
  import { asFormStateObjectArray, formatRepeatedElementBaseLabel } from '../../utils/formFieldUtils'
  import {
    addopenPanelIndex,
    appendListItem,
    createSubmodelListItem,
    getListItemRendererElements,
    removeAndReindexOpenPanels,
    removeListItem,
    updateListItem,
  } from '../../utils/subModelListUtils'
  import SubmodelRenderer from './SubmodelRenderer.vue'

  const props = defineProps<{
    element: SubmodelElementListElement
    modelValue: FormStateValue
    showValidation?: boolean
  }>()
  onMounted(() => {
    if (isRequiredElement(props.element) && items.value.length > 0) {
      openPanels.value = [0]
    }
  })
  const emit = defineEmits<{
    (e: 'update:modelValue', value: FormStateObject[]): void
  }>()

  const openPanels = ref<number[]>([])

  const items = computed<FormStateObject[]>(() => {
    return asFormStateObjectArray(props.modelValue)
  })

  const itemRendererElements = computed<TemplateElement[]>(() => {
    return getListItemRendererElements(props.element)
  })
  const minimumItemCount = computed<number>(() => {
    return isRequiredElement(props.element) ? 1 : 0
  })
  const canRemoveItem = computed<boolean>(() => {
    return items.value.length > minimumItemCount.value
  })

  function onAddItem (): void {
    const newItem = createSubmodelListItem(props.element)
    const updated = appendListItem(items.value, newItem)
    emit('update:modelValue', updated)

    const newIndex = updated.length - 1
    openPanels.value = addopenPanelIndex(openPanels.value, newIndex)
  }

  function onRemoveItem (index: number): void {
    if (!canRemoveItem.value) {
      return
    }
    const updated = removeListItem(items.value, index)
    emit('update:modelValue', updated)

    openPanels.value = removeAndReindexOpenPanels(openPanels.value, index)
  }

  function onUpdateItem (index: number, value: FormStateObject): void {
    const updated = updateListItem(items.value, index, value)
    emit('update:modelValue', updated)
  }
  function getDisplayLabel (): string {
    return formatRepeatedElementBaseLabel(props.element.idShort)
  }
</script>
