<!-- <template>
  <v-card class="pa-4" variant="outlined">
    <v-expansion-panels v-model="openPanel" multiple>
      <v-expansion-panel :value="0">
        <v-expansion-panel-title>
          <div class="text-subtitle-1 font-weight-medium">
            {{ formatLabel(element.idShort) }}
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
  </v-card>
</template> -->
<template>
  <div v-if="isRepeatable" class="mb-4">
    <v-alert type="info" variant="tonal">
      To be implemented
      {{ formatLabel(element.idShort) }}.
    </v-alert>
  </div>

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
  import { computed, ref } from 'vue'
  import {
    isOptionalSingleElement,
    isRepeatableElement,
  } from '../../utils/cardinalityUtils'
  import { createInitialFormState } from '../../utils/createInitialFormState'
  import { asFormStateObject, formatLabel } from '../../utils/formFieldUtils'
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
  function createCollectionInstance (): FormStateObject {
    return Array.isArray(props.element.value) ? createInitialFormState(props.element.value) : {}
  }
  function onAddCollection (): void {
    emit('update:modelValue', createCollectionInstance())
    openPanel.value = [0]
  }

  function onRemoveCollection (): void {
    emit('update:modelValue', null)
    openPanel.value = []
  }
</script>
