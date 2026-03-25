<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="identificationObject && Object.keys(identificationObject).length > 0">
      <!-- Tooltip with ID and idShort -->
      <div>
        <div class="d-flex justify-space-between align-center">
          <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
            <div
              v-if="
                identificationObject?.id &&
                  !['SubmodelElementCollection', 'SubmodelElementList', 'Entity'].includes(
                    identificationObject.modelType
                  )
              "
              class="text-body-small"
            >
              <span class="font-weight-bold">{{ identificationTitle + ': ' }}</span>{{ identificationObject['id'] }}
            </div>
            <div
              v-if="
                identificationObject?.idShort &&
                  (!identificationObject?.modelType || identificationObject.modelType !== 'Asset')
              "
              class="text-body-small"
            >
              <span class="font-weight-bold">{{ idShortTitle + ': ' }}</span>{{ identificationObject['idShort'] }}
            </div>
          </v-tooltip>
          <template v-if="identificationObject.modelType !== 'ConceptDescription'">
            <v-list-item-title>
              <div class="text-primary text-body-large">
                {{ nameToDisplay(identificationObject) }}
              </div>
            </v-list-item-title>
            <!-- modelType -->
            <v-chip v-if="vChipContent" color="primary" size="x-small">{{ vChipContent }}</v-chip>
            <v-chip
              v-else-if="identificationObject?.modelType && identificationObject.modelType.trim() !== ''"
              color="primary"
              size="x-small"
            >
              {{ identificationObject.modelType }}
            </v-chip>
          </template>
        </div>
        <!-- ID -->
        <v-hover v-slot="{ isHovering, props }">
          <v-list-item
            v-if="
              identificationObject?.id &&
                !['SubmodelElementCollection', 'SubmodelElementList', 'Entity'].includes(
                  identificationObject.modelType
                )
            "
            class="pa-0 mt-n2"
            :class="
              identificationObject?.idShort &&
                (!identificationObject?.modelType || identificationObject.modelType !== 'Asset')
                ? 'mb-n4'
                : 'mb-n2'
            "
          >
            <v-list-item-title>
              <div>
                {{ identificationTitle + ':' }}
              </div>
            </v-list-item-title>
            <v-list-item-subtitle>
              <span
                v-bind="props"
                :class="isHovering ? 'cursor-pointer' : ''"
                @click="
                  copyToClipboard(identificationObject.id, identificationTitle, getCopyIconAsRef())
                "
              >
                <v-icon v-if="isHovering" class="mr-1" color="subtitleText" size="x-small">{{
                  copyIcon
                }}</v-icon>
                <span>{{ identificationObject.id }}</span>
              </span>
            </v-list-item-subtitle>
          </v-list-item>
        </v-hover>
        <!-- idShort -->
        <v-hover v-slot="{ isHovering, props }">
          <v-list-item
            v-if="
              identificationObject?.idShort &&
                (!identificationObject?.modelType || identificationObject.modelType !== 'Asset')
            "
            class="pa-0 mb-0 mt-n2 mb-n2"
          >
            <v-list-item-title>
              <div>{{ idShortTitle + ':' }}</div>
            </v-list-item-title>
            <v-list-item-subtitle>
              <span
                v-bind="props"
                :class="isHovering ? 'cursor-pointer' : ''"
                @click="
                  copyToClipboard(identificationObject.idShort, idShortTitle, getCopyIconAsRef())
                "
              >
                <v-icon v-if="isHovering" class="mr-1" color="subtitleText" size="x-small">{{
                  copyIcon
                }}</v-icon>
                <span>{{ identificationObject.idShort }}</span>
              </span>
            </v-list-item-subtitle>
          </v-list-item>
        </v-hover>
      </div>
    </v-list-item>
  </v-container>
</template>

<script setup lang="ts">
  import type { Ref } from 'vue'
  import { ref } from 'vue'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'

  // Composables
  const { nameToDisplay } = useReferableUtils()
  const { copyToClipboard } = useClipboardUtil()

  // Props
  defineProps({
    identificationObject: {
      type: Object as any,
      default: {} as any,
    },
    vChipContent: {
      type: String,
      default: '',
    },
    identificationTitle: {
      type: String,
      default: 'Identification (ID)',
    },
    idShortTitle: {
      type: String,
      default: 'ID short',
    },
  })

  // Data
  const copyIcon = ref<string>('mdi-clipboard-file-outline')
  function getCopyIconAsRef (): Ref {
    return copyIcon
  }
</script>
