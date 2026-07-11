<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="endpointsArray && Array.isArray(endpointsArray) && endpointsArray.length > 0">
      <!-- Endpoints Title -->
      <template #title>
        <div class="mt-1" :class="small ? 'text-body-small' : 'text-title-small '">
          {{ endpointsTitle + ':' }}
        </div>
      </template>
      <!-- Endpoints List -->
      <v-list-item-subtitle v-for="(endpoint, i) in endpointsArray" :key="i">
        <v-hover v-slot="{ isHovering, props }">
          <div class="d-flex align-center flex-wrap pt-2" v-bind="props">
            <v-chip border class="mr-2 mb-1" label size="x-small">{{
              endpoint?.interface ? endpoint.interface : 'no-interface'
            }}</v-chip>

            <v-chip
              v-if="endpoint?.protocolInformation?.endpointProtocol"
              border
              class="mr-2 mb-1"
              color="secondary"
              label
              size="x-small"
            >
              {{ endpoint.protocolInformation.endpointProtocol }}
            </v-chip>

            <a
              v-if="endpoint?.protocolInformation?.href"
              class="text-body-small mb-1"
              :href="endpoint.protocolInformation.href"
              rel="noopener noreferrer"
              target="_blank"
              @click.stop
            >
              {{ endpoint.protocolInformation.href }}
            </a>

            <v-icon
              v-if="isHovering && endpoint?.protocolInformation?.href"
              class="ml-2 mb-1 cursor-pointer"
              color="subtitleText"
              size="x-small"
              @click="copyToClipboard(endpoint.protocolInformation.href, 'Href', getCopyIconRef(i))"
            >
              {{ copyIcons[i] || 'mdi-clipboard-file-outline' }}
            </v-icon>
          </div>
        </v-hover>
      </v-list-item-subtitle>
    </v-list-item>
  </v-container>
</template>

<script lang="ts" setup>
  import type { Ref } from 'vue'
  import { ref } from 'vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'

  // Composables
  const { copyToClipboard } = useClipboardUtil()

  // Props
  defineProps({
    endpointsArray: {
      type: Array<any>,
      default: [] as Array<any>,
    },
    endpointsTitle: {
      type: String,
      default: 'Endpoints',
    },
    small: {
      type: Boolean,
      default: false,
    },
  })

  // Data
  const copyIcons = ref<Record<number, string>>({})

  // Methods
  function getCopyIconRef (index: number): Ref<string> {
    return computed({
      get: () => copyIcons.value[index] || 'mdi-clipboard-file-outline',
      set: (val: string) => {
        copyIcons.value[index] = val
      },
    }) as unknown as Ref<string>
  }
</script>
