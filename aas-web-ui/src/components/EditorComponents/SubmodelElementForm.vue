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
  import { computed, nextTick, ref, watch } from 'vue'
  import { allowedChildTypes } from '@/utils/AAS/SubmodelElementRegistry'

  const addSMEDialog = ref(false)

  const props = defineProps<{
    modelValue: boolean
    parentElement?: any
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'open-create-sme-dialog', value: string): void
    (event: 'cancelled'): void
  }>()

  const availableSMEs = computed<string[]>(() => {
    return allowedChildTypes(props.parentElement)
      .toSorted((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  })

  const selectedSME = ref<string>(availableSMEs.value[0] ?? '')
  const lastValidSelectedSME = ref<string>(selectedSME.value)

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
    { immediate: true },
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
      emit('update:model-value', value)
    },
  )

  function closeDialog (): void {
    addSMEDialog.value = false
    emit('cancelled')
  }

  async function openCreateSMEDialog (): Promise<void> {
    if (selectedSME.value == '') return
    addSMEDialog.value = false
    await nextTick()
    emit('open-create-sme-dialog', selectedSME.value)
  }
</script>
