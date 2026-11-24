<template>
  <v-navigation-drawer class="leftMenu" color="appNavigation" :width="336">
    <v-card color="rgba(0,0,0,0)" elevation="0">
      <v-card-title class="px-0 py-2 d-flex align-center">
        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              class="ma-0"
              :disabled="reloadDisabled"
              icon="mdi-reload"
              v-bind="tooltipProps"
              :loading="listLoading"
              variant="plain"
              @click="emit('reload')"
            />
          </template>

          <span>{{ reloadTooltip }}</span>
        </v-tooltip>

        <!-- Next to the reload button, e.g. the search field -->
        <slot name="title" />
      </v-card-title>

      <!-- Optional selection below the title, e.g. a filter by asset type; the list gets less height then -->
      <slot name="filter" />

      <v-divider />

      <v-card-text
        class="pt-0 pb-0 px-2 overflow-y-auto"
        :style="{ height: $slots.filter ? EDC_FILTERED_LIST_HEIGHT : EDC_LIST_HEIGHT }"
      >
        <div v-if="listLoading">
          <v-skeleton-loader type="list-item@6" />
        </div>

        <template v-else>
          <v-list
            v-if="items.length > 0"
            class="pa-0"
            density="compact"
            nav
          >
            <v-virtual-scroll
              ref="virtualScroll"
              class="bg-card mb-2"
              :item-height="EDC_LIST_ITEM_HEIGHT"
              :items="items"
            >
              <template #default="{ item }">
                <EdcResourceListItem
                  :key="item['@id']"
                  :editable="editable"
                  :icon="icon"
                  :label="label"
                  :resource="item"
                  :selected="isSelected(item)"
                  @delete="emit('delete', item)"
                  @edit="emit('edit', item)"
                  @select="emit('select', item)"
                >
                  <template #title>
                    <slot :item="item" name="item-title" />
                  </template>

                  <template #subtitle>
                    <slot :item="item" name="item-subtitle" />
                  </template>

                  <template #tooltip>
                    <slot :item="item" name="item-tooltip" />
                  </template>
                </EdcResourceListItem>
              </template>
            </v-virtual-scroll>

            <!-- Next page, loaded when scrolling near the end of the list -->
            <v-progress-linear v-if="pageLoading" color="primary" indeterminate />
          </v-list>

          <!-- Without items, e.g. why the list could not be loaded -->
          <slot v-else name="empty" />
        </template>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  import type { EdcVirtualScroll } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPagedList'
  import EdcResourceListItem from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceListItem.vue'
  import { EDC_LIST_ITEM_HEIGHT } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPagedList'
  import { EDC_FILTERED_LIST_HEIGHT, EDC_LIST_HEIGHT } from '@/pages/modules/EclipseDataspaceConnector/data/heights'

  defineProps<{
    items: any[]
    listLoading: boolean
    pageLoading: boolean
    isSelected: (item: any) => boolean
    label: string // e.g. `Asset`, used in the menu texts of the items
    icon: string
    reloadTooltip: string
    reloadDisabled?: boolean
    editable?: boolean // Items offer Edit and Delete, only when the EDC BFF allows writes
  }>()

  const emit = defineEmits<{
    (event: 'reload'): void
    (event: 'select' | 'edit' | 'delete', item: any): void
  }>()

  // The `v-virtual-scroll` of the list, for `useEdcPagedList`
  defineExpose({ virtualScroll: useTemplateRef<EdcVirtualScroll>('virtualScroll') })
</script>
