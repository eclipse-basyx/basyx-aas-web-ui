<template>
    <v-dialog v-model="editPropertyDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ newProperty ? 'Create a new Property' : 'Edit Property' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput v-model="propertyIdShort" label="IdShort" />
                            <MultiLanguageTextInput v-model="displayName" label="Display Name" type="displayName" />
                            <MultiLanguageTextInput v-model="description" label="Description" type="description" />
                            <SelectInput
                                v-model="propertyCategory"
                                label="Category"
                                type="category"
                                :clearable="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <ReferenceInput v-model="semanticId" label="Semantic ID" :no-header="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Property Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <SelectInput v-model="valueType" label="Data Type" type="dataType" :clearable="true" />
                            <TextInput v-model="propertyValue" label="Value" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Extensions</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(3)">
                        <v-expansion-panel-title>Data Specification</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">Cancel</v-btn>
                <v-btn @click="saveProperty" color="primary">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useNavigationStore } from "@/store/NavigationStore";

    const navigationStore = useNavigationStore();

    const editPropertyDialog = ref(false);
    const openPanels = ref<number[]>([0]);
    const propertyIdShort = ref<string>('');

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const propertyCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const propertyValue = ref<string>('');
    const valueType = ref<aasTypes.DataTypeDefXsd>(aasTypes.DataTypeDefXsd.String);

    const errors = ref<Map<string, string>>(new Map());

    const props = defineProps<{
        modelValue: boolean;
        newProperty: boolean;
        submodel: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    watch(
        () => props.modelValue,
        (value) => {
            editPropertyDialog.value = value;
            if (value) {
                //initializeInputs();
            }
        }
    );

    watch(
        () => editPropertyDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    const bordersToShow = computed(() => (panel: number) => {
        let border = '';
        switch (panel) {
            case 0:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border = 'border-b-thin';
                }
                break;
            case 1:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-b-thin';
                }
                break;
            case 2:
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border += ' border-b-thin';
                }
                break;
            case 3:
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border = 'border-t-thin';
                }
                break;
        }
        return border;
    });

    function hasError(field: string): boolean {
        return errors.value.has(field);
    }

    function getError(field: string): string | undefined {
        if (!hasError(field)) {
            return undefined;
        }
        return errors.value.get(field);
    }

    async function saveProperty(): Promise<void> {
        const client = useSMRepositoryClient();
        const property: aasTypes.Property = new aasTypes.Property(valueType.value);
        if (propertyIdShort.value.length > 0) {
            property.idShort = propertyIdShort.value;
        }
        if (propertyValue.value.length > 0) {
            property.value = propertyValue.value;
        }
        if (semanticId.value !== null) {
            property.semanticId = semanticId.value;
        }
        if (displayName.value !== null) {
            property.displayName = displayName.value;
        }
        if (description.value !== null) {
            property.description = description.value;
        }
        if (propertyCategory.value !== null) {
            property.category = propertyCategory.value;
        }
        if (props.newProperty) {
            await client.postSubmodelElement(property, props.submodel.id);
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editPropertyDialog.value = false;
    }
</script>
