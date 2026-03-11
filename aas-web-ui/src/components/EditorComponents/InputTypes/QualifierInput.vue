<template>
    <v-sheet v-for="(qualifier, index) in qualifiersValue ?? []" :key="index" class="mb-4" border rounded>
        <v-card-actions class="bg-cardHeader">
            <div class="ml-2">Qualifier {{ index + 1 }}</div>
            <v-spacer></v-spacer>
            <v-btn
                prepend-icon="mdi-delete"
                variant="text"
                text="Remove Qualifier"
                class="text-none"
                @click="removeQualifier(index)"></v-btn>
        </v-card-actions>
        <v-divider></v-divider>
        <v-card-text class="pt-7">
            <v-row align="center">
                <v-col class="py-0">
                    <TextInput v-model="qualifier.type" label="Type" />
                </v-col>
            </v-row>

            <v-row align="center">
                <v-col class="py-0">
                    <SelectInput v-model="qualifier.valueType" label="Value Type" type="dataType" :clearable="false" />
                </v-col>
            </v-row>

            <v-row align="center">
                <v-col class="py-0">
                    <TextInput v-model="qualifier.value" label="Value" />
                </v-col>
            </v-row>

            <v-row align="center">
                <v-col class="py-0">
                    <SelectInput v-model="qualifier.kind" label="Kind" type="qualifierKind" :clearable="true" />
                </v-col>
            </v-row>

            <v-row align="center">
                <v-col class="py-0">
                    <v-divider></v-divider>
                    <v-list-item class="pl-0 pt-0">
                        <template #title>
                            <div class="text-subtitle-2">Semantic ID</div>
                        </template>
                    </v-list-item>
                    <v-btn
                        v-if="qualifier.semanticId === null"
                        color="primary"
                        prepend-icon="mdi-plus"
                        variant="outlined"
                        text="Add Semantic ID"
                        class="text-none mt-1 mb-4"
                        @click="addSemanticId(index)"></v-btn>
                    <ReferenceInput v-else v-model="qualifier.semanticId" label="Semantic ID" :no-header="true" />
                </v-col>
            </v-row>

            <v-row align="center">
                <v-col class="py-0">
                    <v-divider></v-divider>
                    <v-list-item class="pl-0 pt-0">
                        <template #title>
                            <div class="text-subtitle-2">Value ID</div>
                        </template>
                    </v-list-item>
                    <v-btn
                        v-if="qualifier.valueId === null"
                        color="primary"
                        prepend-icon="mdi-plus"
                        variant="outlined"
                        text="Add Value ID"
                        class="text-none mt-1 mb-4"
                        @click="addValueId(index)"></v-btn>
                    <ReferenceInput v-else v-model="qualifier.valueId" label="Value ID" :no-header="true" />
                </v-col>
            </v-row>
        </v-card-text>
    </v-sheet>

    <v-row align="center" class="mt-1 mb-4">
        <v-col cols="auto" class="py-0">
            <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                variant="outlined"
                text="Add Qualifier"
                class="text-none"
                @click="addQualifier" />
        </v-col>

        <v-spacer />
        <v-divider vertical />
        <v-spacer />

        <v-col cols="auto" class="py-0">
            <v-select
                v-model="predefinedQualifierSelected"
                :items="predefinedQualifier"
                item-title="title"
                item-value="qualifier"
                label="Default Qualifier"
                variant="outlined"
                density="comfortable"
                hide-details />
        </v-col>

        <v-col class="py-0" cols="auto">
            <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                variant="outlined"
                text="Add selected Qualifier"
                class="text-none"
                @click="addPredefinedQualifier" />
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
    import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
    import { ref, watch } from 'vue';

    const props = defineProps<{
        modelValue: Array<aasTypes.Qualifier> | null;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: Array<aasTypes.Qualifier> | null): void;
    }>();

    const qualifiersValue = ref<Array<aasTypes.Qualifier> | null>(props.modelValue);
    const predefinedQualifierSelected = ref<aasTypes.Qualifier | null>(null);

    const predefinedQualifier = [
        {
            title: 'SMT/Cardinality One',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://adminshell.io/SubmodelTemplates/Cardinality/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                'One',
                null
            ),
        },
        {
            title: 'SMT/Cardinality ZeroToOne',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://adminshell.io/SubmodelTemplates/Cardinality/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                'ZeroToOne',
                null
            ),
        },
        {
            title: 'SMT/Cardinality ZeroToMany',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://adminshell.io/SubmodelTemplates/Cardinality/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                'ZeroToMany',
                null
            ),
        },
        {
            title: 'SMT/Cardinality OneToMany',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://adminshell.io/SubmodelTemplates/Cardinality/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                'OneToMany',
                null
            ),
        },
    ];

    watch(
        qualifiersValue,
        (newValue) => {
            emit('update:modelValue', newValue);
        },
        { deep: true }
    );

    watch(
        () => props.modelValue,
        (newValue) => {
            qualifiersValue.value = newValue;
        }
    );

    function addQualifier(): void {
        if (qualifiersValue.value === null) {
            qualifiersValue.value = [];
        }
        qualifiersValue.value.push(new aasTypes.Qualifier('', aasTypes.DataTypeDefXsd.String));
    }

    function addPredefinedQualifier(): void {
        if (qualifiersValue.value === null) {
            qualifiersValue.value = [];
        }

        if (predefinedQualifierSelected.value !== null)
            qualifiersValue.value.push(predefinedQualifierSelected.value as aasTypes.Qualifier);
    }

    function removeQualifier(index: number): void {
        if (qualifiersValue.value === null) {
            return;
        }

        qualifiersValue.value.splice(index, 1);
        if (qualifiersValue.value.length === 0) {
            qualifiersValue.value = null;
        }
    }

    function addSemanticId(index: number): void {
        if (qualifiersValue.value === null || !qualifiersValue.value[index]) {
            return;
        }

        qualifiersValue.value[index].semanticId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
            new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, ''),
        ]);
    }

    function addValueId(index: number): void {
        if (qualifiersValue.value === null || !qualifiersValue.value[index]) {
            return;
        }

        qualifiersValue.value[index].valueId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
            new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, ''),
        ]);
    }
</script>
