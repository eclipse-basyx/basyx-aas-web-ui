<template>
  <v-sheet
    :border="!flat"
    class="d-flex flex-column flex-grow-1 overflow-hidden"
    :rounded="flat ? false : 'lg'"
    style="min-height: 0; height: 100%"
  >
    <div class="px-4 py-3 d-flex align-center justify-space-between ga-2">
      <div class="text-h6">AAS Descriptors</div>

      <div class="d-flex align-center ga-2">
        <v-chip size="small" variant="tonal">{{ descriptorStats.descriptorCount }} descriptors</v-chip>

        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              border
              color="surface-light"
              :disabled="!copiedDescriptorAvailable"
              icon="mdi-file-document-multiple-outline"
              rounded="lg"
              size="x-small"
              variant="flat"
              @click="emit('paste')"
            />
          </template>

          <span>Paste copied descriptor</span>
        </v-tooltip>

        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              class="text-buttonText"
              color="primary"
              icon="mdi-plus"
              rounded="lg"
              size="x-small"
              variant="flat"
              @click="emit('create')"
            />
          </template>

          <span>Create descriptor</span>
        </v-tooltip>

        <v-tooltip v-if="showCloseButton" location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon="mdi-close"
              size="small"
              variant="text"
              @click="emit('close')"
            />
          </template>

          <span>Close descriptors</span>
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
      style="min-height: 0; height: 0"
      @scroll.passive="handleDescriptorListScroll"
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

              <v-sheet border rounded="lg">
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
                </v-list>
              </v-sheet>
            </v-menu>
          </div>
        </template>
      </v-list-item>

      <v-list-item
        v-if="isLoadingMore"
        class="px-4 py-1"
        density="compact"
      >
        <template #prepend>
          <v-progress-circular class="mr-2" indeterminate size="16" width="2" />
        </template>

        <v-list-item-subtitle class="text-medium-emphasis ml-1">
          Loading more descriptors...
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item
        v-else-if="hasMoreDescriptors"
        class="px-4 py-1"
        density="compact"
      >
        <v-list-item-subtitle class="text-medium-emphasis">
          Scroll down to load more descriptors.
        </v-list-item-subtitle>

        <template #append>
          <v-btn
            size="small"
            variant="text"
            @click.stop="emit('load-more')"
          >
            Load more
          </v-btn>
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
    flat?: boolean
    hasMoreDescriptors?: boolean
    isLoadingMore?: boolean
    isLoading: boolean
    selectedDescriptorId: string
    showCloseButton?: boolean
  }>()

  const emit = defineEmits<{
    'close': []
    'copy': [descriptor: any]
    'copy-json': [descriptor: any]
    'create': []
    'delete': [descriptor: any]
    'edit': [descriptor: any]
    'load-more': []
    'paste': []
    'select': [descriptor: any]
  }>()

  const scrollLoadThreshold = 160
  const descriptorStats = computed(() => getDescriptorStats(props.descriptors))

  function isSelectedDescriptor (descriptor: any): boolean {
    return props.selectedDescriptorId === descriptor?.id
  }

  function handleDescriptorListScroll (event: Event): void {
    if (!props.hasMoreDescriptors || props.isLoadingMore || props.isLoading) {
      return
    }

    const element = event.target
    if (!(element instanceof HTMLElement)) {
      return
    }

    const remainingDistance = element.scrollHeight - element.scrollTop - element.clientHeight
    if (remainingDistance <= scrollLoadThreshold) {
      emit('load-more')
    }
  }
</script>
