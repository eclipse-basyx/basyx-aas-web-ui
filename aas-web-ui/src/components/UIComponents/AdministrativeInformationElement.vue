<template>
  <v-container class="pa-0" fluid>
    <v-expansion-panels class="mb-n2">
      <v-expansion-panel :color="backgroundColor" elevation="0" static tile>
        <v-expansion-panel-title class="px-2">
          <span :class="small ? 'text-body-small' : 'text-title-small '">
            {{ administrativeInformationTitle }}
          </span>
        </v-expansion-panel-title>

        <v-expansion-panel-text :class="'bg-' + backgroundColor">
          <v-divider
            v-if="
              Array.isArray(administrativeInformationObject?.creator?.keys) &&
                administrativeInformationObject?.creator?.keys.length > 0
            "
            class="mb-1"
            opacity="0.05"
          />

          <v-list class="pa-0" nav>
            <!-- Creator -->
            <v-list-item
              v-if="
                Array.isArray(administrativeInformationObject?.creator?.keys) &&
                  administrativeInformationObject?.creator?.keys.length > 0
              "
              class="ma-0"
            >
              <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div
                  v-for="(creator, i) in administrativeInformationObject.creator.keys"
                  :key="i"
                  class="text-body-small"
                >
                  <span v-if="creator?.type" class="font-weight-bold">{{
                    '(' + creator.type + ') '
                  }}</span>{{ creator.value }}
                </div>
              </v-tooltip>

              <template #title>
                <span class="text-title-small">
                  {{
                    administrativeInformationObject.creator.keys.length === 1
                      ? 'Creator:'
                      : 'Creators:'
                  }}
                </span>
              </template>

              <v-list-item-subtitle
                v-for="(creator, i) in administrativeInformationObject.creator.keys"
                :key="i"
              >
                <div v-if="creator?.type" class="pt-2">
                  <v-chip border class="mr-2" label size="x-small">{{ creator.type }}</v-chip>
                  <span>{{ creator.value }}</span>
                </div>
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider
              v-if="
                Array.isArray(administrativeInformationObject?.creator?.keys) &&
                  administrativeInformationObject?.creator?.keys.length > 0 &&
                  (administrativeInformationObject?.version || administrativeInformationObject?.revision)
              "
              class="mt-2"
              opacity="0.05"
            />
            <!-- Version and Revision -->
            <v-list-item
              v-if="administrativeInformationObject?.version || administrativeInformationObject?.revision"
              class="ma-0"
            >
              <v-list-item-title>
                <template v-if="administrativeInformationObject?.version">
                  <span class="text-title-small mt-2 mr-2">{{ 'Version:' }}</span>

                  <v-chip border class="mr-5" label size="x-small">{{
                    administrativeInformationObject.version
                  }}</v-chip>
                </template>

                <template v-if="administrativeInformationObject?.revision">
                  <span class="text-title-small mt-2 mr-2">{{ 'Revision:' }}</span>

                  <v-chip border class="mr-5" label size="x-small">{{
                    administrativeInformationObject.revision
                  }}</v-chip>
                </template>
              </v-list-item-title>
            </v-list-item>

            <v-list-item v-if="administrativeInformationObject?.createdAt" class="ma-0">
              <v-list-item-title>
                <span class="text-title-small mt-2 mr-2">{{ 'Created At:' }}</span>
                <span class="text-body-small">{{ new Date(administrativeInformationObject.createdAt).toLocaleString() }}</span>
              </v-list-item-title>
            </v-list-item>

            <v-list-item v-if="administrativeInformationObject?.updatedAt" class="ma-0">
              <v-list-item-title>
                <span class="text-title-small mt-2 mr-2">{{ 'Updated At:' }}</span>
                <span class="text-body-small">{{ new Date(administrativeInformationObject.updatedAt).toLocaleString() }}</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider
            v-if="
              ((Array.isArray(administrativeInformationObject?.creator?.keys) &&
                administrativeInformationObject?.creator?.keys.length > 0) ||
                administrativeInformationObject?.version ||
                administrativeInformationObject?.revision ||
                administrativeInformationObject?.createdAt ||
                administrativeInformationObject?.updatedAt) &&
              administrativeInformationObject?.templateId
            "
            opacity="0.05"
          />

          <v-list class="pa-0" nav>
            <v-hover v-slot="{ isHovering, props }">
              <v-list-item v-if="administrativeInformationObject?.templateId" class="ma-0">
                <template #title>
                  <span class="text-title-small">
                    {{ 'Template ID:' }}
                  </span>
                </template>

                <template #subtitle>
                  <div
                    v-if="administrativeInformationObject.templateId"
                    v-bind="props"
                    :class="isHovering ? 'cursor-pointer' : ''"
                    @click="
                      copyToClipboard(
                        administrativeInformationObject.templateId,
                        'Template ID',
                        getCopyIconAsRef()
                      )
                    "
                  >
                    <v-icon v-if="isHovering" class="mr-1" color="subtitleText" size="x-small">{{
                      copyIcon
                    }}</v-icon>

                    <span>{{ administrativeInformationObject.templateId }}</span>
                  </div>
                </template>
              </v-list-item>
            </v-hover>
          </v-list>

          <v-divider
            v-if="
              ((Array.isArray(administrativeInformationObject?.creator?.keys) &&
                administrativeInformationObject?.creator?.keys.length > 0) ||
                administrativeInformationObject?.version ||
                administrativeInformationObject?.revision ||
                administrativeInformationObject?.templateId) &&
                Array.isArray(administrativeInformationObject?.embeddedDataSpecifications) &&
                administrativeInformationObject?.embeddedDataSpecifications.length > 0
            "
            opacity="0.05"
          />
          <!-- Embedded Data Specifications -->
          <v-list
            v-if="
              Array.isArray(administrativeInformationObject?.embeddedDataSpecifications) &&
                administrativeInformationObject?.embeddedDataSpecifications.length > 0
            "
            class="pa-0"
            nav
          >
            <v-card
              v-for="(
                embeddedDataSpecification, i
              ) in administrativeInformationObject.embeddedDataSpecifications"
              :key="i"
              class="mt-2"
              color="elevatedCard"
            >
              <v-list class="bg-elevatedCard pt-0" nav>
                <!-- hasDataSpecification -->
                <SemanticID
                  v-if="
                    Array.isArray(embeddedDataSpecification?.dataSpecification?.keys) &&
                      embeddedDataSpecification?.dataSpecification?.keys.length > 0
                  "
                  class="mb-2"
                  :semantic-id-object="embeddedDataSpecification.dataSpecification"
                  :semantic-title="'Data Specification'"
                />

                <v-divider v-if="embeddedDataSpecification?.dataSpecificationContent" />
                <!-- dataSpecificationContent -->
                <DataSpecificationContent
                  v-if="embeddedDataSpecification?.dataSpecificationContent"
                  :data-specification-object="
                    embeddedDataSpecification?.dataSpecificationContent
                  "
                />
              </v-list>
            </v-card>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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
    administrativeInformationObject: {
      type: Object as any,
      default: {} as any,
    },
    administrativeInformationTitle: {
      type: String,
      default: 'Identification (ID)',
    },
    small: {
      type: Boolean,
      default: false,
    },
    backgroundColor: {
      type: String,
      default: '',
    },
  })

  // Data
  const copyIcon = ref<string>('mdi-clipboard-file-outline')
  function getCopyIconAsRef (): Ref {
    return copyIcon
  }
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding-left: 8px !important;
        padding-right: 8px !important;
        padding-top: 0px !important;
        padding-bottom: 12px !important;
    }
</style>
