<template>
  <div> HandoverDocumentation Form</div>
  <div class="d-flex justify-space-between">
    <v-btn color="primary" @click="props.prev">Back</v-btn>
    <v-btn color="primary" @click="handleSubmit">Submit</v-btn>
  </div>
</template>
<script lang="ts" setup>
  import { useAASCreationSubmission } from '../composables/useAASCreationSubmission'
  import { useAASCreationStore } from '../stores/aasCreationForm'

  const props = defineProps<{
    next: () => void
    prev: () => void
    finish: () => void
    isActiveComponent: boolean
  }>()

  const store = useAASCreationStore()

  const { submitAll } = useAASCreationSubmission()

  async function handleSubmit (): Promise<void> {
    if (!props.isActiveComponent) {
      return
    }
    const success = await submitAll()
    if (!success) {
      window.alert('Submission failed')
      return
    }

    window.alert('Submission was successful.')
    store.resetCreationState()
    props.finish()
  }
</script>
