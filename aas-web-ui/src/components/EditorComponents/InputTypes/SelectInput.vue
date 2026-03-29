<template>
  <v-combobox
    v-model="selectedValue"
    auto-select-first
    :clearable="clearable"
    density="comfortable"
    hide-no-data
    item-title="title"
    item-value="value"
    :items="selectOptions"
    :label="label"
    :return-object="false"
    variant="outlined"
  />
</template>

<script lang="ts" setup>
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, watch } from 'vue'
  import { getDataTypes } from '@/composables/AAS/DataTypeHandling'

  // Type Map for supported types
  type ValueMap = {
    category: string
    assetKind: aasTypes.AssetKind
    modellingKind: aasTypes.ModellingKind
    dataType: aasTypes.DataTypeDefXsd
    elementType: aasTypes.AasSubmodelElements
    entityType: aasTypes.EntityType
    qualifierKind: aasTypes.QualifierKind
  }

  type ValueType<T extends keyof ValueMap> = ValueMap[T]
  type SelectOption<T> = {
    title: string
    value: T
  }
  type ComboboxValue<T> = SelectOption<T> | T | string | null

  const props = withDefaults(
    defineProps<{
      label: string
      type: keyof ValueMap
      clearable?: boolean
      modelValue: ValueType<keyof ValueMap> | null
    }>(),
    {
      clearable: false,
    },
  )

  const emit = defineEmits<{
    (event: 'update:modelValue', value: ValueType<typeof props.type> | null): void
  }>()

  const selectedValue = ref<ComboboxValue<ValueType<typeof props.type>>>(props.modelValue)
  const lastValidValue = ref<ValueType<typeof props.type> | null>(props.modelValue)

  function sortOptionsAlphabetically<T> (options: SelectOption<T>[]): SelectOption<T>[] {
    return options.toSorted((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    )
  }

  function normalizeComboboxValue<T> (value: ComboboxValue<T>): T | null {
    if (value === null) return null
    if (typeof value === 'object' && 'value' in value) {
      return value.value
    }

    return value as T
  }

  const selectOptions = computed(() => {
    let options: SelectOption<ValueType<typeof props.type>>[]

    switch (props.type) {
      case 'category': {
        options = [
          { title: 'Constant', value: 'Constant' },
          { title: 'Parameter', value: 'Parameter' },
          { title: 'Variable', value: 'Variable' },
        ]
        break
      }
      case 'assetKind': {
        options = [
          { title: 'Instance', value: aasTypes.AssetKind.Instance },
          { title: 'Type', value: aasTypes.AssetKind.Type },
          { title: 'Role', value: aasTypes.AssetKind.Role },
          { title: 'Not Applicable', value: aasTypes.AssetKind.NotApplicable },
        ]
        break
      }
      case 'modellingKind': {
        options = [
          { title: 'Instance', value: aasTypes.ModellingKind.Instance },
          { title: 'Template', value: aasTypes.ModellingKind.Template },
        ]
        break
      }
      case 'dataType': {
        options = getDataTypes() as SelectOption<ValueType<typeof props.type>>[]
        break
      }
      case 'elementType': {
        options = [
          {
            title: 'SubmodelElementCollection',
            value: aasTypes.AasSubmodelElements.SubmodelElementCollection,
          },
          { title: 'SubmodelElementList', value: aasTypes.AasSubmodelElements.SubmodelElementList },
          { title: 'Property', value: aasTypes.AasSubmodelElements.Property },
          { title: 'MultiLanguageProperty', value: aasTypes.AasSubmodelElements.MultiLanguageProperty },
          { title: 'Range', value: aasTypes.AasSubmodelElements.Range },
          { title: 'File', value: aasTypes.AasSubmodelElements.File },
          { title: 'Blob', value: aasTypes.AasSubmodelElements.Blob },
          { title: 'ReferenceElement', value: aasTypes.AasSubmodelElements.ReferenceElement },
          { title: 'RelationshipElement', value: aasTypes.AasSubmodelElements.RelationshipElement },
          {
            title: 'AnnotatedRelationshipElement',
            value: aasTypes.AasSubmodelElements.AnnotatedRelationshipElement,
          },
          { title: 'Entity', value: aasTypes.AasSubmodelElements.Entity },
          { title: 'EventElement', value: aasTypes.AasSubmodelElements.EventElement },
          { title: 'BasicEventElement', value: aasTypes.AasSubmodelElements.BasicEventElement },
          { title: 'Operation', value: aasTypes.AasSubmodelElements.Operation },
          { title: 'Capability', value: aasTypes.AasSubmodelElements.Capability },
          { title: 'DataElement', value: aasTypes.AasSubmodelElements.DataElement },
          { title: 'SubmodelElement', value: aasTypes.AasSubmodelElements.SubmodelElement },
        ]
        break
      }
      case 'entityType': {
        options = [
          { title: 'Co-Managed Entity', value: aasTypes.EntityType.CoManagedEntity },
          { title: 'Self-Managed Entity', value: aasTypes.EntityType.SelfManagedEntity },
        ]
        break
      }
      case 'qualifierKind': {
        options = [
          { title: 'ValueQualifier', value: aasTypes.QualifierKind.ValueQualifier },
          { title: 'ConceptQualifier', value: aasTypes.QualifierKind.ConceptQualifier },
          { title: 'TemplateQualifier', value: aasTypes.QualifierKind.TemplateQualifier },
        ]
        break
      }
      default: {
        options = []
      }
    }

    return sortOptionsAlphabetically(options)
  })

  const allowedOptionValues = computed(
    () => new Set(selectOptions.value.map(option => option.value)),
  )

  watch(selectedValue, newValue => {
    const normalizedValue = normalizeComboboxValue(newValue)

    if (normalizedValue === null) {
      lastValidValue.value = null
      emit('update:modelValue', null)
      return
    }

    if (allowedOptionValues.value.has(normalizedValue)) {
      lastValidValue.value = normalizedValue
      if (selectedValue.value !== normalizedValue) {
        selectedValue.value = normalizedValue
      }
      emit('update:modelValue', normalizedValue)
      return
    }

    selectedValue.value = lastValidValue.value
  })

  watch(
    () => props.modelValue,
    newValue => {
      selectedValue.value = newValue
      lastValidValue.value = newValue
    },
  )
</script>
