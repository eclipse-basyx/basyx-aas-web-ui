<template>
  <v-dialog v-model="addSMEDialog" persistent width="860">
    <v-card>
      <v-card-title>
        <span class="text-body-large">Create new Submodel Element</span>
      </v-card-title>

      <v-divider />

      <v-combobox
        v-model="selectedSME"
        auto-select-first
        class="px-4 pt-4"
        density="compact"
        hide-no-data
        :items="availableSMEs"
        label="Select Submodel Element Type"
        required
        :return-object="false"
        variant="outlined"
      />

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancel</v-btn>
        <v-btn color="primary" :disabled="selectedSME == ''" @click="openCreateSMEDialog()">Next</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { getDataElementModelTypes } from '@/utils/AAS/SubmodelElementPathUtils'

  const addSMEDialog = ref(false)

  const props = defineProps<{
    modelValue: boolean
    parentElement?: any
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'open-create-sme-dialog', value: string): void
  }>()

  const allSMEs = [
    'Property',
    'SubmodelElementCollection',
    'SubmodelElementList',
    'MultiLanguageProperty',
    'Range',
    'File',
    'Blob',
    'Entity',
    'ReferenceElement',
    'RelationshipElement',
    'AnnotatedRelationshipElement',
  ]

  const availableSMEs = computed(() => {
    if (props.parentElement?.modelType === 'AnnotatedRelationshipElement') {
      return [...getDataElementModelTypes()].toSorted((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    }

    return [...allSMEs].toSorted((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  })

  const selectedSME = ref(availableSMEs.value[0] ?? '')
  const lastValidSelectedSME = ref(selectedSME.value)

  watch(selectedSME, newValue => {
    if (availableSMEs.value.includes(newValue)) {
      lastValidSelectedSME.value = newValue
      return
    }

    selectedSME.value = lastValidSelectedSME.value
  })

  watch(
    () => props.modelValue,
    value => {
      addSMEDialog.value = value
    },
  )

  watch(
    () => availableSMEs.value,
    value => {
      if (!value.includes(selectedSME.value)) {
        selectedSME.value = value[0] ?? ''
      }
      lastValidSelectedSME.value = selectedSME.value
    },
    { immediate: true },
  )

  watch(
    () => addSMEDialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  function closeDialog (): void {
    addSMEDialog.value = false
  }

  function openCreateSMEDialog (): void {
    if (selectedSME.value == '') return
    closeDialog()
    emit('open-create-sme-dialog', selectedSME.value)
  }
</script>
