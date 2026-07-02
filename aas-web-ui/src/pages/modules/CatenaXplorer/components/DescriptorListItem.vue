<template>
  <v-list-item
    :active="selected"
    border
    class="mb-2"
    color="primary"
    rounded="lg"
    :variant="selected ? 'tonal' : 'flat'"
    @click="emit('select', descriptor)"
  >
    <template #prepend>
      <v-avatar color="primary" size="32" variant="tonal">
        <v-icon icon="mdi-cube-scan" size="18" />
      </v-avatar>
    </template>

    <v-list-item-title class="text-body-medium text-break">
      {{ getDescriptorTitle(descriptor) }}
    </v-list-item-title>

    <v-list-item-subtitle class="text-caption text-break">
      {{ descriptor.id }}
    </v-list-item-subtitle>

    <template #append>
      <div class="d-flex align-center ga-1">
        <v-chip
          v-if="getDescriptorLastUpdatedAt(descriptor)"
          prepend-icon="mdi-calendar-clock-outline"
          size="x-small"
          variant="tonal"
        >
          {{ formatDateTime(getDescriptorLastUpdatedAt(descriptor)) }}
        </v-chip>

        <v-menu :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              aria-label="Descriptor actions"
              icon="mdi-dots-vertical"
              size="small"
              variant="plain"
              @click.stop
            />
          </template>

          <v-sheet border rounded="lg">
            <v-list class="py-0" density="compact" slim>
              <v-list-item @click.stop="emit('edit', descriptor)">
                <template #prepend>
                  <v-icon size="x-small">mdi-pencil</v-icon>
                </template>

                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>

              <v-list-item @click.stop="emit('delete', descriptor)">
                <template #prepend>
                  <v-icon size="x-small">mdi-delete</v-icon>
                </template>

                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item @click.stop="emit('copy', descriptor)">
                <template #prepend>
                  <v-icon size="x-small">mdi-clipboard-outline</v-icon>
                </template>

                <v-list-item-title>Copy</v-list-item-title>
              </v-list-item>

              <v-list-item @click.stop="emit('copy-json', descriptor)">
                <template #prepend>
                  <v-icon size="x-small">{{ copyJsonIcon }}</v-icon>
                </template>

                <v-list-item-title>Copy as JSON</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-sheet>
        </v-menu>
      </div>
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
  import {
    formatDateTime,
    getDescriptorLastUpdatedAt,
    getDescriptorTitle,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  defineProps<{
    copyJsonIcon: string
    descriptor: any
    selected: boolean
  }>()

  const emit = defineEmits<{
    'copy': [descriptor: any]
    'copy-json': [descriptor: any]
    'delete': [descriptor: any]
    'edit': [descriptor: any]
    'select': [descriptor: any]
  }>()
</script>
