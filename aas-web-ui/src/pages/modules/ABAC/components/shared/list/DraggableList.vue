<template>
  <div v-show="modelValue.length > 0" ref="root">
    <VueDraggable
      :animation="150"
      class="abac-sortable-list d-flex flex-column ga-3"
      direction="vertical"
      :disabled="disabled || modelValue.length < 2"
      fallback-class="abac-drag-preview"
      :fallback-on-body="true"
      :force-fallback="true"
      ghost-class="abac-drag-placeholder"
      handle=".abac-drag-handle"
      :model-value="modelValue"
      @choose="onChoose"
      @end="onDragEnd"
      @start="onDragStart"
      @unchoose="onDragEnd"
      @update:model-value="onUpdate"
    >
      <div v-for="({ item, key }, index) in rows" :key="key" class="abac-sortable-row" :class="{ border }">
        <div class="abac-sortable-header d-flex ga-2" :class="{ 'pe-2 py-2': border, 'abac-sortable-header--fields': !collapsible, 'align-center': collapsible, 'align-start': !collapsible }">
          <div class="flex-grow-1" style="min-width: 0">
            <slot :expanded="!collapsedRows.has(key)" :index="index" :item="item" :toggle="() => toggleRow(key)" />
          </div>

          <div v-if="collapsible || $slots.actions || $slots['after-actions'] || (!disabled && modelValue.length > 1)" class="abac-row-actions d-flex align-center ga-1">
            <slot :index="index" :item="item" name="actions" />

            <button
              v-if="!disabled && modelValue.length > 1"
              :aria-label="t('forms.list.reorder')"
              class="abac-drag-handle cursor-grab d-inline-flex align-center justify-center pa-2 border-0 bg-transparent"
              type="button"
              @keydown.down.stop.prevent="onMove(index, 1)"
              @keydown.up.stop.prevent="onMove(index, -1)"
            >
              <v-icon :icon="ICONS.DRAG" />
              <v-tooltip v-if="!dragging" activator="parent" location="top" open-delay="600">{{ t('shared.list.reorderHint') }}</v-tooltip>
            </button>

            <slot :index="index" :item="item" name="after-actions" />

            <v-btn
              v-if="collapsible"
              :aria-expanded="!collapsedRows.has(key)"
              :aria-label="t(collapsedRows.has(key) ? 'forms.list.expand' : 'forms.list.collapse')"
              :icon="collapsedRows.has(key) ? ICONS.EXPAND : ICONS.COLLAPSE"
              size="small"
              variant="text"
              @click="toggleRow(key)"
            />
          </div>
        </div>

        <div v-if="collapsible" v-show="!collapsedRows.has(key)">
          <slot
            :expanded="!collapsedRows.has(key)"
            :index="index"
            :item="item"
            name="body"
            :opened="openedRows.has(key) || !collapsedRows.has(key)"
          />
        </div>

        <slot
          v-else
          :expanded="true"
          :index="index"
          :item="item"
          name="body"
          :opened="true"
        />
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts" generic="T">
  import type { DraggableEvent } from 'vue-draggable-plus'
  import { VueDraggable } from 'vue-draggable-plus'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'

  const ICONS = {
    DRAG: 'mdi-drag',
    EXPAND: 'mdi-chevron-down',
    COLLAPSE: 'mdi-chevron-up',
  } as const

  const modelValue = defineModel<T[]>({ required: true })
  const props = defineProps<{
    border?: boolean
    /** Show a collapse control for each row's body. */
    collapsible?: boolean
    initiallyCollapsed?: boolean
    /** Pass a fresh object after each explicit Add action to expand that row. */
    expandRequest?: { index: number }
    disabled?: boolean
    itemKey?: (item: T) => unknown
  }>()
  const root = ref<HTMLElement>()
  const dragging = ref(false)
  const collapsedRows = ref(new Set<symbol>())
  const openedRows = ref(new Set<symbol>())
  let reorderedKeys: symbol[] | undefined
  let draggedItem: HTMLElement | undefined
  let previousBackground = ''
  const { t } = useAbacI18n()

  // Reuse each row's key across reorders; duplicate values get separate keys.
  const rows = computed<Array<{ item: T, identity: unknown, key: symbol }>>(previous => {
    const identities = modelValue.value.map(item => toRaw(props.itemKey ? props.itemKey(item) : item))
    // A content-only reorder keeps duplicate occurrence order. Ordinary edits
    // reserve unchanged positions so a duplicate cannot steal the edited key.
    const remainingCounts = new Map<unknown, number>()
    for (const row of previous ?? []) remainingCounts.set(row.identity, (remainingCounts.get(row.identity) ?? 0) + 1)
    const sameContents = previous?.length === identities.length && identities.every(identity => {
      const count = remainingCounts.get(identity) ?? 0
      remainingCounts.set(identity, count - 1)
      return count > 0
    })
    const explicitKeys = reorderedKeys
    reorderedKeys = undefined
    const matched = identities.map((identity, index) => ({
      item: modelValue.value[index]!, identity,
      // Reserve unchanged positions before matching duplicates elsewhere.
      key: explicitKeys?.[index] ?? (!sameContents && previous?.[index]?.identity === identity ? previous?.[index]?.key : undefined),
    }))
    const usedKeys = new Set(matched.map(row => row.key))
    const availableKeys = new Map<unknown, symbol[]>()
    for (const row of previous ?? []) {
      if (usedKeys.has(row.key)) continue
      const keys = availableKeys.get(row.identity) ?? []
      keys.push(row.key)
      availableKeys.set(row.identity, keys)
    }
    for (const row of matched) {
      if (row.key) continue
      row.key = availableKeys.get(row.identity)?.shift()
      if (row.key) usedKeys.add(row.key)
    }
    return matched.map((row, index) => {
      // An immutable edit replaces the value but keeps the row and its focus.
      const previousKey = previous?.length === matched.length ? previous?.[index]?.key : undefined
      const key = row.key ?? (previousKey && !usedKeys.has(previousKey) ? previousKey : Symbol())
      usedKeys.add(key)
      return { ...row, key }
    })
  })

  watch(rows, (currentRows, previousRows) => {
    const keys = new Set(currentRows.map(row => row.key))
    const previousKeys = new Set(previousRows?.map(row => row.key))
    for (const key of collapsedRows.value) {
      if (!keys.has(key)) collapsedRows.value.delete(key)
    }
    for (const key of openedRows.value) {
      if (!keys.has(key)) openedRows.value.delete(key)
    }
    if (props.initiallyCollapsed) {
      for (const key of keys) {
        if (!previousKeys.has(key)) collapsedRows.value.add(key)
      }
    }
  }, { immediate: true, flush: 'sync' })

  watch(() => props.expandRequest, request => {
    const row = request && rows.value[request.index]
    if (row) {
      openedRows.value.add(row.key)
      collapsedRows.value.delete(row.key)
    }
  }, { flush: 'post' })

  onBeforeUnmount(onDragEnd)

  function toggleRow (key: symbol): void {
    openedRows.value.add(key)
    if (collapsedRows.value.has(key)) collapsedRows.value.delete(key)
    else collapsedRows.value.add(key)
  }

  /**
   * Match the floating clone to its nearest opaque parent before Sortable clones it.
   */
  function onChoose ({ item }: DraggableEvent): void {
    dragging.value = true
    draggedItem = item
    previousBackground = item.style.backgroundColor
    for (let parent = item.parentElement; parent; parent = parent.parentElement) {
      const background = getComputedStyle(parent).backgroundColor
      if (background !== 'transparent' && background !== 'rgba(0, 0, 0, 0)') {
        item.style.backgroundColor = background
        break
      }
    }
  }

  function onDragEnd (): void {
    document.removeEventListener('pointermove', onOutsideMove)
    document.removeEventListener('mousemove', onOutsideMove)
    document.removeEventListener('touchmove', onOutsideMove)
    if (draggedItem) draggedItem.style.backgroundColor = previousBackground
    draggedItem = undefined
    dragging.value = false
  }

  function onDragStart (): void {
    document.addEventListener('pointermove', onOutsideMove)
    document.addEventListener('mousemove', onOutsideMove)
    document.addEventListener('touchmove', onOutsideMove, { passive: true })
  }

  function onOutsideMove (event: MouseEvent | TouchEvent): void {
    const item = draggedItem
    const list = item?.parentElement
    if (!item || !list || props.disabled) return
    const point = 'touches' in event ? event.touches[0] : event
    if (!point) return
    const { left, right } = list.getBoundingClientRect()
    if (point.clientX >= left && point.clientX <= right) return

    // Sortable hit-tests the pointer in two dimensions. Outside the list's
    // width, move its placeholder by height and let Sortable commit on drop.
    const siblings = Array.from(list.children).filter((child): child is HTMLElement =>
      child instanceof HTMLElement && child !== item && child.matches('.abac-sortable-row'),
    )
    const next = siblings.find(sibling => {
      const bounds = sibling.getBoundingClientRect()
      return point.clientY < bounds.top + bounds.height / 2
    }) ?? null
    if (item.nextElementSibling === next) return
    if (next) next.before(item)
    else list.append(item)
  }

  function onUpdate (items: T[]): void {
    // Reorder events provide object identity even when content is identical.
    const keys = new Map<unknown, symbol[]>()
    for (const row of rows.value) {
      const item = toRaw(row.item)
      const matches = keys.get(item) ?? []
      matches.push(row.key)
      keys.set(item, matches)
    }
    reorderedKeys = items.map(item => keys.get(toRaw(item))?.shift() ?? Symbol())
    modelValue.value = items
  }

  async function onMove (index: number, direction: -1 | 1): Promise<void> {
    const target = index + direction
    if (target < 0 || target >= modelValue.value.length) return
    const items = [...modelValue.value]
    const [item] = items.splice(index, 1)
    items.splice(target, 0, item!)
    onUpdate(items)
    await nextTick()
    root.value?.querySelectorAll<HTMLButtonElement>(':scope > .abac-sortable-list > .abac-sortable-row > .abac-sortable-header > .abac-row-actions > .abac-drag-handle')[target]?.focus()
  }
</script>

<style scoped>
  /* Align entry actions with the input rather than its variable-height messages. */
  .abac-sortable-header--fields > .abac-row-actions {
    min-height: 48px;
  }

  /* Give entry inputs the full row width before placing actions on mobile. */
  @media (max-width: 600px) {
    .abac-sortable-header--fields {
      flex-wrap: wrap;
    }

    .abac-sortable-header--fields > div:first-child {
      flex-basis: 100%;
    }

    .abac-sortable-header--fields > .abac-row-actions {
      margin-inline-start: auto;
    }
  }

  /* Sortable sets opacity: 0.8 inline on its floating clone. */
  :global(.abac-drag-preview) {
    opacity: 1 !important;
    box-shadow: 0 8px 24px rgb(0 0 0 / 35%);
  }

  /* Keep the original row's dimensions without showing a duplicate. */
  :global(.abac-drag-placeholder) {
    opacity: 0 !important;
  }
</style>
