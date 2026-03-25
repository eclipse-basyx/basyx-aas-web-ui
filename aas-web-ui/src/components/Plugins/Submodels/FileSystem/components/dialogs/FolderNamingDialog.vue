<template>
  <v-dialog v-model="internalDialog" :width="600">
    <template #default="{ isActive }">
      <v-sheet border rounded="lg">
        <v-card-title class="bg-cardHeader">Name Folder</v-card-title>
        <v-divider />
        <v-card-text>
          <v-form v-model="isFormValid" @submit.prevent>
            <v-text-field
              v-model="folderName"
              density="compact"
              label="Folder Name"
              :rules="folderNameRules"
              validate-on="eager input"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn rounded="lg" text="Cancel" @click="handleCancel" />
          <v-btn
            class="text-buttonText"
            color="primary"
            :disabled="!isFormValid"
            rounded="lg"
            text="Save"
            variant="flat"
            @click="handleSave(isActive)"
          />
        </v-card-actions>
      </v-sheet>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { FolderElement } from '../../types'
  import { computed, ref, watch } from 'vue'

  interface Props {
    modelValue: boolean
    folder: FolderElement | null
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:model-value', value: boolean): void
    (e: 'save', folderName: string): void
  }>()

  const folderName = ref('')
  const isFormValid = ref(false)

  // Folder name validation rules following macOS and Windows conventions
  const folderNameRules = [
    (v: string) => !!v || 'Folder name is required',
    (v: string) => v.trim().length > 0 || 'Folder name cannot be empty or only spaces',
    (v: string) => v.trim().length <= 255 || 'Folder name must be 255 characters or less',
    (v: string) => !/[/\\:*?"<>|]/.test(v) || String.raw`Folder name cannot contain: / \ : * ? " < > |`,
    (v: string) => (v !== '.' && v !== '..') || 'Folder name cannot be "." or ".."',
    (v: string) => v === v.trim() || 'Folder name cannot start or end with spaces',
  ]

  const internalDialog = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:model-value', value),
  })

  // Initialize folder name when dialog opens
  watch(
    () => props.modelValue,
    isOpen => {
      if (isOpen && props.folder) {
        const nameEntry = props.folder.displayName?.find(name => name.language === 'en')
        folderName.value = nameEntry?.text || props.folder.idShort
      }
    },
  )

  function handleCancel (): void {
    emit('update:model-value', false)
  }

  function handleSave (isActive: { value: boolean }): void {
    emit('save', folderName.value)
    isActive.value = false
  }
</script>
