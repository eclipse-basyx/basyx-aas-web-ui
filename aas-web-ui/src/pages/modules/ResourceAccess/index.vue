<template>
  <v-container class="py-6" fluid>
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <div class="d-flex align-center mb-5">
          <v-avatar class="mr-3" color="primary" icon="mdi-account-lock" />

          <div>
            <h1 class="text-h4">Access Management</h1>
            <p class="text-medium-emphasis mb-0">Choose who can access your resources and what they can do.</p>
          </div>
        </div>

        <v-alert
          v-if="availableOptions.length > 0"
          class="mb-5"
          icon="mdi-lightbulb-outline"
          type="info"
          variant="tonal"
        >
          To share an AAS or submodel, open it in the resource browser and choose <strong>Share</strong>.
          Its details are filled in for you. Use this page to find a resource you know by ID.
        </v-alert>

        <v-alert v-if="availableOptions.length === 0" type="info" variant="tonal">Sharing is not available on the connected services.</v-alert>

        <v-expansion-panels v-else class="mt-5" variant="accordion">
          <v-expansion-panel title="Find a resource by ID">
            <v-expansion-panel-text>
              <v-card-text class="pb-0 text-medium-emphasis">Select a resource and enter its ID to manage who can access it.</v-card-text>

              <v-card-text>
                <v-switch
                  v-model="showAdvanced"
                  class="mb-3"
                  color="primary"
                  hide-details
                  label="Show registries, discovery and nested resources"
                />

                <v-select
                  v-model="kind"
                  class="mb-2"
                  item-title="title"
                  item-value="value"
                  :items="visibleOptions"
                  label="Resource type"
                />

                <v-text-field
                  v-if="needsResourceId"
                  v-model="resourceId"
                  hint="Paste the resource ID as shown in the resource browser."
                  :label="resourceIdLabel"
                  persistent-hint
                />

                <v-text-field
                  v-if="needsAasId"
                  v-model="aasId"
                  label="AAS ID"
                  placeholder="Enter the original, unencoded AAS identifier"
                />

                <v-text-field
                  v-if="needsSubmodelId"
                  v-model="submodelId"
                  label="Submodel ID"
                  placeholder="Enter the original, unencoded Submodel identifier"
                />

                <v-text-field
                  v-if="needsIdShortPath"
                  v-model="idShortPath"
                  hint="Example: TechnicalData.GeneralInformation.ManufacturerName or Items[0]"
                  label="ID-short path"
                  persistent-hint
                />

                <v-alert v-if="!baseUrl" class="mt-2" type="warning" variant="tonal">
                  The selected infrastructure has no endpoint configured for this component.
                </v-alert>

                <v-alert v-if="formError" class="mt-2" type="error" variant="tonal">{{ formError }}</v-alert>
              </v-card-text>

              <v-card-actions>
                <v-spacer />

                <v-btn
                  color="primary"
                  :disabled="!canOpen"
                  prepend-icon="mdi-account-lock"
                  variant="flat"
                  @click="openAccess"
                >
                  Share
                </v-btn>
              </v-card-actions>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

      </v-col>
    </v-row>

    <ResourceAccessDialog v-model="dialog" :target="target" />
  </v-container>
</template>

<script setup lang="ts">
  import type { ResourceAccessTarget, ResourceAccessTargetKind } from '@/types/ResourceAccess'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { usesAasEnvironment } from '@/utils/InfrastructureUtils'
  import { buildResourceAccessTarget, resourceAccessTargetOptions } from '@/utils/ResourceAccessTargets'

  defineOptions({
    moduleName: 'ResourceAccess',
    moduleTitle: 'Access Management',
    isDesktopModule: true,
    isMobileModule: true,
    isVisibleModule: true,
    needsAuthentication: true,
    supportedInfrastructureTemplates: ['full', 'identifiable', 'mono-repo', 'mono-all'],
  })

  const infrastructureStore = useInfrastructureStore()
  const showAdvanced = ref(false)
  const kind = ref<ResourceAccessTargetKind>('aas')
  const resourceId = ref('')
  const aasId = ref('')
  const submodelId = ref('')
  const idShortPath = ref('')
  const target = ref<ResourceAccessTarget>()
  const dialog = ref(false)
  const formError = ref('')

  const availableOptions = computed(() => resourceAccessTargetOptions.filter(option => !(usesAasEnvironment(infrastructureStore.getSelectedInfrastructure) && option.value.includes('descriptor')) && componentUrl(option.value) && infrastructureStore.supportsResourceAccess(option.componentKey)))
  const visibleOptions = computed(() => availableOptions.value.filter(option => showAdvanced.value || ['aas', 'submodel', 'concept-description'].includes(option.value)))
  const canOpen = computed(() => Boolean(baseUrl.value)
    && (!needsResourceId.value || Boolean(resourceId.value.trim()))
    && (!needsAasId.value || Boolean(aasId.value.trim()))
    && (!needsSubmodelId.value || Boolean(submodelId.value.trim()))
    && (!needsIdShortPath.value || Boolean(idShortPath.value.trim())))
  const baseUrl = computed(() => componentUrl(kind.value))
  const needsResourceId = computed(() => ['aas', 'submodel', 'aas-descriptor', 'submodel-descriptor', 'discovery', 'concept-description'].includes(kind.value))
  const needsAasId = computed(() => ['nested-submodel', 'nested-submodel-element', 'nested-submodel-descriptor'].includes(kind.value))
  const needsSubmodelId = computed(() => ['submodel-element', 'nested-submodel', 'nested-submodel-element', 'nested-submodel-descriptor'].includes(kind.value))
  const needsIdShortPath = computed(() => ['submodel-element', 'nested-submodel-element'].includes(kind.value))
  const resourceIdLabel = computed(() => {
    if (['aas', 'aas-descriptor', 'discovery'].includes(kind.value)) return 'AAS ID'
    if (kind.value === 'concept-description') return 'Concept Description ID'
    return 'Submodel ID'
  })

  watch(visibleOptions, options => {
    if (!options.some(option => option.value === kind.value) && options[0]) kind.value = options[0].value
  }, { immediate: true })

  watch(kind, () => {
    formError.value = ''
    resourceId.value = ''
    aasId.value = ''
    submodelId.value = ''
    idShortPath.value = ''
  })

  function componentUrl (targetKind: ResourceAccessTargetKind): string {
    if (targetKind.startsWith('aas-descriptor') || targetKind === 'nested-submodel-descriptor') return infrastructureStore.getAASRegistryURL
    if (targetKind.startsWith('submodel-descriptor')) return infrastructureStore.getSubmodelRegistryURL
    if (targetKind.startsWith('aas') || targetKind.startsWith('nested-submodel')) return infrastructureStore.getAASRepoURL
    if (targetKind.startsWith('submodel')) return infrastructureStore.getSubmodelRepoURL
    if (targetKind.startsWith('discovery')) return infrastructureStore.getAASDiscoveryURL
    return infrastructureStore.getConceptDescriptionRepoURL
  }

  function openAccess (): void {
    formError.value = ''
    if (!availableOptions.value.some(option => option.value === kind.value)) return
    try {
      target.value = buildResourceAccessTarget({
        kind: kind.value,
        baseUrl: baseUrl.value,
        resourceId: resourceId.value,
        aasId: aasId.value,
        submodelId: submodelId.value,
        idShortPath: idShortPath.value,
      })
      dialog.value = true
    } catch (error) {
      formError.value = error instanceof Error ? error.message : String(error)
    }
  }
</script>
