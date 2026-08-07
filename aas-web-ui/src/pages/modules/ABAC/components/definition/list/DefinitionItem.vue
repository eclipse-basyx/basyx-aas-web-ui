<script setup lang="ts">
  import type { Definition, DefinitionKind } from '@/composables/Client/ABAC/types/definitions'
  import { useTheme } from 'vuetify'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'

  const { definition, loading } = defineProps<{ definition?: Definition, kind?: DefinitionKind, loading?: boolean }>()

  const theme = useTheme()
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)

  const { selectedDefinitionName, onSelectDefinition } = useAbacNavigation()
  const isSelected = computed(() => selectedDefinitionName.value?.toString() === definition?.name?.toString())

</script>

<template>
  <v-list-item
    v-if="loading"
    class="mt-2 mx-2 pa-0"
    color="primarySurface"
    :style="{
      'border': '1px solid',
      'border-color': isDark ? '#686868 !important' : '#ABABAB !important',
    }"
  >
    <v-skeleton-loader type="text" />
  </v-list-item>

  <v-list-item
    v-else-if="definition && kind"
    :active="isSelected"
    base-color="listItem"
    :border="isSelected ? 'primary' : 'listItem thin'"
    class="mt-2 mx-2"
    color="primarySurface"
    :style="{
      'border': '1px solid',
      'border-color': isSelected
        ? primaryColor + ' !important'
        : isDark ? '#686868 !important' : '#ABABAB !important',
    }"
    variant="tonal"
    @click="onSelectDefinition(definition.name, kind)"
  >
    <v-list-item-title class="d-flex align-center text-primary">
      {{ definition.name }}

    </v-list-item-title>
  </v-list-item>

</template>
