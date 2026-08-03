<script setup lang="ts">
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { hasContent } from '@/utils/StringUtils'
  import { DEFAULT_COPY_ICON } from '../../constants/icons'
  import { hasItems } from '../../utils/array'

  const { value, title } = defineProps<{ value?: null | string | string[], title: string, hideDivider?: boolean }>()

  // Normalize value list
  const valueList = computed<string[]>(() => {
    if (!value) return []

    if (Array.isArray(value)) return value

    return [value]
  })

  const { copyToClipboard } = useClipboardUtil()
  const copyIcon = ref<string>(DEFAULT_COPY_ICON)

  function onCopy (item: string): void {
    if (hasContent(item)) {
      copyToClipboard(item, title, copyIcon)
    }
  }

</script>

<template>
  <v-list-item v-if="hasItems(valueList)">
    <v-list-item-title class="text-title-small">
      {{ title }}:
    </v-list-item-title>

    <div class="d-flex flex-column ga-2 pt-1 pb-2">

      <v-list-item-subtitle v-for="(item) in valueList" :key="item">
        <v-hover v-slot="{ isHovering, props }">
          <span
            v-bind="props"
            :class="isHovering ? 'cursor-pointer' : ''"
            @click="onCopy(item)"
          >
            <v-icon v-if="isHovering" class="mr-1" color="subtitleText" size="x-small">{{
              copyIcon
            }}</v-icon>

            <span>{{ item }}</span>
          </span>
        </v-hover>
      </v-list-item-subtitle>
    </div>

    <v-divider v-if="!hideDivider" />
  </v-list-item>

</template>
