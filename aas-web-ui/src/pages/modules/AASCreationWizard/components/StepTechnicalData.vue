<template>
  <div>test Technical Data Form</div>
  <div class="d-flex justify-space-between">
    <v-btn color="primary" @click="props.prev">Back</v-btn>
    <v-btn color="primary" @click="props.next">Next</v-btn>
  </div>
</template>
<script lang="ts" setup>
  const props = defineProps<{
    next: () => void
    prev: () => void
    isActiveComponent: boolean
  }>()
</script>
