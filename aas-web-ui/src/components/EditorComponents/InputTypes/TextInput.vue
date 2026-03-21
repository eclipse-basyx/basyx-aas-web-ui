<template>
  <v-text-field
    v-model="textValue"
    :append-icon="showDeleteButton ? 'mdi-delete' : undefined"
    bg-color="surface"
    density="comfortable"
    :error-messages="errorMessages"
    :label="label"
    variant="outlined"
    @click:append="handleAppendClick"
  >
    <template #append-inner>
      <v-btn
        v-if="showGenerateIriButton"
        border
        class="text-none"
        color="primary"
        size="small"
        slim
        text="Generate IRI"
        variant="text"
        @click.stop="textValue = generateIri(type!)"
      />
    </template>
  </v-text-field>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue'
  import { useIDUtils } from '@/composables/IDUtils'

  // Composables
  const { generateIri } = useIDUtils()

  type Props = {
    label: string
    modelValue: string | null
    errorMessages?: string | string[] | null
    showDeleteButton?: boolean
  } & ({ showGenerateIriButton: true, type: string } | { showGenerateIriButton?: false, type?: never })

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: string | null): void
    (event: 'click:delete'): void
  }>()

  const textValue = ref<string | null>(props.modelValue)

  watch(textValue, newValue => {
    if (newValue === '') {
      emit('update:modelValue', null)
      textValue.value = null
    } else {
      emit('update:modelValue', newValue)
    }
  })

  watch(
    () => props.modelValue,
    newValue => {
      textValue.value = newValue
    },
  )

  function handleAppendClick (): void {
    if (props.showDeleteButton) {
      emit('click:delete')
    }
  }
</script>
