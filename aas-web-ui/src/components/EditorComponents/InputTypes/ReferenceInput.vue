<template>
  <v-divider v-if="!noHeader" />

  <v-list-item v-if="!noHeader" class="pl-0 pt-0">
    <template #title>
      <div class="text-title-small">{{ label }}</div>
    </template>
  </v-list-item>
  <!-- Reference Type Selection -->
  <v-list-item v-if="referenceValue !== null" class="px-0 pt-0 mb-4">
    <v-combobox
      auto-select-first
      class="mt-2"
      density="comfortable"
      hide-details
      hide-no-data
      item-title="title"
      item-value="value"
      :items="referenceTypeOptions"
      label="Reference Type"
      :model-value="referenceValue.type"
      :return-object="false"
      variant="outlined"
      @update:model-value="updateReferenceType"
    />
  </v-list-item>
  <!-- Reference Keys -->
  <v-list-item v-for="(key, i) in referenceValue?.keys" :key="i" class="px-0 py-0">
    <template #prepend>
      <v-combobox
        auto-select-first
        class="mr-3 mt-1"
        density="comfortable"
        hide-no-data
        item-title="title"
        item-value="value"
        :items="keyTypeOptions"
        label="Key Type"
        :model-value="key.type"
        :return-object="false"
        variant="outlined"
        :width="220"
        @update:model-value="updateKeyType(key, $event)"
      />
    </template>

    <v-text-field
      v-model="key.value"
      append-icon="mdi-delete"
      class="mt-1"
      density="comfortable"
      label="Value"
      variant="outlined"
      @click:append="deleteReferenceKey(key)"
    />
  </v-list-item>

  <div class="d-flex ga-2 mt-1 mb-4">
    <v-btn
      color="primary"
      prepend-icon="mdi-plus"
      text="Add Key"
      variant="outlined"
      @click="addReferenceKey"
    />

    <v-btn
      v-if="showRemoveButton && referenceValue !== null"
      color="error"
      prepend-icon="mdi-delete"
      text="Remove Reference"
      variant="outlined"
      @click="clearReference"
    />
  </div>
</template>

<script lang="ts" setup>
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, watch } from 'vue'

  type SelectOption<T> = {
    title: string
    value: T
  }
  type ComboboxValue<T> = SelectOption<T> | T | string | null

  type Props = {
    label: string
    noHeader?: boolean
    showRemoveButton?: boolean
    modelValue: aasTypes.Reference | null
    defaultReferenceType?: aasTypes.ReferenceTypes
    defaultKeyType?: aasTypes.KeyTypes
  }

  const props = withDefaults(defineProps<Props>(), {
    noHeader: false,
    showRemoveButton: false,
    defaultReferenceType: aasTypes.ReferenceTypes.ModelReference,
    defaultKeyType: aasTypes.KeyTypes.GlobalReference,
  })

  const emit = defineEmits<{
    (event: 'update:modelValue', value: aasTypes.Reference | null): void
  }>()

  const referenceValue = ref<aasTypes.Reference | null>(props.modelValue)

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

  // Reference Type options
  const referenceTypeOptions = computed(() =>
    sortOptionsAlphabetically([
      { title: 'External Reference', value: aasTypes.ReferenceTypes.ExternalReference },
      { title: 'Model Reference', value: aasTypes.ReferenceTypes.ModelReference },
    ]),
  )

  // Key Type options based on aasTypes.KeyTypes
  const keyTypeOptions = computed(() =>
    sortOptionsAlphabetically([
      { title: 'GlobalReference', value: aasTypes.KeyTypes.GlobalReference },
      { title: 'FragmentReference', value: aasTypes.KeyTypes.FragmentReference },
      { title: 'AssetAdministrationShell', value: aasTypes.KeyTypes.AssetAdministrationShell },
      { title: 'Submodel', value: aasTypes.KeyTypes.Submodel },
      { title: 'ConceptDescription', value: aasTypes.KeyTypes.ConceptDescription },
      { title: 'Identifiable', value: aasTypes.KeyTypes.Identifiable },
      { title: 'Referable', value: aasTypes.KeyTypes.Referable },
      { title: 'SubmodelElement', value: aasTypes.KeyTypes.SubmodelElement },
      { title: 'SubmodelElementCollection', value: aasTypes.KeyTypes.SubmodelElementCollection },
      { title: 'SubmodelElementList', value: aasTypes.KeyTypes.SubmodelElementList },
      { title: 'Property', value: aasTypes.KeyTypes.Property },
      { title: 'MultiLanguageProperty', value: aasTypes.KeyTypes.MultiLanguageProperty },
      { title: 'Range', value: aasTypes.KeyTypes.Range },
      { title: 'File', value: aasTypes.KeyTypes.File },
      { title: 'Blob', value: aasTypes.KeyTypes.Blob },
      { title: 'ReferenceElement', value: aasTypes.KeyTypes.ReferenceElement },
      { title: 'RelationshipElement', value: aasTypes.KeyTypes.RelationshipElement },
      { title: 'AnnotatedRelationshipElement', value: aasTypes.KeyTypes.AnnotatedRelationshipElement },
      { title: 'Entity', value: aasTypes.KeyTypes.Entity },
      { title: 'EventElement', value: aasTypes.KeyTypes.EventElement },
      { title: 'BasicEventElement', value: aasTypes.KeyTypes.BasicEventElement },
      { title: 'Operation', value: aasTypes.KeyTypes.Operation },
      { title: 'Capability', value: aasTypes.KeyTypes.Capability },
      { title: 'DataElement', value: aasTypes.KeyTypes.DataElement },
    ]),
  )

  const allowedReferenceTypes = computed(
    () => new Set(referenceTypeOptions.value.map(option => option.value)),
  )
  const allowedKeyTypes = computed(() => new Set(keyTypeOptions.value.map(option => option.value)))

  function updateReferenceType (newValue: ComboboxValue<aasTypes.ReferenceTypes>): void {
    if (referenceValue.value === null || newValue === null) return

    const normalizedValue = normalizeComboboxValue(newValue)
    if (normalizedValue === null) return

    if (allowedReferenceTypes.value.has(normalizedValue)) {
      referenceValue.value.type = normalizedValue
    }
  }

  function updateKeyType (key: aasTypes.Key, newValue: ComboboxValue<aasTypes.KeyTypes>): void {
    if (newValue === null) return

    const normalizedValue = normalizeComboboxValue(newValue)
    if (normalizedValue === null) return

    if (allowedKeyTypes.value.has(normalizedValue)) {
      key.type = normalizedValue
    }
  }

  watch(
    referenceValue,
    newValue => {
      emit('update:modelValue', newValue)
    },
    { deep: true },
  )

  watch(
    () => props.modelValue,
    newValue => {
      referenceValue.value = newValue
    },
  )

  function addReferenceKey (): void {
    if (referenceValue.value === null) {
      referenceValue.value = new aasTypes.Reference(props.defaultReferenceType, [
        new aasTypes.Key(props.defaultKeyType, ''),
      ])
    } else if (referenceValue.value.keys === undefined) {
      referenceValue.value.keys = [new aasTypes.Key(props.defaultKeyType, '')]
    } else {
      referenceValue.value.keys.push(new aasTypes.Key(props.defaultKeyType, ''))
    }
  }

  function deleteReferenceKey (key: aasTypes.Key): void {
    if (referenceValue.value?.keys === undefined) return
    const index = referenceValue.value.keys.indexOf(key)
    if (index !== -1) {
      referenceValue.value.keys.splice(index, 1)
    }
    // If there are no keys left, delete the reference
    if (referenceValue.value.keys.length === 0) {
      referenceValue.value = null
    }
  }

  function clearReference (): void {
    referenceValue.value = null
  }
</script>
