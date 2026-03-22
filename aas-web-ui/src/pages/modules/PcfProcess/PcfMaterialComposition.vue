<template>
  <v-card border rounded="lg">
    <v-card-title class="d-flex align-center">
      <v-btn
        class="mr-3 text-buttonText"
        color="primary"
        icon="mdi-arrow-left"
        size="small"
        @click="modelValue!--"
      />
      <v-divider class="ml-3 mr-6 hidden-sm-and-down" inset vertical />
      <span class="hidden-md-and-down">Material Selection for:</span>
      <v-list-item>
        <v-list-item-title class="text-primary">{{ nameToDisplay(shell) }}</v-list-item-title>
        <v-list-item-subtitle>{{ shell.assetInformation.globalAssetId }}</v-list-item-subtitle>
      </v-list-item>
    </v-card-title>
    <v-divider />
    <v-card-text style="height: calc(100vh - 249px); overflow-y: auto">
      <v-list>
        <v-list-item v-for="(material, index) in selectedMaterials" :key="index" class="px-0">
          <!-- Desktop Layout -->
          <div class="d-none d-md-flex justify-space-around align-center" style="max-width: 840px">
            <v-combobox
              v-model="material.shell"
              clearable
              density="compact"
              :error="material.hasError"
              :error-messages="material.hasError ? material.errorMessage : []"
              item-title="idShort"
              item-value="id"
              :items="materialShells"
              placeholder="Select Material"
              return-object
              variant="outlined"
              @update:model-value="fetchSubmodelsForMaterial"
            />
            <span class="text-h6 mx-6 mb-5">X</span>
            <v-number-input
              v-model="material.amount"
              control-variant="stacked"
              density="compact"
              :error="material.unitError"
              :error-messages="material.unitError ? material.unitErrorMessage : []"
              :max-width="180"
              :min="0"
              :precision="null"
              :suffix="material.unit || ''"
              variant="outlined"
              @update:model-value="calculateFootprint(material)"
            />
            <span class="text-h6 mx-6 mb-6">=</span>
            <v-text-field
              v-model="material.footprint"
              density="compact"
              :max-width="200"
              readonly
              suffix="kg CO2 eq"
              variant="outlined"
              :width="200"
            />
            <v-btn
              class="mb-6"
              color="error"
              :disabled="selectedMaterials.length === 1"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="removeMaterial(index)"
            />
          </div>

          <!-- Mobile Layout -->
          <div class="d-flex d-md-none flex-column" style="width: 100%">
            <v-combobox
              v-model="material.shell"
              class="mb-1"
              clearable
              density="compact"
              :error="material.hasError"
              :error-messages="material.hasError ? material.errorMessage : []"
              item-title="idShort"
              item-value="id"
              :items="materialShells"
              placeholder="Select Material"
              return-object
              variant="outlined"
              @update:model-value="fetchSubmodelsForMaterial"
            >
              <template #append>
                <v-btn
                  color="error"
                  :disabled="selectedMaterials.length === 1"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  @click="removeMaterial(index)"
                />
              </template>
            </v-combobox>

            <v-number-input
              v-model="material.amount"
              class="mb-1"
              control-variant="stacked"
              density="compact"
              :error="material.unitError"
              :error-messages="material.unitError ? material.unitErrorMessage : []"
              label="Amount"
              :min="0"
              :precision="null"
              :suffix="material.unit || ''"
              variant="outlined"
              @update:model-value="calculateFootprint(material)"
            />

            <v-text-field
              v-model="material.footprint"
              density="compact"
              prepend-inner-icon="mdi-equal"
              readonly
              suffix="kg CO2 eq"
              variant="outlined"
            />

            <v-divider v-if="index < selectedMaterials.length - 1" class="my-2" />
          </div>
        </v-list-item>
        <v-list-item class="px-0" :class="mdAndDown ? 'mt-3' : ''">
          <v-btn
            :block="mdAndDown"
            class="text-buttonText"
            color="primary"
            prepend-icon="mdi-plus"
            text="Add Material"
            variant="flat"
            @click="addMaterial"
          />
        </v-list-item>
        <v-divider class="mb-2 mt-3" />
        <v-list-item class="px-0">
          <!-- Desktop Layout -->
          <div class="d-none d-md-flex justify-end align-center" style="max-width: 840px; width: 100%">
            <span class="subtitle-1 mr-4">Total Carbon Footprint:</span>
            <v-text-field
              v-model="totalCarbonFootprint"
              density="compact"
              hide-details
              :max-width="200"
              readonly
              suffix="kg CO2 eq"
              variant="outlined"
              :width="200"
            />
            <div style="width: 40px" />
          </div>

          <!-- Mobile Layout -->
          <div class="d-flex d-md-none flex-column" style="width: 100%">
            <span class="subtitle-1 mb-2">Total Carbon Footprint:</span>
            <v-text-field
              v-model="totalCarbonFootprint"
              density="compact"
              hide-details
              readonly
              suffix="kg CO2 eq"
              variant="outlined"
            />
          </div>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-divider />
    <v-card-actions :class="{ 'justify-center': smAndDown }">
      <v-spacer v-if="!smAndDown" />
      <v-btn
        class="text-none text-buttonText"
        color="success"
        :disabled="hasValidationErrors"
        :loading="isCompleting"
        text="Complete"
        variant="flat"
        @click="complete"
      />
      <v-spacer v-if="!smAndDown" />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useCarbonFootprint_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/CarbonFootprint_v1_0Utils'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils'
  import { base64Encode } from '@/utils/EncodeDecodeUtils'
  import PCF_TEMPLATE from './PCF_V1_0_Template.json'

  const router = useRouter()

  const display = useDisplay()

  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()

  const { nameToDisplay } = useReferableUtils()
  const { fetchAasList } = useAASHandling()
  const { fetchSmById } = useSMHandling()
  const {
    extractProductCarbonFootprint,
    semanticId: pcfSemanticId,
    createPcfSubmodelFromTemplate,
  } = useCarbonFootprint_v1_0Utils()
  const { postAas } = useAASRepositoryClient()
  const { postSubmodel } = useSMRepositoryClient()

  const modelValue = defineModel<number>()

  const props = defineProps<{
    shell: any
  }>()

  interface MaterialEntry {
    shell: any
    amount: number
    footprint: string
    unit: string
    pcfCO2eq: number
    referenceQuantity: number
    pcfSubmodel: any
    hasError: boolean
    errorMessage: string
    unitError: boolean
    unitErrorMessage: string
  }

  const materialShells = ref<Array<any>>([])
  const selectedMaterials = ref<Array<MaterialEntry>>([])
  const isCompleting = ref(false)

  const totalCarbonFootprint = computed(() => {
    return selectedMaterials.value
      .reduce((sum, material) => {
        const footprint = Number.parseFloat(material.footprint) || 0
        return sum + footprint
      }, 0)
      .toFixed(2)
  })

  const hasValidationErrors = computed(() => {
    return selectedMaterials.value.some(material => material.hasError || material.unitError)
  })

  const smAndDown = computed(() => display.smAndDown.value)
  const mdAndDown = computed(() => display.mdAndDown.value)

  onMounted(async () => {
    await fetchMaterialShells()
    // Initialize with one empty row
    addMaterial()
  })

  async function fetchMaterialShells (): Promise<void> {
    const unfilteredShells = await fetchAasList()
    const instanceShells = unfilteredShells.filter(
      shell =>
        shell['assetInformation']
        && shell['assetInformation']['assetKind']
        && shell['assetInformation']['assetKind'] === 'Instance',
    )
    materialShells.value = instanceShells.filter(
      shell =>
        shell['assetInformation']
        && shell['assetInformation']['assetType']
        && shell['assetInformation']['assetType'] === 'material',
    )
  }

  async function fetchSubmodelsForMaterial (selectedMaterial: any): Promise<void> {
    // Find the material entry that corresponds to this selection
    const materialEntry = selectedMaterials.value.find(m => m.shell === selectedMaterial)

    if (!selectedMaterial) {
      // Clear material data when deselected
      if (materialEntry) {
        materialEntry.unit = ''
        materialEntry.pcfCO2eq = 0
        materialEntry.referenceQuantity = 1
        materialEntry.pcfSubmodel = null
        materialEntry.footprint = '0'
        materialEntry.hasError = false
        materialEntry.errorMessage = ''
        materialEntry.unitError = false
        materialEntry.unitErrorMessage = ''
      }
      return
    }

    if (!materialEntry) return

    // Reset errors
    materialEntry.hasError = false
    materialEntry.errorMessage = ''
    materialEntry.unitError = false
    materialEntry.unitErrorMessage = ''

    const submodelRefs = selectedMaterial.submodels || []

    if (submodelRefs.length === 0) {
      materialEntry.hasError = true
      materialEntry.errorMessage = 'No submodels found for this material'
      return
    }

    let pcfSubmodelFound = false

    try {
      for (const submodelRef of submodelRefs) {
        // TODO: Optimize by only using the metadata endpoint once it is implemented in BaSyx Go
        const submodel = await fetchSmById(submodelRef.keys[0].value)
        // Check for carbon footprint semantic ID
        if (checkSemanticId(submodel, 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/1/0')) {
          pcfSubmodelFound = true
          await updateMaterialPcfData(materialEntry, submodel)
          break
        }
      }

      if (!pcfSubmodelFound) {
        materialEntry.hasError = true
        materialEntry.errorMessage = 'No Carbon Footprint submodel found for this material'
      }
    } catch (error) {
      materialEntry.hasError = true
      materialEntry.errorMessage = 'Failed to fetch submodel data'
      console.error('Error fetching submodels:', error)
    }
  }

  async function updateMaterialPcfData (materialEntry: MaterialEntry, pcfSubmodel: any): Promise<void> {
    materialEntry.pcfSubmodel = pcfSubmodel

    // Find ProductCarbonFootprints SubmodelElementList
    const productCarbonFootprintsSml = pcfSubmodel.submodelElements?.find(
      (sme: any) =>
        sme.idShort === 'ProductCarbonFootprint'
        || sme.idShort === 'ProductCarbonFootprints'
        || checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprints/1/0'),
    )

    if (!productCarbonFootprintsSml || !productCarbonFootprintsSml.value) {
      materialEntry.hasError = true
      materialEntry.errorMessage = 'Invalid PCF submodel structure: ProductCarbonFootprints missing'
      return
    }

    // Get all ProductCarbonFootprint SubmodelElementCollections
    const productCarbonFootprints = productCarbonFootprintsSml.value.filter(
      (sme: any) =>
        sme.idShort === 'ProductCarbonFootprint'
        || checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/1/0'),
    )

    if (!productCarbonFootprints || productCarbonFootprints.length === 0) {
      materialEntry.hasError = true
      materialEntry.errorMessage = 'Invalid PCF submodel structure: ProductCarbonFootprint missing'
      return
    }

    // Extract PCF data from all entries and validate compatibility
    const pcfDataArray = productCarbonFootprints.map((pcfSmc: any) => extractProductCarbonFootprint(pcfSmc))

    // If multiple PCFs exist, validate compatibility
    if (productCarbonFootprints.length > 1) {
      const firstPcf = pcfDataArray[0]
      const allCompatible = pcfDataArray.every(
        (pcf: ReturnType<typeof extractProductCarbonFootprint>) =>
          JSON.stringify(pcf.pcfCalculationMethods.toSorted())
          === JSON.stringify(firstPcf.pcfCalculationMethods.toSorted())
          && pcf.pcfReferenceValueForCalculation === firstPcf.pcfReferenceValueForCalculation
          && pcf.quantityOfMeasureForCalculation === firstPcf.quantityOfMeasureForCalculation,
      )

      if (!allCompatible) {
        materialEntry.hasError = true
        materialEntry.errorMessage
          = 'Multiple PCF entries with incompatible calculation methods or reference units found'
        return
      }
    }

    // Use the first PCF entry for reference unit and quantity (all are compatible if multiple exist)
    const pcfData = pcfDataArray[0]

    // Check if extraction returned fail response (all empty)
    if (!pcfData.pcfco2eq && !pcfData.pcfReferenceValueForCalculation && !pcfData.quantityOfMeasureForCalculation) {
      materialEntry.hasError = true
      materialEntry.errorMessage = 'Failed to extract PCF data from submodel'
      return
    }

    // Sum all PCF CO2 eq values (they are compatible)
    let totalPcfCO2eq = 0
    for (const pcf of pcfDataArray) {
      const pcfValue = Number.parseFloat(pcf.pcfco2eq)
      if (!Number.isNaN(pcfValue)) {
        totalPcfCO2eq += pcfValue
      }
    }

    // Extract values
    const pcfCO2eqStr = totalPcfCO2eq.toString()
    const pcfCO2eq = totalPcfCO2eq

    const referenceUnit = pcfData.pcfReferenceValueForCalculation
    const quantityStr = pcfData.quantityOfMeasureForCalculation
    const referenceQuantity = Number.parseFloat(quantityStr)

    // Validate PCF CO2 value
    if (!pcfCO2eqStr || Number.isNaN(pcfCO2eq)) {
      materialEntry.hasError = true
      materialEntry.errorMessage = 'Invalid or missing PcfCO2eq value in PCF data'
      return
    }

    if (pcfCO2eq < 0) {
      materialEntry.hasError = true
      materialEntry.errorMessage = 'PcfCO2eq value cannot be negative'
      return
    }

    // Validate reference unit and quantity
    if (!referenceUnit || !quantityStr) {
      materialEntry.unitError = true
      materialEntry.unitErrorMessage = 'Missing reference unit or quantity in PCF data'
    }

    if (Number.isNaN(referenceQuantity) || referenceQuantity === 0) {
      materialEntry.unitError = true
      materialEntry.unitErrorMessage = 'Invalid or zero reference quantity'
    }

    if (referenceQuantity < 0) {
      materialEntry.unitError = true
      materialEntry.unitErrorMessage = 'Reference quantity cannot be negative'
    }

    // Update material entry
    materialEntry.pcfCO2eq = pcfCO2eq
    materialEntry.referenceQuantity = Number.isNaN(referenceQuantity) || referenceQuantity === 0 ? 1 : referenceQuantity
    materialEntry.unit = referenceUnit || ''

    // Calculate footprint with current amount
    calculateFootprint(materialEntry)
  }

  function calculateFootprint (materialEntry: MaterialEntry): void {
    if (!materialEntry.pcfCO2eq || !materialEntry.referenceQuantity) {
      materialEntry.footprint = '0'
      return
    }

    const amount = materialEntry.amount || 0
    const calculatedFootprint = (amount / materialEntry.referenceQuantity) * materialEntry.pcfCO2eq

    materialEntry.footprint = calculatedFootprint.toFixed(2)
  }

  function addMaterial (): void {
    selectedMaterials.value.push({
      shell: null,
      amount: 0,
      footprint: '0',
      unit: '',
      pcfCO2eq: 0,
      referenceQuantity: 1,
      pcfSubmodel: null,
      hasError: false,
      errorMessage: '',
      unitError: false,
      unitErrorMessage: '',
    })
  }

  function removeMaterial (index: number): void {
    selectedMaterials.value.splice(index, 1)
  }

  function createUniqueIdSuffix (): string {
    const timestamp = Date.now()
    const randomValue = Math.floor(Math.random() * 1_000_000)
    return `_${timestamp}_${randomValue}`
  }

  function createAasInstance (idSuffix: string): any {
    const shellCopy = structuredClone(props.shell)
    const newAasId = shellCopy.id + idSuffix

    shellCopy.id = newAasId
    shellCopy.assetInformation.assetKind = 'Instance'

    // Add serial number as specific asset ID
    const randomSerialNumber = `SN${idSuffix}`
    if (!shellCopy.assetInformation.specificAssetIds) {
      shellCopy.assetInformation.specificAssetIds = []
    }
    shellCopy.assetInformation.specificAssetIds.push({
      name: 'serialNumber',
      value: randomSerialNumber,
    })

    return shellCopy
  }

  async function fetchAndCloneSubmodels (idSuffix: string): Promise<any[]> {
    const submodels = []
    const submodelRefs = props.shell.submodels || []

    for (const submodelRef of submodelRefs) {
      if (submodelRef.keys.length === 0) continue
      const smId = submodelRef.keys[0].value

      try {
        const submodel = await fetchSmById(smId)

        // Skip existing PCF submodels
        if (checkSemanticId(submodel, pcfSemanticId)) {
          continue
        }

        // Give submodel new ID with same suffix
        submodel.id = submodel.id + idSuffix
        submodels.push(submodel)
      } catch (error) {
        console.error('Error fetching submodel:', error)
      }
    }

    return submodels
  }

  function createPcfSubmodel (idSuffix: string): any {
    const pcfSubmodelId = PCF_TEMPLATE.id + idSuffix
    const pcfSubmodel = createPcfSubmodelFromTemplate(PCF_TEMPLATE, {
      submodelId: pcfSubmodelId,
      pcfCalculationMethod: 'BaSyx Web UI PCF Calculator',
      pcfCO2eq: totalCarbonFootprint.value,
      referenceUnit: 'piece',
      referenceQuantity: 1,
      lifeCyclePhase: 'A3 - Production',
    })

    if (!pcfSubmodel) {
      throw new Error('Failed to create PCF submodel from template')
    }

    return pcfSubmodel
  }

  function updateSubmodelReferences (shellCopy: any, pcfSubmodel: any, submodels: any[]): void {
    shellCopy.submodels = []

    // Add PCF submodel reference
    shellCopy.submodels.push({
      type: 'ModelReference',
      keys: [
        {
          type: 'Submodel',
          value: pcfSubmodel.id,
        },
      ],
    })

    // Add other submodel references
    for (const submodel of submodels) {
      shellCopy.submodels.push({
        type: 'ModelReference',
        keys: [
          {
            type: 'Submodel',
            value: submodel.id,
          },
        ],
      })
    }
  }

  async function uploadAas (shellCopy: any): Promise<void> {
    delete shellCopy.endpoints
    const aasInstanceOrError = jsonization.assetAdministrationShellFromJsonable(shellCopy)
    if (aasInstanceOrError.error !== null) {
      throw new Error('Failed to convert AAS: ' + JSON.stringify(aasInstanceOrError.error))
    }
    const coreworksAAS = aasInstanceOrError.mustValue()
    const aasUploaded = await postAas(coreworksAAS)

    if (!aasUploaded) {
      throw new Error('Failed to upload AAS')
    }
  }

  async function uploadSubmodels (pcfSubmodel: any, submodels: any[]): Promise<number> {
    // Upload PCF Submodel
    const pcfInstanceOrError = jsonization.submodelFromJsonable(pcfSubmodel as any)
    if (pcfInstanceOrError.error !== null) {
      throw new Error('Failed to convert PCF submodel: ' + JSON.stringify(pcfInstanceOrError.error))
    }
    const coreworksPcfSubmodel = pcfInstanceOrError.mustValue()
    const pcfUploaded = await postSubmodel(coreworksPcfSubmodel)

    if (!pcfUploaded) {
      throw new Error('Failed to upload PCF submodel')
    }

    // Upload other submodels
    let submodelsUploaded = 0
    for (const submodel of submodels) {
      try {
        const smInstanceOrError = jsonization.submodelFromJsonable(submodel)
        if (smInstanceOrError.error !== null) {
          console.error('Failed to convert submodel:', JSON.stringify(smInstanceOrError.error))
          continue
        }
        const coreworksSubmodel = smInstanceOrError.mustValue()
        const uploaded = await postSubmodel(coreworksSubmodel)
        if (uploaded) {
          submodelsUploaded++
        }
      } catch (error) {
        console.error('Error uploading submodel:', error)
      }
    }

    return submodelsUploaded
  }

  function showCompletionSnackbar (submodelsUploaded: number, totalSubmodels: number): void {
    const allSubmodelsUploaded = submodelsUploaded === totalSubmodels
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 8000,
      color: allSubmodelsUploaded ? 'success' : 'warning',
      btnColor: 'buttonText',
      text: `Successfully created AAS with PCF submodel (${submodelsUploaded + 1}/${totalSubmodels + 1} submodels uploaded)`,
    })
  }

  async function navigateToNewAas (newAasId: string, pcfSubmodelId: string): Promise<void> {
    const aasRepoUrl = infrastructureStore.getAASRepoURL
    let aasEndpoint = aasRepoUrl
    if (!aasEndpoint.endsWith('/')) aasEndpoint += '/'
    aasEndpoint += 'shells/' + base64Encode(newAasId)

    const smRepoUrl = infrastructureStore.getSubmodelRepoURL
    let pcfEndpoint = smRepoUrl
    if (!pcfEndpoint.endsWith('/')) pcfEndpoint += '/'
    pcfEndpoint += 'submodels/' + base64Encode(pcfSubmodelId)

    await router.push({
      path: '/aassmviewer',
      query: {
        aas: aasEndpoint,
        path: pcfEndpoint,
      },
    })
  }

  async function complete (): Promise<void> {
    isCompleting.value = true

    try {
      const idSuffix = createUniqueIdSuffix()
      const shellCopy = createAasInstance(idSuffix)
      const submodels = await fetchAndCloneSubmodels(idSuffix)
      const pcfSubmodel = createPcfSubmodel(idSuffix)

      updateSubmodelReferences(shellCopy, pcfSubmodel, submodels)

      await uploadAas(shellCopy)
      const submodelsUploaded = await uploadSubmodels(pcfSubmodel, submodels)

      showCompletionSnackbar(submodelsUploaded, submodels.length)
      await navigateToNewAas(shellCopy.id, pcfSubmodel.id)
    } catch (error) {
      console.error('Error completing PCF calculation:', error)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Failed to complete PCF calculation',
        extendedError: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      isCompleting.value = false
    }
  }
</script>
