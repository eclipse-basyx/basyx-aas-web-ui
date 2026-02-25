<template>
    <v-sheet
        v-for="(embeddedDataSpecification, index) in embeddedDataSpecificationsValue ?? []"
        :key="index"
        class="mb-4"
        border
        rounded>
        <v-card-actions class="bg-cardHeader">
            <div class="ml-2">Embedded Data Specification {{ index + 1 }}</div>
            <v-spacer></v-spacer>
            <v-btn
                prepend-icon="mdi-delete"
                variant="text"
                text="Remove"
                class="text-none"
                @click="removeEmbeddedDataSpecification(index)"></v-btn>
        </v-card-actions>
        <v-divider></v-divider>
        <v-card-text class="pt-7">
            <!-- Data Specification (Reference) -->
            <v-row align="center">
                <v-col class="py-0">
                    <ReferenceInput v-model="embeddedDataSpecification.dataSpecification" label="Data Specification" />
                </v-col>
            </v-row>
            <!-- Content Type (Currently only IEC 61360 is supported) -->
            <v-row align="center">
                <v-col class="py-0">
                    <v-select
                        :model-value="getContentType(embeddedDataSpecification)"
                        :items="contentTypeOptions"
                        label="Content Type"
                        variant="outlined"
                        density="comfortable"
                        @update:model-value="setContentType(index, $event)"></v-select>
                </v-col>
            </v-row>
            <!-- IEC 61360 Content -->
            <template v-if="isIec61360Content(embeddedDataSpecification)">
                <!-- Preferred Name -->
                <v-row align="center">
                    <v-col class="py-0">
                        <MultiLanguageTextInput
                            v-model="embeddedDataSpecification.dataSpecificationContent.preferredName"
                            :show-label="true"
                            label="Preferred Name"
                            type="preferredNameIec61360" />
                    </v-col>
                </v-row>
                <!-- Short Name -->
                <v-row align="center">
                    <v-col class="py-0">
                        <MultiLanguageTextInput
                            v-model="embeddedDataSpecification.dataSpecificationContent.shortName"
                            :show-label="true"
                            label="Short Name"
                            type="shortNameIec61360" />
                    </v-col>
                </v-row>
                <!-- Data Type -->
                <v-row align="center">
                    <v-col class="py-0">
                        <v-select
                            v-model="embeddedDataSpecification.dataSpecificationContent.dataType"
                            :items="dataTypeIec61360Options"
                            label="Data Type"
                            variant="outlined"
                            density="comfortable"
                            clearable></v-select>
                    </v-col>
                </v-row>
                <!-- Unit -->
                <v-row align="center">
                    <v-col class="py-0">
                        <TextInput v-model="embeddedDataSpecification.dataSpecificationContent.unit" label="Unit" />
                    </v-col>
                </v-row>
                <!-- Unit ID (Reference) -->
                <v-row align="center">
                    <v-col class="py-0">
                        <v-divider></v-divider>
                        <v-list-item class="pl-0 pt-0">
                            <template #title>
                                <div class="text-subtitle-2">Unit ID</div>
                            </template>
                        </v-list-item>
                        <v-btn
                            v-if="embeddedDataSpecification.dataSpecificationContent.unitId === null"
                            color="primary"
                            prepend-icon="mdi-plus"
                            variant="outlined"
                            text="Add Unit ID"
                            class="text-none mt-1 mb-4"
                            @click="addUnitId(index)"></v-btn>
                        <ReferenceInput
                            v-else
                            v-model="embeddedDataSpecification.dataSpecificationContent.unitId"
                            label="Unit ID"
                            :no-header="true" />
                    </v-col>
                </v-row>
                <!-- Source of Definition -->
                <v-row align="center">
                    <v-col class="py-0">
                        <TextInput
                            v-model="embeddedDataSpecification.dataSpecificationContent.sourceOfDefinition"
                            label="Source Of Definition" />
                    </v-col>
                </v-row>
                <!-- Symbol -->
                <v-row align="center">
                    <v-col class="py-0">
                        <TextInput v-model="embeddedDataSpecification.dataSpecificationContent.symbol" label="Symbol" />
                    </v-col>
                </v-row>
                <!-- Definition -->
                <v-row align="center">
                    <v-col class="py-0">
                        <MultiLanguageTextInput
                            v-model="embeddedDataSpecification.dataSpecificationContent.definition"
                            :show-label="true"
                            label="Definition"
                            type="definitionIec61360" />
                    </v-col>
                </v-row>
                <!-- Value Format -->
                <v-row align="center">
                    <v-col class="py-0">
                        <TextInput
                            v-model="embeddedDataSpecification.dataSpecificationContent.valueFormat"
                            label="Value Format" />
                    </v-col>
                </v-row>
                <!-- Value -->
                <v-row align="center">
                    <v-col class="py-0">
                        <TextInput v-model="embeddedDataSpecification.dataSpecificationContent.value" label="Value" />
                    </v-col>
                </v-row>
                <!-- Value List -->
                <v-row align="center">
                    <v-col class="py-0">
                        <v-divider></v-divider>
                        <v-list-item class="pl-0 pt-0">
                            <template #title>
                                <div class="text-subtitle-2">Value List</div>
                            </template>
                        </v-list-item>
                        <v-btn
                            v-if="embeddedDataSpecification.dataSpecificationContent.valueList === null"
                            color="primary"
                            prepend-icon="mdi-plus"
                            variant="outlined"
                            text="Add Value List"
                            class="text-none mt-1 mb-4"
                            @click="initializeValueList(index)"></v-btn>
                        <template v-else>
                            <v-sheet
                                v-for="(valueReferencePair, valueReferencePairIndex) in embeddedDataSpecification
                                    .dataSpecificationContent.valueList.valueReferencePairs"
                                :key="valueReferencePairIndex"
                                class="mb-4"
                                border
                                rounded>
                                <v-card-text class="pt-4">
                                    <TextInput
                                        v-model="valueReferencePair.value"
                                        label="Value"
                                        :show-delete-button="true"
                                        @click:delete="removeValueReferencePair(index, valueReferencePairIndex)" />
                                    <v-row align="center">
                                        <v-col class="py-0">
                                            <v-btn
                                                v-if="valueReferencePair.valueId === null"
                                                color="primary"
                                                prepend-icon="mdi-plus"
                                                variant="outlined"
                                                text="Add Value ID"
                                                class="text-none mt-1 mb-4"
                                                @click="
                                                    addValueReferencePairValueId(index, valueReferencePairIndex)
                                                "></v-btn>
                                            <ReferenceInput
                                                v-else
                                                v-model="valueReferencePair.valueId"
                                                label="Value ID"
                                                :no-header="true" />
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-sheet>
                            <v-btn
                                color="primary"
                                prepend-icon="mdi-plus"
                                variant="outlined"
                                text="Add Value Pair"
                                class="text-none mt-1 mb-4"
                                @click="addValueReferencePair(index)"></v-btn>
                        </template>
                    </v-col>
                </v-row>
                <!-- Level Type -->
                <v-row align="center">
                    <v-col class="py-0">
                        <v-divider></v-divider>
                        <v-list-item class="pl-0 pt-0">
                            <template #title>
                                <div class="text-subtitle-2">Level Type</div>
                            </template>
                        </v-list-item>
                        <v-btn
                            v-if="embeddedDataSpecification.dataSpecificationContent.levelType === null"
                            color="primary"
                            prepend-icon="mdi-plus"
                            variant="outlined"
                            text="Add Level Type"
                            class="text-none mt-1 mb-4"
                            @click="initializeLevelType(index)"></v-btn>
                        <v-row v-else no-gutters class="mb-3 mx-n1">
                            <v-col cols="6" class="pa-1">
                                <v-sheet border rounded class="pl-1">
                                    <v-checkbox
                                        v-model="embeddedDataSpecification.dataSpecificationContent.levelType.min"
                                        hide-details
                                        label="Min"></v-checkbox>
                                </v-sheet>
                            </v-col>
                            <v-col cols="6" class="pa-1">
                                <v-sheet border rounded class="pl-1">
                                    <v-checkbox
                                        v-model="embeddedDataSpecification.dataSpecificationContent.levelType.nom"
                                        hide-details
                                        label="Nom"></v-checkbox>
                                </v-sheet>
                            </v-col>
                            <v-col cols="6" class="pa-1">
                                <v-sheet border rounded class="pl-1">
                                    <v-checkbox
                                        v-model="embeddedDataSpecification.dataSpecificationContent.levelType.typ"
                                        hide-details
                                        label="Typ"></v-checkbox>
                                </v-sheet>
                            </v-col>
                            <v-col cols="6" class="pa-1">
                                <v-sheet border rounded class="pl-1">
                                    <v-checkbox
                                        v-model="embeddedDataSpecification.dataSpecificationContent.levelType.max"
                                        hide-details
                                        label="Max"></v-checkbox>
                                </v-sheet>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </template>

            <v-alert
                v-else
                type="warning"
                variant="tonal"
                class="mt-2"
                text="The existing content type is currently not editable. Select IEC 61360 to replace it."></v-alert>
        </v-card-text>
    </v-sheet>

    <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="outlined"
        text="Add Embedded Data Specification"
        class="text-none mt-1 mb-4"
        @click="addEmbeddedDataSpecification"></v-btn>
</template>

<script setup lang="ts">
    import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
    import { computed, ref, watch } from 'vue';

    const IEC_61360_DATA_SPEC_IRI = 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0';

    type ContentType = 'DataSpecificationIec61360' | 'Unsupported';

    const props = defineProps<{
        modelValue: Array<aasTypes.EmbeddedDataSpecification> | null;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: Array<aasTypes.EmbeddedDataSpecification> | null): void;
    }>();

    const embeddedDataSpecificationsValue = ref<Array<aasTypes.EmbeddedDataSpecification> | null>(props.modelValue);

    const contentTypeOptions = [{ title: 'IEC 61360', value: 'DataSpecificationIec61360' }];

    const dataTypeIec61360Options = computed(() => {
        return Object.entries(aasTypes.DataTypeIec61360)
            .filter(([, value]) => typeof value === 'number')
            .map(([title, value]) => ({
                title,
                value: value as aasTypes.DataTypeIec61360,
            }));
    });

    watch(
        embeddedDataSpecificationsValue,
        (newValue) => {
            emit('update:modelValue', newValue);
        },
        { deep: true }
    );

    watch(
        () => props.modelValue,
        (newValue) => {
            embeddedDataSpecificationsValue.value = newValue;
        }
    );

    function createDefaultDataSpecificationReference(): aasTypes.Reference {
        return new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
            new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, IEC_61360_DATA_SPEC_IRI),
        ]);
    }

    function createDefaultIec61360Content(): aasTypes.DataSpecificationIec61360 {
        return new aasTypes.DataSpecificationIec61360([]);
    }

    function addEmbeddedDataSpecification(): void {
        if (embeddedDataSpecificationsValue.value === null) {
            embeddedDataSpecificationsValue.value = [];
        }

        embeddedDataSpecificationsValue.value.push(
            new aasTypes.EmbeddedDataSpecification(
                createDefaultDataSpecificationReference(),
                createDefaultIec61360Content()
            )
        );
    }

    function removeEmbeddedDataSpecification(index: number): void {
        if (embeddedDataSpecificationsValue.value === null || !embeddedDataSpecificationsValue.value[index]) {
            return;
        }

        embeddedDataSpecificationsValue.value.splice(index, 1);
        if (embeddedDataSpecificationsValue.value.length === 0) {
            embeddedDataSpecificationsValue.value = null;
        }
    }

    function isIec61360Content(
        embeddedDataSpecification: aasTypes.EmbeddedDataSpecification
    ): embeddedDataSpecification is aasTypes.EmbeddedDataSpecification & {
        dataSpecificationContent: aasTypes.DataSpecificationIec61360;
    } {
        return embeddedDataSpecification.dataSpecificationContent instanceof aasTypes.DataSpecificationIec61360;
    }

    function getContentType(embeddedDataSpecification: aasTypes.EmbeddedDataSpecification): ContentType {
        if (isIec61360Content(embeddedDataSpecification)) {
            return 'DataSpecificationIec61360';
        }

        return 'Unsupported';
    }

    function setContentType(index: number, contentType: ContentType): void {
        if (embeddedDataSpecificationsValue.value === null || !embeddedDataSpecificationsValue.value[index]) {
            return;
        }

        if (contentType === 'DataSpecificationIec61360') {
            embeddedDataSpecificationsValue.value[index].dataSpecificationContent = createDefaultIec61360Content();
        }
    }

    function addUnitId(index: number): void {
        const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index];
        if (!embeddedDataSpecification || !isIec61360Content(embeddedDataSpecification)) {
            return;
        }

        embeddedDataSpecification.dataSpecificationContent.unitId = new aasTypes.Reference(
            aasTypes.ReferenceTypes.ExternalReference,
            [new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, '')]
        );
    }

    function initializeValueList(index: number): void {
        const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index];
        if (!embeddedDataSpecification || !isIec61360Content(embeddedDataSpecification)) {
            return;
        }

        embeddedDataSpecification.dataSpecificationContent.valueList = new aasTypes.ValueList([
            new aasTypes.ValueReferencePair(''),
        ]);
    }

    function addValueReferencePair(index: number): void {
        const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index];
        if (
            !embeddedDataSpecification ||
            !isIec61360Content(embeddedDataSpecification) ||
            embeddedDataSpecification.dataSpecificationContent.valueList === null
        ) {
            return;
        }

        embeddedDataSpecification.dataSpecificationContent.valueList.valueReferencePairs.push(
            new aasTypes.ValueReferencePair('')
        );
    }

    function removeValueReferencePair(index: number, valueReferencePairIndex: number): void {
        const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index];
        if (
            !embeddedDataSpecification ||
            !isIec61360Content(embeddedDataSpecification) ||
            embeddedDataSpecification.dataSpecificationContent.valueList === null
        ) {
            return;
        }

        embeddedDataSpecification.dataSpecificationContent.valueList.valueReferencePairs.splice(
            valueReferencePairIndex,
            1
        );
    }

    function addValueReferencePairValueId(index: number, valueReferencePairIndex: number): void {
        const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index];
        if (
            !embeddedDataSpecification ||
            !isIec61360Content(embeddedDataSpecification) ||
            embeddedDataSpecification.dataSpecificationContent.valueList === null
        ) {
            return;
        }

        const valueReferencePair =
            embeddedDataSpecification.dataSpecificationContent.valueList.valueReferencePairs[valueReferencePairIndex];
        if (!valueReferencePair) {
            return;
        }

        valueReferencePair.valueId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
            new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, ''),
        ]);
    }

    function initializeLevelType(index: number): void {
        const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index];
        if (!embeddedDataSpecification || !isIec61360Content(embeddedDataSpecification)) {
            return;
        }

        embeddedDataSpecification.dataSpecificationContent.levelType = new aasTypes.LevelType(
            false,
            false,
            false,
            false
        );
    }
</script>
