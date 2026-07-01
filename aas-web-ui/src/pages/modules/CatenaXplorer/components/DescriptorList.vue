<template>
  <v-sheet
    border
    class="d-flex flex-column flex-grow-1 overflow-hidden"
    rounded="lg"
    style="min-height: 0"
  >
    <div class="px-4 py-3 d-flex align-center justify-space-between ga-2">
      <div class="text-h6">AAS Descriptors</div>

      <div class="d-flex align-center ga-2">
        <v-chip size="small" variant="tonal">{{ descriptorStats.descriptorCount }} descriptors</v-chip>

        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              icon="mdi-plus"
              size="small"
              variant="tonal"
              @click="emit('create')"
            />
          </template>

          <span>Create descriptor</span>
        </v-tooltip>
      </div>
    </div>

    <v-divider />

    <v-sheet v-if="isLoading && descriptors.length === 0" class="pa-4" color="transparent">
      <v-skeleton-loader type="list-item-two-line@6" />
    </v-sheet>

    <v-empty-state
      v-else-if="descriptors.length === 0"
      class="text-divider flex-grow-1"
      icon="mdi-database-off-outline"
      text="No AAS descriptors found."
      title="No descriptors"
    >
      <template #media>
        <v-icon size="56" />
      </template>
    </v-empty-state>

    <v-list
      v-else
      class="pa-2 overflow-y-auto flex-grow-1"
      density="comfortable"
      nav
      style="min-height: 0"
    >
      <v-list-item
        v-for="descriptor in descriptors"
        :key="getDescriptorKey(descriptor)"
        :active="isSelectedDescriptor(descriptor)"
        border
        class="mb-2"
        color="primary"
        rounded="lg"
        :variant="isSelectedDescriptor(descriptor) ? 'tonal' : 'flat'"
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
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="plain"
                  @click.stop
                />
              </template>

              <v-sheet border>
                <v-list class="py-0" density="compact" slim>
                  <v-list-item @click.stop="emit('edit', descriptor)">
                    <template #prepend>
                      <v-icon size="x-small">mdi-pencil</v-icon>
                    </template>

                    <v-list-item-subtitle>Edit</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item @click.stop="emit('delete', descriptor)">
                    <template #prepend>
                      <v-icon size="x-small">mdi-delete</v-icon>
                    </template>

                    <v-list-item-subtitle>Delete</v-list-item-subtitle>
                  </v-list-item>

                  <v-divider />

                  <v-list-item @click.stop="emit('copy', descriptor)">
                    <template #prepend>
                      <v-icon size="x-small">mdi-clipboard-outline</v-icon>
                    </template>

                    <v-list-item-subtitle>Copy</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item @click.stop="emit('copy-json', descriptor)">
                    <template #prepend>
                      <v-icon size="x-small">{{ copyJsonIcon }}</v-icon>
                    </template>

                    <v-list-item-subtitle>Copy as JSON</v-list-item-subtitle>
                  </v-list-item>

                  <v-divider />

                  <v-list-item :disabled="!copiedDescriptorAvailable" @click.stop="emit('paste')">
                    <template #prepend>
                      <v-icon size="x-small">mdi-file-document-multiple-outline</v-icon>
                    </template>

                    <v-list-item-subtitle>Paste</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-sheet>
            </v-menu>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import {
    formatDateTime,
    getDescriptorKey,
    getDescriptorLastUpdatedAt,
    getDescriptorStats,
    getDescriptorTitle,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  const props = defineProps<{
    copiedDescriptorAvailable: boolean
    copyJsonIcon: string
    descriptors: any[]
    isLoading: boolean
    selectedDescriptorId: string
  }>()

  const emit = defineEmits<{
    'copy': [descriptor: any]
    'copy-json': [descriptor: any]
    'create': []
    'delete': [descriptor: any]
    'edit': [descriptor: any]
    'paste': []
    'select': [descriptor: any]
  }>()

  const descriptorStats = computed(() => getDescriptorStats(props.descriptors))

  function isSelectedDescriptor (descriptor: any): boolean {
    return props.selectedDescriptorId === descriptor?.id
  }
</script>
