<template>
  <DraggableList
    v-model="modelValue"
    border
    collapsible
    :disabled="disabled"
    :expand-request="expandRequest"
    initially-collapsed
    :item-key="itemKey"
  >
    <template #default="{ item, index, expanded, toggle }">
      <button
        :aria-expanded="expanded"
        class="d-flex align-center text-start w-100 pa-3 text-title-small bg-transparent border-0"
        type="button"
        @click="toggle"
      >
        <slot :index="index" :item="item" />
      </button>
    </template>

    <template #actions="{ item, index }">
      <slot :index="index" :item="item" name="help" />
      <slot :index="index" :item="item" name="actions" />
    </template>

    <template #body="{ item, index, opened }">
      <template v-if="opened">
        <v-divider />

        <div class="pa-4">
          <slot :index="index" :item="item" name="body" />
        </div>
      </template>
    </template>
  </DraggableList>
</template>

<script setup lang="ts" generic="T">
  import DraggableList from './DraggableList.vue'

  const { disabled = false, itemKey = (item: T) => JSON.stringify(item) } = defineProps<{
    disabled?: boolean
    /** Expand only the row created by an explicit Add action. */
    expandRequest?: { index: number }
    /** Match unchanged documents even when form decoding recreates their objects. */
    itemKey?: (item: T) => unknown
  }>()
  const modelValue = defineModel<T[]>({ required: true })
</script>
