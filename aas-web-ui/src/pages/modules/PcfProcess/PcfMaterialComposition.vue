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
        <v-card-text style="height: calc(100vh - 250px)">
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
                            hide-details
                            return-object></v-combobox>
                        <span class="text-h6 mx-6">X</span>
                        <v-number-input
                            v-model="material.amount"
                            :max-width="180"
                            :min="0"
                            variant="outlined"
                            density="compact"
                            control-variant="stacked"
                            suffix="l"
                            hide-details></v-number-input>
                        <span class="text-h6 mx-6">=</span>
                        <v-text-field
                            v-model="material.footprint"
                            :width="200"
                            :max-width="200"
                            variant="outlined"
                            density="compact"
                            suffix="kg CO2 eq"
                            readonly
                            hide-details></v-text-field>
                        <v-btn
                            icon="mdi-delete"
                            variant="text"
                            color="error"
                            size="small"
                            :disabled="selectedMaterials.length === 1"
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
    import { onMounted, ref } from 'vue';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    const { nameToDisplay } = useReferableUtils();
    const { fetchAasList } = useAASHandling();

    const modelValue = defineModel<number>();

    const props = defineProps<{
        shell: any;
    }>();

    interface MaterialEntry {
        shell: any;
        amount: number;
        footprint: string;
    }

    const materialShells = ref<Array<any>>([]);
    const selectedMaterials = ref<Array<MaterialEntry>>([]);

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

    function addMaterial(): void {
        selectedMaterials.value.push({
            shell: null,
            amount: 0,
            footprint: '0',
        });
    }

    function removeMaterial(index: number): void {
        selectedMaterials.value.splice(index, 1);
    }

    function complete(): void {
        console.log('Material composition completed for shell:', props.shell);
    }
</script>
