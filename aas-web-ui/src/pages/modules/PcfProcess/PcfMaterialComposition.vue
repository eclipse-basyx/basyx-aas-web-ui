<template>
    <v-card border rounded="lg">
        <v-card-title class="d-flex align-center">
            <v-btn
                class="mr-3 text-buttonText"
                size="small"
                icon="mdi-arrow-left"
                color="primary"
                @click="modelValue!--" />
            <v-divider vertical inset class="ml-3 mr-6"></v-divider>
            <span>Material Selection for:</span>
            <v-list-item>
                <v-list-item-title class="text-primary">{{ nameToDisplay(shell) }}</v-list-item-title>
                <v-list-item-subtitle>{{ shell.assetInformation.globalAssetId }}</v-list-item-subtitle>
            </v-list-item>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: calc(100vh - 250px); overflow-y: auto">
            <v-list style="max-width: 840px">
                <v-list-item v-for="(material, index) in selectedMaterials" :key="index" class="px-0">
                    <div class="d-flex justify-space-around align-center">
                        <v-combobox
                            v-model="material.shell"
                            :items="materialShells"
                            item-title="idShort"
                            item-value="id"
                            variant="outlined"
                            density="compact"
                            placeholder="Select Material"
                            clearable
                            return-object
                            :error="material.hasError"
                            :error-messages="material.hasError ? material.errorMessage : []"
                            @update:model-value="fetchSubmodelsForMaterial"></v-combobox>
                        <span class="text-h6 mx-6 mb-5">X</span>
                        <v-number-input
                            v-model="material.amount"
                            :max-width="180"
                            :min="0"
                            :precision="null"
                            variant="outlined"
                            density="compact"
                            control-variant="stacked"
                            :suffix="material.unit || ''"
                            :error="material.unitError"
                            :error-messages="material.unitError ? material.unitErrorMessage : []"
                            @update:model-value="calculateFootprint(material)"></v-number-input>
                        <span class="text-h6 mx-6 mb-6">=</span>
                        <v-text-field
                            v-model="material.footprint"
                            :width="200"
                            :max-width="200"
                            variant="outlined"
                            density="compact"
                            suffix="kg CO2 eq"
                            readonly></v-text-field>
                        <v-btn
                            icon="mdi-delete"
                            variant="text"
                            color="error"
                            size="small"
                            :disabled="selectedMaterials.length === 1"
                            class="mb-6"
                            @click="removeMaterial(index)"></v-btn>
                    </div>
                </v-list-item>
                <v-list-item class="px-0">
                    <div class="d-flex justify-start align-center">
                        <v-btn
                            text="Add Material"
                            prepend-icon="mdi-plus"
                            variant="flat"
                            color="primary"
                            class="text-buttonText"
                            @click="addMaterial" />
                    </div>
                </v-list-item>
                <v-divider class="mb-2 mt-3"></v-divider>
                <v-list-item class="px-0">
                    <div class="d-flex justify-end align-center">
                        <span class="subtitle-1 mr-4">Total Carbon Footprint:</span>
                        <v-text-field
                            v-model="totalCarbonFootprint"
                            :width="200"
                            :max-width="200"
                            variant="outlined"
                            density="compact"
                            suffix="kg CO2 eq"
                            readonly
                            hide-details></v-text-field>
                        <div style="width: 40px"></div>
                    </div>
                </v-list-item>
            </v-list>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                variant="flat"
                color="success"
                class="text-none text-buttonText"
                text="Complete"
                :loading="isCompleting"
                @click="complete" />
            <v-spacer></v-spacer>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts" setup>
    import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useCarbonFootprint_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/CarbonFootprint_v1_0Utils';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';
    import PCF_TEMPLATE from './PCF_V1_0_Template.json';

    const router = useRouter();
    const infrastructureStore = useInfrastructureStore();
    const navigationStore = useNavigationStore();

    const { nameToDisplay } = useReferableUtils();
    const { fetchAasList } = useAASHandling();
    const { fetchSmById } = useSMHandling();
    const {
        extractProductCarbonFootprint,
        semanticId: pcfSemanticId,
        findPcfElement,
        setPcfElementValue,
    } = useCarbonFootprint_v1_0Utils();
    const { postAas } = useAASRepositoryClient();
    const { postSubmodel } = useSMRepositoryClient();

    const modelValue = defineModel<number>();

    const props = defineProps<{
        shell: any;
    }>();

    interface MaterialEntry {
        shell: any;
        amount: number;
        footprint: string;
        unit: string;
        pcfCO2eq: number;
        referenceQuantity: number;
        pcfSubmodel: any;
        hasError: boolean;
        errorMessage: string;
        unitError: boolean;
        unitErrorMessage: string;
    }

    const materialShells = ref<Array<any>>([]);
    const selectedMaterials = ref<Array<MaterialEntry>>([]);
    const isCompleting = ref(false);

    const totalCarbonFootprint = computed(() => {
        return selectedMaterials.value
            .reduce((sum, material) => {
                const footprint = parseFloat(material.footprint) || 0;
                return sum + footprint;
            }, 0)
            .toFixed(2);
    });

    onMounted(async () => {
        await fetchMaterialShells();
        // Initialize with one empty row
        addMaterial();
    });

    async function fetchMaterialShells(): Promise<void> {
        const unfilteredShells = await fetchAasList();
        const instanceShells = unfilteredShells.filter(
            (shell) =>
                shell['assetInformation'] &&
                shell['assetInformation']['assetKind'] &&
                shell['assetInformation']['assetKind'] === 'Instance'
        );
        materialShells.value = instanceShells.filter(
            (shell) =>
                shell['assetInformation'] &&
                shell['assetInformation']['assetType'] &&
                shell['assetInformation']['assetType'] === 'material'
        );
    }

    async function fetchSubmodelsForMaterial(selectedMaterial: any): Promise<void> {
        // Find the material entry that corresponds to this selection
        const materialEntry = selectedMaterials.value.find((m) => m.shell === selectedMaterial);

        if (!selectedMaterial) {
            // Clear material data when deselected
            if (materialEntry) {
                materialEntry.unit = '';
                materialEntry.pcfCO2eq = 0;
                materialEntry.referenceQuantity = 1;
                materialEntry.pcfSubmodel = null;
                materialEntry.footprint = '0';
                materialEntry.hasError = false;
                materialEntry.errorMessage = '';
                materialEntry.unitError = false;
                materialEntry.unitErrorMessage = '';
            }
            return;
        }

        if (!materialEntry) return;

        // Reset errors
        materialEntry.hasError = false;
        materialEntry.errorMessage = '';
        materialEntry.unitError = false;
        materialEntry.unitErrorMessage = '';

        const submodelRefs = selectedMaterial.submodels || [];

        if (submodelRefs.length === 0) {
            materialEntry.hasError = true;
            materialEntry.errorMessage = 'No submodels found for this material';
            return;
        }

        let pcfSubmodelFound = false;

        try {
            for (const submodelRef of submodelRefs) {
                // TODO: Optimize by only using the metadata endpoint once it is implemented in BaSyx Go
                const submodel = await fetchSmById(submodelRef.keys[0].value);
                // Check for carbon footprint semantic ID
                if (checkSemanticId(submodel, 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/1/0')) {
                    pcfSubmodelFound = true;
                    await updateMaterialPcfData(materialEntry, submodel);
                    break;
                }
            }

            if (!pcfSubmodelFound) {
                materialEntry.hasError = true;
                materialEntry.errorMessage = 'No Carbon Footprint submodel found for this material';
            }
        } catch (error) {
            materialEntry.hasError = true;
            materialEntry.errorMessage = 'Failed to fetch submodel data';
            console.error('Error fetching submodels:', error);
        }
    }

    async function updateMaterialPcfData(materialEntry: MaterialEntry, pcfSubmodel: any): Promise<void> {
        materialEntry.pcfSubmodel = pcfSubmodel;

        // Find ProductCarbonFootprints SubmodelElementList
        const productCarbonFootprintsSml = pcfSubmodel.submodelElements?.find(
            (sme: any) =>
                sme.idShort === 'ProductCarbonFootprint' ||
                sme.idShort === 'ProductCarbonFootprints' ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprints/1/0')
        );

        if (!productCarbonFootprintsSml || !productCarbonFootprintsSml.value) {
            materialEntry.hasError = true;
            materialEntry.errorMessage = 'Invalid PCF submodel structure: ProductCarbonFootprints missing';
            return;
        }

        // Get the first ProductCarbonFootprint SubmodelElementCollection
        const productCarbonFootprintSmc = productCarbonFootprintsSml.value.find(
            (sme: any) =>
                sme.idShort === 'ProductCarbonFootprint' ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/1/0')
        );

        if (!productCarbonFootprintSmc) {
            materialEntry.hasError = true;
            materialEntry.errorMessage = 'Invalid PCF submodel structure: ProductCarbonFootprint missing';
            return;
        }

        // Extract PCF data using the utility function
        const pcfData = extractProductCarbonFootprint(productCarbonFootprintSmc);

        // Check if extraction returned fail response (all empty)
        if (!pcfData.pcfco2eq && !pcfData.pcfReferenceValueForCalculation && !pcfData.quantityOfMeasureForCalculation) {
            materialEntry.hasError = true;
            materialEntry.errorMessage = 'Failed to extract PCF data from submodel';
            return;
        }

        // Extract values
        const pcfCO2eqStr = pcfData.pcfco2eq;
        const pcfCO2eq = parseFloat(pcfCO2eqStr);

        const referenceUnit = pcfData.pcfReferenceValueForCalculation;
        const quantityStr = pcfData.quantityOfMeasureForCalculation;
        const referenceQuantity = parseFloat(quantityStr);

        // Validate PCF CO2 value
        if (!pcfCO2eqStr || isNaN(pcfCO2eq)) {
            materialEntry.hasError = true;
            materialEntry.errorMessage = 'Invalid or missing PcfCO2eq value in PCF data';
            return;
        }

        if (pcfCO2eq < 0) {
            materialEntry.hasError = true;
            materialEntry.errorMessage = 'PcfCO2eq value cannot be negative';
            return;
        }

        // Validate reference unit and quantity
        if (!referenceUnit || !quantityStr) {
            materialEntry.unitError = true;
            materialEntry.unitErrorMessage = 'Missing reference unit or quantity in PCF data';
        }

        if (isNaN(referenceQuantity) || referenceQuantity === 0) {
            materialEntry.unitError = true;
            materialEntry.unitErrorMessage = 'Invalid or zero reference quantity';
        }

        if (referenceQuantity < 0) {
            materialEntry.unitError = true;
            materialEntry.unitErrorMessage = 'Reference quantity cannot be negative';
        }

        // Update material entry
        materialEntry.pcfCO2eq = pcfCO2eq;
        materialEntry.referenceQuantity = isNaN(referenceQuantity) || referenceQuantity === 0 ? 1 : referenceQuantity;
        materialEntry.unit = referenceUnit || '';

        // Calculate footprint with current amount
        calculateFootprint(materialEntry);
    }

    function calculateFootprint(materialEntry: MaterialEntry): void {
        if (!materialEntry.pcfCO2eq || !materialEntry.referenceQuantity) {
            materialEntry.footprint = '0';
            return;
        }

        const amount = materialEntry.amount || 0;
        const calculatedFootprint = (amount / materialEntry.referenceQuantity) * materialEntry.pcfCO2eq;

        materialEntry.footprint = calculatedFootprint.toFixed(2);
    }

    function addMaterial(): void {
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
        });
    }

    function removeMaterial(index: number): void {
        selectedMaterials.value.splice(index, 1);
    }

    async function complete(): Promise<void> {
        isCompleting.value = true;

        try {
            // Step 1: Create a copy of the shell
            const shellCopy = JSON.parse(JSON.stringify(props.shell));

            // Step 2: Generate new IDs with timestamp and random value
            const timestamp = Date.now();
            const randomValue = Math.floor(Math.random() * 1000000);
            const idSuffix = `_${timestamp}_${randomValue}`;
            const newAasId = shellCopy.id + idSuffix;

            shellCopy.id = newAasId;
            shellCopy.assetInformation.assetKind = 'Instance';

            // Add specific asset ID with serial number
            const randomSerialNumber = `SN-${timestamp}-${randomValue}`;
            if (!shellCopy.assetInformation.specificAssetIds) {
                shellCopy.assetInformation.specificAssetIds = [];
            }
            shellCopy.assetInformation.specificAssetIds.push({
                name: 'serialNumber',
                value: randomSerialNumber,
            });

            // Step 3: Fetch all submodels from original AAS
            const submodels = [];
            const submodelRefs = props.shell.submodels || [];

            for (const submodelRef of submodelRefs) {
                if (submodelRef.keys.length === 0) continue;
                const smId = submodelRef.keys[0].value;

                try {
                    const submodel = await fetchSmById(smId);

                    // Skip existing PCF submodels
                    if (checkSemanticId(submodel, pcfSemanticId)) {
                        continue;
                    }

                    // Step 4: Give submodel new ID with same suffix
                    submodel.id = submodel.id + idSuffix;
                    submodels.push(submodel);
                } catch (error) {
                    console.error('Error fetching submodel:', error);
                }
            }

            // Step 5: Create PCF submodel from template
            const pcfSubmodel = JSON.parse(JSON.stringify(PCF_TEMPLATE));
            const pcfSubmodelId = pcfSubmodel.id + idSuffix;
            pcfSubmodel.id = pcfSubmodelId;
            pcfSubmodel.kind = 'Instance';

            // Get current date in ISO format
            const currentDate = new Date().toISOString();

            // Find and populate the PCF values in the template using semantic IDs
            const productCarbonFootprintsSml = findPcfElement(
                pcfSubmodel,
                'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprints/1/0',
                'ProductCarbonFootprints',
                true
            );

            if (
                productCarbonFootprintsSml &&
                productCarbonFootprintsSml.value &&
                productCarbonFootprintsSml.value.length > 0
            ) {
                const productCarbonFootprintSmc = productCarbonFootprintsSml.value[0];

                // Set PcfCalculationMethod
                const pcfCalculationMethodsSml = findPcfElement(
                    productCarbonFootprintSmc,
                    'https://admin-shell.io/idta/CarbonFootprint/PcfCalculationMethods/1/0',
                    'PcfCalculationMethods',
                    true
                );
                if (pcfCalculationMethodsSml) {
                    pcfCalculationMethodsSml.value = [
                        {
                            modelType: 'Property',
                            valueType: 'xs:string',
                            value: 'BaSyx Web UI PCF Calculator',
                            idShort: 'PcfCalculationMethod',
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: '0173-1#02-ABG854#003',
                                    },
                                ],
                            },
                        },
                    ];
                }

                // Set PcfCO2eq
                setPcfElementValue(
                    productCarbonFootprintSmc,
                    '0173-1#02-ABG855#001',
                    'PcfCO2eq',
                    totalCarbonFootprint.value
                );

                // Set ReferenceImpactUnitForCalculation
                setPcfElementValue(
                    productCarbonFootprintSmc,
                    '0173-1#02-ABG856#003',
                    'ReferenceImpactUnitForCalculation',
                    'piece'
                );

                // Set QuantityOfMeasureForCalculation
                setPcfElementValue(
                    productCarbonFootprintSmc,
                    '0173-1#02-ABG857#003',
                    'QuantityOfMeasureForCalculation',
                    1
                );

                // Set LifeCyclePhases
                const lifeCyclePhasesSml = findPcfElement(
                    productCarbonFootprintSmc,
                    'https://admin-shell.io/idta/CarbonFootprint/LifeCyclePhases/1/0',
                    'LifeCyclePhases',
                    true
                );
                if (lifeCyclePhasesSml) {
                    lifeCyclePhasesSml.value = [
                        {
                            modelType: 'Property',
                            valueType: 'xs:string',
                            value: 'A3 - Production',
                            valueId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: '0173-1#07-ABU210#003',
                                    },
                                ],
                            },
                            idShort: 'LifeCyclePhase',
                        },
                    ];
                }

                // Set PublicationDate
                setPcfElementValue(
                    productCarbonFootprintSmc,
                    'https://admin-shell.io/idta/CarbonFootprint/PublicationDate/1/0',
                    'PublicationDate',
                    currentDate
                );

                // Remove ExpirationDate value (keep empty)
                const expirationDateProp = findPcfElement(
                    productCarbonFootprintSmc,
                    'https://admin-shell.io/idta/CarbonFootprint/ExpirationDate/1/0',
                    'ExpirationDate'
                );
                if (expirationDateProp) {
                    delete expirationDateProp.value;
                }
            }

            // Step 6: Clear old submodel references and add new ones
            shellCopy.submodels = [];

            // Add PCF submodel reference
            shellCopy.submodels.push({
                type: 'ModelReference',
                keys: [
                    {
                        type: 'Submodel',
                        value: pcfSubmodelId,
                    },
                ],
            });

            // Add other submodel references with new IDs
            for (const submodel of submodels) {
                shellCopy.submodels.push({
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'Submodel',
                            value: submodel.id,
                        },
                    ],
                });
            }

            // Step 7: Upload AAS to default infrastructure
            delete shellCopy.endpoints;
            const aasInstanceOrError = jsonization.assetAdministrationShellFromJsonable(shellCopy);
            if (aasInstanceOrError.error !== null) {
                throw new Error('Failed to convert AAS: ' + aasInstanceOrError.error);
            }
            const coreworksAAS = aasInstanceOrError.mustValue();
            const aasUploaded = await postAas(coreworksAAS);

            if (!aasUploaded) {
                throw new Error('Failed to upload AAS');
            }

            // Step 8: Upload PCF Submodel
            const pcfInstanceOrError = jsonization.submodelFromJsonable(pcfSubmodel);
            if (pcfInstanceOrError.error !== null) {
                throw new Error('Failed to convert PCF submodel: ' + pcfInstanceOrError.error);
            }
            const coreworksPcfSubmodel = pcfInstanceOrError.mustValue();
            const pcfUploaded = await postSubmodel(coreworksPcfSubmodel);

            if (!pcfUploaded) {
                throw new Error('Failed to upload PCF submodel');
            }

            // Upload other submodels
            let submodelsUploaded = 0;
            for (const submodel of submodels) {
                try {
                    const smInstanceOrError = jsonization.submodelFromJsonable(submodel);
                    if (smInstanceOrError.error !== null) {
                        console.error('Failed to convert submodel:', smInstanceOrError.error);
                        continue;
                    }
                    const coreworksSubmodel = smInstanceOrError.mustValue();
                    const uploaded = await postSubmodel(coreworksSubmodel);
                    if (uploaded) {
                        submodelsUploaded++;
                    }
                } catch (error) {
                    console.error('Error uploading submodel:', error);
                }
            }

            // Step 9: Navigate to the new AAS with PCF submodel
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'success',
                btnColor: 'buttonText',
                text: `Successfully created AAS with PCF submodel (${submodelsUploaded + 1}/${submodels.length + 1} submodels uploaded)`,
            });

            // Construct AAS and PCF submodel endpoint paths
            const aasRepoUrl = infrastructureStore.getAASRepoURL;
            let aasEndpoint = aasRepoUrl;
            if (!aasEndpoint.endsWith('/')) aasEndpoint += '/';
            aasEndpoint += 'shells/' + base64Encode(newAasId);

            const smRepoUrl = infrastructureStore.getSubmodelRepoURL;
            let pcfEndpoint = smRepoUrl;
            if (!pcfEndpoint.endsWith('/')) pcfEndpoint += '/';
            pcfEndpoint += 'submodels/' + base64Encode(pcfSubmodelId);

            // Navigate to the new AAS with the PCF submodel selected
            // Don't dispatch to store - let the router handle fetching and dispatching
            await router.push({
                path: '/aassmviewer',
                query: {
                    aas: aasEndpoint,
                    path: pcfEndpoint,
                },
            });
        } catch (error) {
            console.error('Error completing PCF calculation:', error);
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Failed to complete PCF calculation',
                extendedError: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            isCompleting.value = false;
        }
    }
</script>
