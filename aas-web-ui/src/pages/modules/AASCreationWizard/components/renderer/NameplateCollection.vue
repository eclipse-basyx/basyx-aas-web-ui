<template>
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
</template>

<script lang="ts" setup>
  import type { FormStateObject, FormStateValue } from '../../types/form'
  import type { SubmodelElementCollectionElement } from '../../types/template'
  import { computed, ref } from 'vue'
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
</script>
