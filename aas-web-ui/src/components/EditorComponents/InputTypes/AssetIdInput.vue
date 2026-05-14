<template>
  <v-container class="px-0" fluid>
    <!-- Global Asset ID -->
    <v-row v-if="showGlobalAssetId" align="center">
      <v-col class="py-0">
        <v-text-field
          v-model="globalAssetIdValue"
          bg-color="surface"
          clearable
          density="comfortable"
          label="Global Asset Id"
          variant="outlined"
        >
          <template v-if="showGenerateIriForGlobal" #append-inner>
            <v-btn
              border

              color="primary"
              size="small"
              slim
              text="Generate IRI"
              variant="text"
              @click.stop="globalAssetIdValue = generateIri('GlobalAssetId')"
            />
          </template>
        </v-text-field>
      </v-col>

      <v-col class="px-0" cols="auto">
        <HelpInfoButton help-type="globalAssetId" />
      </v-col>
    </v-row>

    <!-- Specific Asset IDs -->
    <template v-if="showSpecificAssetIds">
      <v-divider v-if="showGlobalAssetId" class="mt-2" />

      <v-list-item v-if="showGlobalAssetId" class="pl-0 pt-0">
        <template #title>
          <div class="text-title-small">{{ 'Specific Asset Ids' }}</div>
        </template>
      </v-list-item>

      <v-row align="center">
        <v-col>
          <v-list-item v-for="(assetId, i) in specificAssetIdsValue" :key="i" class="pa-0">
            <template #prepend>
              <v-text-field
                v-model="assetId.name"
                class="mr-3 mt-2"
                clearable
                density="comfortable"
                label="Name"
                variant="outlined"
                :width="300"
              />
            </template>

            <v-text-field
              v-model="assetId.value"
              append-icon="mdi-delete"
              class="mt-2"
              density="comfortable"
              label="Value"
              variant="outlined"
              @click:append="deleteSpecificAssetId(assetId)"
            >
              <template v-if="showGenerateIriForSpecific" #append-inner>
                <v-btn
                  border

                  color="primary"
                  size="small"
                  slim
                  text="Generate IRI"
                  variant="text"
                  @click.stop="assetId.value = generateIri('SpecificAssetId')"
                />
              </template>
            </v-text-field>
          </v-list-item>

          <v-btn
            class="mt-2"
            color="primary"
            prepend-icon="mdi-plus"
            text="Add"
            variant="outlined"
            @click="addSpecificAssetId"
          />
        </v-col>

        <v-col class="px-0 mt-n4" cols="auto">
          <HelpInfoButton help-type="specificAssetIds" />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { ref, watch } from 'vue'
  import { useIDUtils } from '@/composables/IDUtils'

  // Composables
  const { generateIri } = useIDUtils()

  const props = withDefaults(
    defineProps<{
      globalAssetId?: string | null
      specificAssetIds?: Array<aasTypes.SpecificAssetId> | null
      showGlobalAssetId?: boolean
      showSpecificAssetIds?: boolean
      showGenerateIriForGlobal?: boolean
      showGenerateIriForSpecific?: boolean
    }>(),
    {
      globalAssetId: null,
      specificAssetIds: null,
      showGlobalAssetId: true,
      showSpecificAssetIds: true,
      showGenerateIriForGlobal: false,
      showGenerateIriForSpecific: false,
    },
  )

  const emit = defineEmits<{
    (event: 'update:globalAssetId', value: string | null): void
    (event: 'update:specificAssetIds', value: Array<aasTypes.SpecificAssetId> | null): void
  }>()

  const globalAssetIdValue = ref<string | null>(props.globalAssetId)
  const specificAssetIdsValue = ref<Array<aasTypes.SpecificAssetId>>(
    props.specificAssetIds && props.specificAssetIds.length > 0 ? props.specificAssetIds : [],
  )

  watch(globalAssetIdValue, newValue => {
    if (newValue === '') {
      emit('update:globalAssetId', null)
      globalAssetIdValue.value = null
    } else {
      emit('update:globalAssetId', newValue)
    }
  })

  watch(
    specificAssetIdsValue,
    newValue => {
      emit('update:specificAssetIds', newValue.length > 0 ? newValue : null)
    },
    { deep: true },
  )

  watch(
    () => props.globalAssetId,
    newValue => {
      globalAssetIdValue.value = newValue
    },
  )

  watch(
    () => props.specificAssetIds,
    newValue => {
      specificAssetIdsValue.value = newValue && newValue.length > 0 ? newValue : []
    },
  )

  function addSpecificAssetId (): void {
    specificAssetIdsValue.value.push(new aasTypes.SpecificAssetId('', ''))
  }

  function deleteSpecificAssetId (assetId: aasTypes.SpecificAssetId): void {
    const index = specificAssetIdsValue.value.indexOf(assetId)
    if (index !== -1) {
      specificAssetIdsValue.value.splice(index, 1)
    }
  }
</script>
