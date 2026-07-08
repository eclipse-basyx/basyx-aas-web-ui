<template>
  <div>
    <v-sheet v-if="isLoading && descriptors.length === 0" class="pa-4" color="transparent">
      <v-skeleton-loader type="list-item-two-line@6" />
    </v-sheet>

    <v-empty-state
      v-else-if="descriptors.length === 0"
      class="text-divider"
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
      class="py-2 pe-2 ps-2"
      density="comfortable"
      nav
    >
      <DescriptorListItem
        v-for="descriptor in descriptors"
        :key="getDescriptorKey(descriptor)"
        :copy-json-icon="copyJsonIcon"
        :descriptor="descriptor"
        :read-only="readOnly"
        :selected="isSelectedDescriptor(descriptor)"
        @copy-json="emit('copy-json', $event)"
        @delete="emit('delete', $event)"
        @duplicate="emit('duplicate', $event)"
        @edit="emit('edit', $event)"
        @select="emit('select', $event)"
      />

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

      <div ref="loadMoreSentinel" class="descriptor-list-sentinel" />
    </v-list>
  </div>
</template>

<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { getDescriptorKey } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import DescriptorListItem from '@/pages/modules/CatenaXplorer/components/DescriptorListItem.vue'

  const props = defineProps<{
    copyJsonIcon: string
    descriptors: any[]
    hasMoreDescriptors?: boolean
    isLoadingMore?: boolean
    isLoading: boolean
    readOnly?: boolean
    selectedDescriptorId: string
  }>()

  const emit = defineEmits<{
    'copy-json': [descriptor: any]
    'delete': [descriptor: any]
    'duplicate': [descriptor: any]
    'edit': [descriptor: any]
    'load-more': []
    'select': [descriptor: any]
  }>()

  const loadMoreSentinel = ref<HTMLElement | null>(null)
  let loadMoreObserver: IntersectionObserver | null = null

  onMounted(() => {
    initializeLoadMoreObserver()
  })

  onBeforeUnmount(() => {
    disconnectLoadMoreObserver()
  })

  watch(
    () => [
      props.hasMoreDescriptors,
      props.isLoading,
      props.isLoadingMore,
      props.descriptors.length,
    ],
    () => {
      initializeLoadMoreObserver()
    },
    { flush: 'post' },
  )

  function isSelectedDescriptor (descriptor: any): boolean {
    return props.selectedDescriptorId === descriptor?.id
  }

  function initializeLoadMoreObserver (): void {
    disconnectLoadMoreObserver()

    if (!props.hasMoreDescriptors || typeof IntersectionObserver === 'undefined') {
      return
    }

    const sentinel = loadMoreSentinel.value
    if (!sentinel) {
      return
    }

    loadMoreObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        requestLoadMore()
      }
    }, { rootMargin: '160px' })
    loadMoreObserver.observe(sentinel)
  }

  function disconnectLoadMoreObserver (): void {
    loadMoreObserver?.disconnect()
    loadMoreObserver = null
  }

  function requestLoadMore (): void {
    if (!props.hasMoreDescriptors || props.isLoadingMore || props.isLoading) return

    emit('load-more')
  }
</script>

<style scoped>
.descriptor-list-sentinel {
  height: 1px;
}
</style>
