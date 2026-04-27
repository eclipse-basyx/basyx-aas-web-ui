<template>
  <v-container class="pa-0" fluid>
    <v-card :variant="cardStyle ? cardStyle : 'elevated'">
      <v-list class="pt-0" nav>
        <MultiLanguageProperty
          v-if="submodelElementObject.modelType == 'MultiLanguageProperty'"
          :is-editable="isEditable"
          :multi-language-property-object="submodelElementObject"
        />

        <Property
          v-if="submodelElementObject.modelType == 'Property'"
          :is-editable="isEditable"
          :property-object="submodelElementObject"
          @update-value="updatePropertyValue"
        />

        <File
          v-if="submodelElementObject.modelType == 'File'"
          :file-object="submodelElementObject"
          :is-editable="isEditable"
        />

        <Blob v-if="submodelElementObject.modelType == 'Blob'" :blob-object="submodelElementObject" />

        <Operation
          v-if="submodelElementObject.modelType == 'Operation'"
          :is-editable="isEditable"
          :operation-object="submodelElementObject"
        />

        <ReferenceElement
          v-if="submodelElementObject.modelType == 'ReferenceElement'"
          :is-editable="isEditable"
          :reference-element-object="submodelElementObject"
        />

        <Range v-if="submodelElementObject.modelType == 'Range'" :range-object="submodelElementObject" />

        <RelationshipElement
          v-if="submodelElementObject.modelType == 'RelationshipElement'"
          :relationship-element-object="submodelElementObject"
        />

        <AnnotatedRelationshipElement
          v-if="submodelElementObject.modelType == 'AnnotatedRelationshipElement'"
          :annotated-relationship-element-object="submodelElementObject"
          :is-editable="isEditable"
        />
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  type Variant = 'elevated' | 'outlined' | 'flat' | 'text' | 'tonal' | 'plain' | undefined

  defineProps({
    submodelElementObject: {
      type: Object as any,
      default: {} as any,
    },
    cardStyle: {
      type: String as () => Variant,
      default: 'elevated',
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
  })

  const emit = defineEmits<{
    (e: 'update-value', submodelElement: any): void
  }>()

  function updatePropertyValue (submodelElement: any): void {
    emit('update-value', submodelElement)
  }
</script>
