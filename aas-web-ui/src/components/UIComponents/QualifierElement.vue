<template>
  <v-container class="pa-0" fluid>
    <v-expansion-panels
      v-if="qualifierArray && Array.isArray(qualifierArray) && qualifierArray.length > 0"
      class="mb-n2"
    >
      <v-expansion-panel elevation="0" static tile>
        <v-expansion-panel-title class="px-2">
          <span :class="small ? 'text-body-small' : 'text-title-small '">
            {{ qualifierTitle }}
          </span>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="mx-2 mb-2">
          <v-divider class="mb-1" opacity="0.05" />

          <v-list>
            <v-list-item
              v-for="(qualifier, index) in qualifierArray"
              :key="index"
              class="bg-elevatedCard mt-2"
              rounded
            >
              <!-- Qualifier SemanticId -->
              <v-list-item-subtitle
                v-if="
                  qualifier.semanticId &&
                    qualifier.semanticId.keys &&
                    qualifier.semanticId.keys.length > 0
                "
                class="pt-1"
              >
                <span class="text-body-small">
                  {{ 'Semantic Id: ' }}
                </span>
              </v-list-item-subtitle>

              <SemanticID
                v-if="
                  qualifier.semanticId &&
                    qualifier.semanticId.keys &&
                    qualifier.semanticId.keys.length > 0
                "
                class="mt-n4 mb-n2 ml-2"
                :semantic-id-object="qualifier.semanticId"
                :semantic-title="''"
                :small="true"
              />

              <v-divider
                v-if="
                  qualifier.semanticId &&
                    qualifier.semanticId.keys &&
                    qualifier.semanticId.keys.length > 0
                "
                class="mt-2 mb-3"
              />
              <!-- Qualifier Type -->
              <v-list-item-subtitle v-if="qualifier.type && !isEmptyString(qualifier.type)" class="pt-1">
                <span class="text-body-small">
                  {{ 'Type: ' }}
                </span>

                <v-chip border color="primary" label size="x-small">
                  {{ qualifier.type }}
                </v-chip>
              </v-list-item-subtitle>
              <!-- Qualifier Value Type -->
              <v-list-item-subtitle
                v-if="qualifier.valueType && !isEmptyString(qualifier.valueType)"
                class="pt-1"
              >
                <span class="text-body-small">
                  {{ 'Value Type: ' }}
                </span>

                <v-chip border color="primary" label size="x-small">
                  {{ qualifier.valueType }}
                </v-chip>
              </v-list-item-subtitle>
              <!-- Qualifier Value -->
              <v-list-item-subtitle class="pt-4 pb-3">
                <v-text-field
                  density="compact"
                  hide-details
                  label="value"
                  :model-value="qualifier.value"
                  readonly
                  variant="outlined"
                />
              </v-list-item-subtitle>

              <template #append>
                <!-- Qualifier Kind -->
                <v-chip
                  v-if="qualifier.kind && !isEmptyString(qualifier.kind)"
                  class="ml-3"
                  color="primary"
                  size="x-small"
                >
                  {{ qualifier.kind }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup lang="ts">
  import { isEmptyString } from '@/utils/StringUtils'

  // Props
  defineProps({
    qualifierArray: {
      type: Object as any,
      default: {} as any,
    },
    qualifierTitle: {
      type: String,
      default: 'Qualifiers',
    },
    small: {
      type: Boolean,
      default: false,
    },
  })
</script>
