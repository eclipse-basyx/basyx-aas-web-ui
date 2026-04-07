<template>
  <v-container class="pa-0" fluid>
    <v-expansion-panels class="mt-3" multiple>
      <v-expansion-panel v-for="(submodelElement, index) in localSubmodelElementData" :key="submodelElement.id">
        <v-expansion-panel-title color="elevatedCard">
          <span v-if="submodelElement.idShort">{{ nameToDisplay(submodelElement) }}</span>
          <span v-else>{{ 'Element ' + (index + 1) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <DescriptionElement
            v-if="submodelElement.description && submodelElement.description.length > 0"
            :description-array="submodelElement.description"
            :description-title="'Description'"
            :small="false"
          />
          <GenericDataVisu
            v-if="
              Array.isArray(submodelElement.value) &&
                submodelElement.value.length > 0 &&
                submodelElement.modelType !== 'MultiLanguageProperty'
            "
            :submodel-element-data="submodelElement.value"
          />
          <v-list v-else class="px-4 pt-0 pb-0" nav>
            <!-- SubmodelELement Representation for different modelTypes -->
            <Property
              v-if="submodelElement.modelType === 'Property'"
              :is-editable="false"
              :property-object="submodelElement"
            />
            <MultiLanguageProperty
              v-else-if="submodelElement.modelType === 'MultiLanguageProperty'"
              :is-editable="false"
              :multi-language-property-object="submodelElement"
            />
            <Operation
              v-else-if="submodelElement.modelType === 'Operation'"
              :is-editable="false"
              :operation-object="submodelElement"
            />
            <File
              v-else-if="submodelElement.modelType === 'File'"
              :file-object="submodelElement"
              :is-editable="false"
            />
            <Blob
              v-else-if="submodelElement.modelType === 'Blob'"
              :blob-object="submodelElement"
              :is-editable="false"
            />
            <ReferenceElement
              v-else-if="submodelElement.modelType === 'ReferenceElement'"
              :is-editable="false"
              :reference-element-object="submodelElement"
            />
            <Range
              v-else-if="submodelElement.modelType === 'Range'"
              :range-object="submodelElement"
            />
            <Entity
              v-else-if="submodelElement.modelType === 'Entity'"
              :entity-object="submodelElement"
            />
            <RelationshipElement
              v-else-if="submodelElement.modelType === 'RelationshipElement'"
              :relationship-element-object="submodelElement"
            />
            <AnnotatedRelationshipElement
              v-else-if="submodelElement.modelType === 'AnnotatedRelationshipElement'"
              :annotated-relationship-element-object="submodelElement"
              :is-editable="false"
            />
            <InvalidElement v-else :invalid-element-object="submodelElement" />
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'

  const props = defineProps({
    submodelElementData: {
      type: Object as any,
      default: {} as any,
    },
  })

  const { nameToDisplay } = useReferableUtils()

  const localSubmodelElementData = ref<Array<any>>([])

  watch(
    () => props.submodelElementData,
    () => {
      initializeSubmodelElementData()
    },
    { deep: true },
  )

  onMounted(() => {
    initializeSubmodelElementData()
  })

  function initializeSubmodelElementData (): void {
    if (!props.submodelElementData) return

    if (Object.keys(props.submodelElementData).length === 0) {
      localSubmodelElementData.value = []
      return
    }
    const submodelElementData = [...props.submodelElementData]
    localSubmodelElementData.value = submodelElementData
  }
</script>
