<template>
  <template v-for="direction in directions" :key="direction.value">
    <v-list-item @click="select(direction.value, false)">
      <template #prepend><v-icon size="x-small">mdi-plus</v-icon></template>
      <v-list-item-subtitle>Add {{ direction.label }} Variable</v-list-item-subtitle>
    </v-list-item>

    <v-list-item @click="select(direction.value, true)">
      <template #prepend><v-icon size="x-small">mdi-code-json</v-icon></template>
      <v-list-item-subtitle>{{ direction.label }} Variable from JSON</v-list-item-subtitle>
    </v-list-item>
  </template>
</template>

<script setup lang="ts">
  import type { OperationVariableDirection } from '@/types/OperationTree'

  const props = defineProps<{
    operation: any
  }>()

  const emit = defineEmits<{
    add: [payload: { operation: any, direction: OperationVariableDirection, fromJson: boolean }]
  }>()

  const directions: Array<{ label: string, value: OperationVariableDirection }> = [
    { label: 'Input', value: 'inputVariables' },
    { label: 'In/Out', value: 'inoutputVariables' },
    { label: 'Output', value: 'outputVariables' },
  ]

  function select (direction: OperationVariableDirection, fromJson: boolean): void {
    emit('add', { operation: props.operation, direction, fromJson })
  }
</script>
