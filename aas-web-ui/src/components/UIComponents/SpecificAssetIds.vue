<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="specificAssetIds && Array.isArray(specificAssetIds) && specificAssetIds.length > 0">
      <template #title>
        <div class="mt-1 mb-2 text-title-small">
          {{ 'Specific Asset IDs:' }}
        </div>
      </template>
      <div v-for="(specificAssetId, index) in specificAssetIds" :key="index">
        <div class="px-2">
          <v-list-item-title>
            <v-hover v-slot="{ isHovering, props }">
              <div
                v-bind="props"
                class="text-body-small"
                :class="isHovering ? 'cursor-pointer' : ''"
                @click="
                  copyToClipboard(specificAssetId.value, specificAssetId.name, getCopyIconAsRef())
                "
              >
                <span class="text-title-small">{{ specificAssetId.name + ': ' }}</span>
                <v-icon
                  v-if="isHovering"
                  class="mr-1"
                  color="subtitleText"
                  size="x-small"
                >mdi-clipboard-file-outline</v-icon>
                <span>{{ specificAssetId.value }}</span>
              </div>
            </v-hover>
          </v-list-item-title>
          <SemanticID
            v-if="
              Array.isArray(specificAssetId?.semanticId?.keys) &&
                specificAssetId.semanticId.keys.length > 0
            "
            :semantic-id-object="specificAssetId.semanticId"
            :semantic-title="specificAssetId.semanticId.keys.length > 0 ? 'Semantic IDs' : 'Semantic ID:'"
            :small="true"
          />
        </div>
        <v-divider v-if="index < specificAssetIds.length - 1" class="my-2" />
      </div>
    </v-list-item>
  </v-container>
</template>

<script setup lang="ts">
  import type { Ref } from 'vue'
  import { ref } from 'vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'

  // Composables
  const { copyToClipboard } = useClipboardUtil()

  // Props
  defineProps({
    specificAssetIds: {
      type: Array<any>,
      default: [] as Array<any>,
    },
  })

  // Data
  const copyIcon = ref<string>('mdi-clipboard-file-outline')
  function getCopyIconAsRef (): Ref {
    return copyIcon
  }
</script>
