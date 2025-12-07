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
            <v-btn variant="flat" color="success" class="text-none text-buttonText" text="Complete" @click="complete" />
            <v-spacer></v-spacer>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useCarbonFootprint_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/CarbonFootprint_v1_0Utils';
    import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';

    const { nameToDisplay } = useReferableUtils();
    const { fetchAasList } = useAASHandling();
    const { fetchSmById } = useSMHandling();
    const { extractProductCarbonFootprint } = useCarbonFootprint_v1_0Utils();

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

    function complete(): void {
        console.log('Material composition completed for shell:', props.shell);
    }
</script>
