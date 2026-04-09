<template>
  <v-row>
    <v-col v-for="(element, index) in visibleElements" :key="element.idShort" cols="12" :md="getMdCols(element, index, elements)">
      <!-- Leaf fields -->
      <NameplateField
        v-if="isLeafElement(element)"
        :element="element"
        :model-value="props.formState[element.idShort]"
        @update:model-value="updateFieldValue(element.idShort, $event)"
      />

      <!-- Collection placeholder -->
      <NamePlateCollection
        v-else-if="isSubmodelElementCollectionElement(element)"
        :element="element"
        :model-value="props.formState[element.idShort]"
        @update:model-value="updateFieldValue(element.idShort, $event)"
      />

      <!-- List placeholder -->
      <!-- <v-card v-else-if="element.modelType === 'SubmodelElementList'" variant="outlined" class="pa-4">
                <div class="text-subtitle-1 font-weight-medium">List: {{ formatLabel(element.idShort) }}</div>
                <div class="text-body-2 text-medium-emphasis">List rendering will be added in a later step.</div>
            </v-card> -->
      <NamePlateList
        v-else-if="isSubmodelElementListElement(element)"
        :element="element"
        :model-value="props.formState[element.idShort]"
        @update:model-value="updateFieldValue(element.idShort, $event)"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
  import type { FormStateObject, FormStateValue } from '../../types/form'
  import type { TemplateElement } from '../../types/template'
  import {
    isLeafElement,
    isSubmodelElementCollectionElement,
    isSubmodelElementListElement,
  } from '../../utils/checkTemplateFields'
  // import { formatLabel } from '../../utils/formFieldUtils';
  import NamePlateCollection from './NameplateCollection.vue'
  import NameplateField from './NameplateField.vue'
  import NamePlateList from './NameplateList.vue'

  const props = defineProps<{
    elements: TemplateElement[]
    formState: FormStateObject
  }>()
  console.log('these are the props received', props.elements, props.formState)
  const emit = defineEmits<{
    (e: 'update:formState', value: FormStateObject): void
  }>()

  const visibleElements = computed(() => {
    return props.elements.filter(element => !shouldHideElement(element))
  })
  // function isLeafElement(element: TemplateElement): boolean {
  //     return (
  //         element.modelType === 'Property' ||
  //         element.modelType === 'MultiLanguageProperty' ||
  //         element.modelType === 'File'
  //     );
  // }
  function updateFieldValue (idShort: string, value: FormStateValue): void {
    emit('update:formState', {
      ...props.formState,
      [idShort]: value,
    })
  }

  function isHalfWidthElement (element: TemplateElement): boolean {
    return element.modelType === 'Property' || element.modelType === 'File'
  }

  function getMdCols (element: TemplateElement, index: number, elements: TemplateElement[]): number {
    if (!isHalfWidthElement(element)) {
      return 12
    }

    const prevElement = elements[index - 1]
    const nextElement = elements[index + 1]

    const nextIsFullWidth = nextElement && !isHalfWidthElement(nextElement)
    const prevIsFullWidth = prevElement && !isHalfWidthElement(prevElement)

    if (nextIsFullWidth || prevIsFullWidth) {
      return 12
    }

    return 6
  }
  function shouldHideElement (element: TemplateElement): boolean {
    return element.idShort === 'AssetSpecificProperties'
  }
</script>
