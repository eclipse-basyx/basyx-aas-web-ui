<template>
  <v-card border flat>
    <v-card-title class="d-flex align-center">
      {{ title }}
      <v-chip class="ml-2" size="small">{{ principals.length }}</v-chip>
    </v-card-title>

    <v-card-subtitle class="text-wrap text-break">{{ description }}</v-card-subtitle>

    <v-card-text>
      <v-list
        v-if="principals.length > 0"
        border
        class="mb-4"
        density="compact"
        rounded
      >
        <v-list-item v-for="(principal, index) in principals" :key="accessPrincipalKey(principal)">
          <v-list-item-title>{{ principal.subject }} <v-chip v-if="principal.type === 'group'" size="small">Group</v-chip></v-list-item-title>
          <v-list-item-subtitle>{{ principal.issuer }}</v-list-item-subtitle>

          <template #append>
            <v-btn
              :aria-label="`Remove ${accessPrincipalLabel(principal)}`"
              :disabled="loading || (required && principals.length === 1)"
              icon="mdi-delete-outline"
              size="small"
              :title="required && principals.length === 1 ? 'At least one owner must remain' : 'Remove person or group'"
              variant="text"
              @click="remove(index)"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-alert v-else density="compact" type="info" variant="tonal">No {{ title.toLowerCase() }} added yet.</v-alert>
      <p class="text-body-2 text-medium-emphasis my-3">Add or remove people or groups, then save your changes below.</p>
      <PrincipalInput :current-principal="currentPrincipal" :disabled="loading" @add="add" />
    </v-card-text>

    <v-card-actions>
      <v-spacer />

      <v-btn
        color="primary"
        :disabled="required && principals.length === 0"
        :loading="loading"
        variant="flat"
        @click="$emit('save')"
      >
        Save {{ title.toLowerCase() }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  import type { AccessPrincipal } from '@/types/ResourceAccess'
  import { accessPrincipalKey, accessPrincipalLabel } from '@/utils/AccessPrincipal'

  const props = defineProps<{
    title: string
    description: string
    currentPrincipal?: AccessPrincipal
    required?: boolean
    loading?: boolean
  }>()

  defineEmits<{
    save: []
  }>()

  const principals = defineModel<AccessPrincipal[]>({ required: true })

  function add (principal: AccessPrincipal): void {
    const exists = principals.value.some(item => accessPrincipalKey(item) === accessPrincipalKey(principal))
    if (!exists) principals.value = [...principals.value, principal]
  }

  function remove (index: number): void {
    if (props.required && principals.value.length === 1) return
    principals.value = principals.value.filter((_, itemIndex) => itemIndex !== index)
  }
</script>
