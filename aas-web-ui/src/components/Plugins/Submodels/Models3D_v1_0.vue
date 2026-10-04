<template>
  <v-container class="pa-0" fluid>
    <v-card>
      <!-- Header -->
      <div class="d-flex align-center px-4 py-3">
        <v-icon class="mr-2" color="primary" size="small">mdi-cube-outline</v-icon>
        <div class="text-title-small text-break">{{ nameToDisplay(submodelElementData, 'en', '3D Models') }}</div>

        <v-spacer />

        <v-chip v-if="!isLoading && models.length > 0" border label size="x-small">{{ models.length }}</v-chip>
      </div>

      <v-divider />

      <v-skeleton-loader v-if="isLoading" type="image, paragraph" />

      <div v-else-if="models.length === 0" class="pa-4">
        <v-alert icon="mdi-information-outline" type="info" variant="tonal">
          No 3D models found in this submodel.
        </v-alert>
      </div>

      <div v-else class="models3d">
        <div class="models3d__layout pa-4" :class="{ 'models3d__layout--list': models.length > 1 }">
          <Models3DModelList
            v-if="models.length > 1"
            :models="models"
            :selected-key="selectedModel?.key ?? ''"
            @select="selectedModelKey = $event"
          />

          <div v-if="selectedModel" class="models3d__main">
            <div class="d-flex flex-wrap align-center ga-2 mb-3">
              <div class="text-title-small text-break">{{ selectedTitle }}</div>

              <v-spacer />

              <v-chip-group
                v-if="selectedModel.versions.length > 1"
                v-model="selectedVersionKey"
                mandatory
                selected-class="text-primary"
              >
                <v-chip
                  v-for="modelVersion in selectedModel.versions"
                  :key="modelVersion.key"
                  border
                  label
                  size="x-small"
                  :value="modelVersion.key"
                >
                  {{ modelVersion.versionId ? `v${modelVersion.versionId}` : modelVersion.fileName }}
                </v-chip>
              </v-chip-group>
            </div>

            <Models3DViewerCard class="mb-4" :title="selectedTitle" :version="version" />

            <Models3DDetails :model="selectedModel" :version="version" />
          </div>
        </div>
      </div>

      <template v-if="!isLoading">
        <v-divider />
        <LastSync :timestamp="modelData.timestamp" />
      </template>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { Model3DEntry, SubmodelElementLike } from './Models3D_v1_0/types'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { latestVersion, parseModels3D, versionTitle } from './Models3D_v1_0/utils/parseModel3D'

  defineOptions({
    name: 'Models3D',
    semanticId: 'https://admin-shell.io/idta/Models3D/1/0',
  })

  // Props
  const props = defineProps<{
    submodelElementData?: SubmodelElementLike
  }>()

  // Composables
  const { setData } = useSMHandling()
  const { nameToDisplay } = useReferableUtils()

  // Reactive data
  const isLoading = ref(false)
  const modelData = ref<SubmodelElementLike>({})
  const models = ref<Model3DEntry[]>([])
  const selectedModelKey = ref('')
  const selectedVersionKeys = ref<Record<string, string>>({})

  // Computed properties
  const selectedModel = computed(() => models.value.find(model => model.key === selectedModelKey.value) ?? models.value[0])

  const version = computed(() => {
    const model = selectedModel.value
    if (!model) return undefined
    return model.versions.find(entry => entry.key === selectedVersionKeys.value[model.key]) ?? latestVersion(model.versions)
  })

  const selectedVersionKey = computed({
    get: () => version.value?.key,
    set: key => {
      if (selectedModel.value && key) selectedVersionKeys.value[selectedModel.value.key] = key
    },
  })

  const selectedTitle = computed(() => {
    const model = selectedModel.value
    return model ? versionTitle(version.value, model, models.value.indexOf(model)) : ''
  })

  // Watchers
  watch(
    () => [props.submodelElementData?.id, props.submodelElementData?.path, props.submodelElementData?.timestamp],
    initializeVisualization,
  )

  onMounted(initializeVisualization)

  // Methods
  async function initializeVisualization (): Promise<void> {
    isLoading.value = true
    selectedModelKey.value = ''
    selectedVersionKeys.value = {}

    if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
      modelData.value = {}
      models.value = []
      isLoading.value = false
      return
    }

    // setData assigns the `path` of every element, which is needed to request the file attachments
    modelData.value = await setData(
      { ...props.submodelElementData },
      props.submodelElementData.path ?? '',
      false,
      props.submodelElementData.timestamp,
    )
    models.value = parseModels3D(modelData.value)
    isLoading.value = false
  }
</script>

<style scoped>
  .models3d {
    container-type: inline-size;
  }

  .models3d__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .models3d__main {
    min-width: 0;
  }

  @container (min-width: 720px) {
    .models3d__layout--list {
      grid-template-columns: 280px minmax(0, 1fr);
    }
  }
</style>
