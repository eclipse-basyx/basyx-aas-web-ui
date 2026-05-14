<template>
  <v-container class="pa-0" fluid>
    <v-card :class="topMargin" color="elevatedCard">
      <v-list
        v-if="
          submodelElementData[smeLocator] &&
            Array.isArray(submodelElementData[smeLocator]) &&
            submodelElementData[smeLocator].length > 0
        "
        class="bg-elevatedCard"
        nav
      >
        <div v-for="(SubmodelElement, i) in submodelElementData[smeLocator]" :key="i">
          <v-list-item class="pt-0">
            <v-list-item-title class="pt-2">
              <!-- SubmodelElementCollection -->
              <v-alert
                v-if="SubmodelElement.modelType == 'SubmodelElementCollection'"
                border="start"
                density="compact"
                :text="nameToDisplay(SubmodelElement)"
                variant="outlined"
              >
                <template #prepend>
                  <v-chip border color="primary" label size="x-small">{{
                    SubmodelElement.modelType
                  }}</v-chip>
                </template>

                <template #append>
                  <v-badge
                    :content="SubmodelElement.value ? SubmodelElement.value.length : 0"
                    inline
                  />
                </template>
              </v-alert>
              <!-- SubmodelElementList -->
              <v-alert
                v-else-if="SubmodelElement.modelType == 'SubmodelElementList'"
                border="start"
                density="compact"
                :text="nameToDisplay(SubmodelElement)"
                variant="outlined"
              >
                <template #prepend>
                  <v-chip border color="primary" label size="x-small">{{
                    SubmodelElement.modelType
                  }}</v-chip>
                </template>

                <template #append>
                  <v-badge
                    :content="SubmodelElement.value ? SubmodelElement.value.length : 0"
                    inline
                  />
                </template>
              </v-alert>
              <!-- Entity -->
              <v-alert
                v-else-if="SubmodelElement.modelType == 'Entity'"
                border="start"
                density="compact"
                :text="nameToDisplay(SubmodelElement)"
                variant="outlined"
              >
                <template #prepend>
                  <v-chip border color="primary" label size="x-small">{{
                    SubmodelElement.modelType
                  }}</v-chip>
                </template>

                <template #append>
                  <v-badge
                    :content="SubmodelElement.statements ? SubmodelElement.statements.length : 0"
                    inline
                  />
                </template>
              </v-alert>
              <!-- Property -->
              <v-text-field
                v-else-if="SubmodelElement.modelType == 'Property'"
                v-model="SubmodelElement.value"
                density="compact"
                hide-details
                :label="nameToDisplay(SubmodelElement)"
                readonly
                variant="outlined"
              >
                <!-- Current Value -->
                <template #prepend-inner>
                  <v-chip border color="primary" label size="x-small">{{
                    SubmodelElement.valueType
                  }}</v-chip>
                </template>

                <template #append-inner>
                  <span class="text-subtitleText">{{ unitSuffix(SubmodelElement) }}</span>
                </template>
              </v-text-field>
              <!-- MultiLanguageProperty -->
              <template v-else-if="SubmodelElement.modelType == 'MultiLanguageProperty'">
                <v-list-item class="mt-n2">
                  <template #title>
                    <div class="mt-1 text-title-small">
                      {{ nameToDisplay(SubmodelElement) + ':' }}
                    </div>
                  </template>

                  <v-list-item-subtitle v-for="(value, valueIndex) in SubmodelElement.value" :key="valueIndex">
                    <div class="pt-2">
                      <v-chip border class="mr-2" label size="x-small">{{
                        value.language ? value.language : 'no-lang'
                      }}</v-chip>

                      <span>{{ value.text }}</span>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
              <!-- Operation -->
              <v-alert
                v-else-if="SubmodelElement.modelType == 'Operation'"
                border="start"
                density="compact"
                :text="nameToDisplay(SubmodelElement)"
                variant="tonal"
              >
                <template #prepend>
                  <v-chip border color="primary" label size="x-small">{{
                    SubmodelElement.modelType
                  }}</v-chip>
                </template>

                <template #append>
                  <v-icon style="margin-right: 5px">mdi-lightning-bolt-circle</v-icon>
                </template>
              </v-alert>
              <!-- File -->
              <v-text-field
                v-else-if="SubmodelElement.modelType == 'File'"
                v-model="SubmodelElement.value"
                density="compact"
                hide-details
                :label="nameToDisplay(SubmodelElement)"
                readonly
                variant="outlined"
              >
                <template #prepend-inner>
                  <v-chip border color="primary" label size="x-small">{{
                    SubmodelElement.modelType
                  }}</v-chip>
                </template>
              </v-text-field>
              <!-- Blob -->
              <v-text-field
                v-else-if="SubmodelElement.modelType == 'Blob'"
                density="compact"
                hide-details
                :label="nameToDisplay(SubmodelElement)"
                persistent-placeholder
                :placeholder="formatBlobSize(SubmodelElement.value)"
                readonly
                variant="outlined"
              >
                <template #prepend-inner>
                  <v-chip border color="primary" label size="x-small">{{
                    SubmodelElement.modelType
                  }}</v-chip>
                </template>

                <template v-if="SubmodelElement.contentType" #append-inner>
                  <v-chip color="grey-lighten-3" density="compact" size="x-small">{{
                    SubmodelElement.contentType
                  }}</v-chip>
                </template>
              </v-text-field>
              <!-- ReferenceElement -->
              <div v-else-if="SubmodelElement.modelType == 'ReferenceElement'">
                <v-list-item style="margin-top: -12px">
                  <!-- Reference idShort -->
                  <template #title>
                    <div class="text-title-small">{{ nameToDisplay(SubmodelElement) }}</div>
                  </template>
                </v-list-item>

                <v-chip border class="mr-2" label size="x-small">{{
                  referenceKeyTypeToDisplay(SubmodelElement.value?.keys)
                }}</v-chip>

                <span>{{ referenceKeyValueToDisplay(SubmodelElement.value?.keys) }}</span>
              </div>
              <!-- Range -->
              <div v-else-if="SubmodelElement.modelType == 'Range'">
                <v-list-item style="margin-top: -12px">
                  <!-- Range idShort -->
                  <template #title>
                    <div class="text-title-small">{{ nameToDisplay(SubmodelElement) }}</div>
                  </template>
                </v-list-item>

                <v-row>
                  <v-col>
                    <v-text-field
                      v-model="SubmodelElement.min"
                      density="compact"
                      hide-details
                      label="min"
                      readonly
                      variant="outlined"
                    />
                  </v-col>

                  <v-col>
                    <v-text-field
                      v-model="SubmodelElement.max"
                      density="compact"
                      hide-details
                      label="max"
                      readonly
                      variant="outlined"
                    />
                  </v-col>
                </v-row>
              </div>
              <!-- RelationshipElement -->
              <div v-else-if="SubmodelElement.modelType == 'RelationshipElement'">
                <v-list-item style="margin-top: -12px">
                  <!-- Relationship idShort -->
                  <template #title>
                    <div class="text-title-small">{{ nameToDisplay(SubmodelElement) }}</div>
                  </template>
                </v-list-item>

                <div>
                  <v-chip border class="mr-2" label size="x-small">{{ 'first' }}</v-chip>

                  <v-chip border class="mr-2" label size="x-small">{{
                    referenceKeyTypeToDisplay(SubmodelElement.first?.keys)
                  }}</v-chip>

                  <span>{{ referenceKeyValueToDisplay(SubmodelElement.first?.keys) }}</span>
                </div>

                <div class="mt-3">
                  <v-chip border class="mr-2" label size="x-small">{{ 'second' }}</v-chip>

                  <v-chip border class="mr-2" label size="x-small">{{
                    referenceKeyTypeToDisplay(SubmodelElement.second?.keys)
                  }}</v-chip>

                  <span>{{ referenceKeyValueToDisplay(SubmodelElement.second?.keys) }}</span>
                </div>
              </div>
              <!-- AnnotatedRelationshipElement -->
              <div v-else-if="SubmodelElement.modelType == 'AnnotatedRelationshipElement'">
                <v-list-item style="margin-top: -12px">
                  <!-- Relationship idShort -->
                  <template #title>
                    <div class="text-title-small">{{ nameToDisplay(SubmodelElement) }}</div>
                  </template>
                </v-list-item>

                <div>
                  <v-chip border class="mr-2" label size="x-small">{{ 'first' }}</v-chip>

                  <v-chip border class="mr-2" label size="x-small">{{
                    referenceKeyTypeToDisplay(SubmodelElement.first?.keys)
                  }}</v-chip>

                  <span>{{ referenceKeyValueToDisplay(SubmodelElement.first?.keys) }}</span>
                </div>

                <div class="mt-3">
                  <v-chip border class="mr-2" label size="x-small">{{ 'second' }}</v-chip>

                  <v-chip border class="mr-2" label size="x-small">{{
                    referenceKeyTypeToDisplay(SubmodelElement.second?.keys)
                  }}</v-chip>

                  <span>{{ referenceKeyValueToDisplay(SubmodelElement.second?.keys) }}</span>
                </div>

                <div class="mt-3 ml-3">
                  <span class="text-body-small">{{ 'Annotations: ' }}</span>

                  <v-chip border class="mr-2" size="x-small">{{
                    SubmodelElement.annotations.length
                  }}</v-chip>
                </div>
              </div>
              <!-- InvalidElement -->
              <v-alert
                v-else
                density="compact"
                text="Invalid SubmodelElement!"
                type="warning"
                variant="outlined"
              />
            </v-list-item-title>
          </v-list-item>

          <v-divider v-if="(i as number) < smeObject[smeLocator].length - 1" class="mt-2 mb-1" />
        </div>
      </v-list>

      <v-list v-else class="bg-elevatedCard pt-0" nav>
        <v-list-item>
          <v-list-item-title class="pt-2">
            <v-alert
              density="compact"
              :text="smeObject.modelType + ' doesn\'t contain any SubmodelElements!'"
              type="warning"
              variant="outlined"
            />
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue'
  import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'

  // Composables
  const { setData } = useSMHandling()
  const { unitSuffix } = useConceptDescriptionHandling()
  const { nameToDisplay } = useReferableUtils()

  // Properties
  const props = defineProps({
    smeObject: {
      type: Object as any,
      default: {} as any,
    },
    smeLocator: {
      type: String,
      default: '',
    },
    topMargin: {
      type: String,
      default: '',
    },
  })

  // Data
  const submodelElementData = ref({} as any)

  // Watchers
  watch(
    () => props.smeObject,
    () => {
      initialize()
    },
  )

  onMounted(async () => {
    await initialize()
  })

  async function initialize (): Promise<void> {
    if (!props.smeObject || Object.keys(props.smeObject).length === 0) {
      return
    }

    // First: set data (to view quickly the SMEs without units)
    submodelElementData.value = props.smeObject

    // Second: fetch ConceptDescriptions to view the SMEs with units
    submodelElementData.value = await setData(props.smeObject, props.smeObject.path, true)
  }

  function referenceKeyTypeToDisplay (keys: any): string {
    if (keys?.length > 0) {
      return keys.at(-1).type
    }
    return ''
  }

  function referenceKeyValueToDisplay (keys: any): string {
    if (keys?.length > 0) {
      return keys.at(-1).value
    }
    return ''
  }

  function formatBlobSize (base64Value: string): string {
    if (!base64Value) return 'No content'

    try {
      // Calculate size based on base64 string
      // Base64 uses 4 characters to represent 3 bytes of data
      const padding = base64Value.endsWith('==') ? 2 : (base64Value.endsWith('=') ? 1 : 0)
      const byteLength = (base64Value.length * 3) / 4 - padding

      return formatFileSize(byteLength)
    } catch (error) {
      console.error('Error calculating blob size:', error)
      return 'Unknown size'
    }
  }

  function formatFileSize (bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
</script>
