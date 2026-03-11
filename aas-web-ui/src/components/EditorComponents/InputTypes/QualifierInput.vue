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
                text="Add empty Qualifier"
                class="text-none"
                @click="addQualifier" />
        </v-col>

        <v-spacer />
        <v-divider vertical />
        <v-spacer />

        <v-col cols="auto" class="py-0">
            <v-select
                v-model="predefinedQualifierItemSelected"
                :items="predefinedQualifierItems"
                item-title="title"
                item-value="qualifier"
                label="Predefined Qualifier"
                variant="outlined"
                density="comfortable"
                hide-details />
        </v-col>

        <v-col class="py-0" cols="auto">
            <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                variant="outlined"
                text="Add predefined Qualifier"
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
    const predefinedQualifierItems = [
        {
            title: 'SMT/Cardinality One',
            description:
                'This Qualifier allows to specify how many SubmodelElement instances of this SMT element are allowed in the actual collection (hierarchy level of the Submodel).',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/Cardinality/1/0'
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
            description:
                'This Qualifier allows to specify how many SubmodelElement instances of this SMT element are allowed in the actual collection (hierarchy level of the Submodel).',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/Cardinality/1/0'
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
            description:
                'This Qualifier allows to specify how many SubmodelElement instances of this SMT element are allowed in the actual collection (hierarchy level of the Submodel).',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/Cardinality/1/0'
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
            description:
                'This Qualifier allows to specify how many SubmodelElement instances of this SMT element are allowed in the actual collection (hierarchy level of the Submodel).',
            qualifier: new aasTypes.Qualifier(
                'SMT/Cardinality',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/Cardinality/1/0'
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
        {
            title: 'SMT/EitherOr',
            description:
                'The Qualifier value defines an id of an equivalence class. Only ids in the range [A-Za-z0-9] are allowed. If multiple SMT elements feature the same equivalence class, only one of these are allowed in the actual collection (hierarchy level of the Submodel)',
            qualifier: new aasTypes.Qualifier(
                'SMT/EitherOr',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/SMT/EitherOr/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/InitialValue',
            description:
                'Specifies the initial value of the SubmodelElement instance when it is created for the first time.',
            qualifier: new aasTypes.Qualifier(
                'SMT/InitialValue',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/SMT/InitialValue/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/DefaultValue',
            description:
                'Specifies the default value of the SubmodelElement instance. Often, this might designate a neutral, zero or empty value depending on the valueType of a SMT element.',
            qualifier: new aasTypes.Qualifier(
                'SMT/DefaultValue',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/DefaultValue/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/ExampleValue',
            description:
                "Specifies an example value of the SubmodelElement instance, in order to allow the user to better understand the intention and possible values of a SubmodelElement instance. Note: Multiple examples can be given by delimiting them by '|'. In case of a translatable string (langString) the example value shall be an English example string. Alternative (to be decided): add suffix like @en to string to denote language.",
            qualifier: new aasTypes.Qualifier(
                'SMT/ExampleValue',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/ExampleValue/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/AllowedRange',
            description:
                "Specifies a set of allowed continuous numerical ranges. Note: Multiple ranges can be given by delimiting them by '|'. Note: A single range is defined by interval start and end, either including or excluding the given number. Note: Interval start and end are delimited by ','; '.' is the decimal point Note: '*' allows to enter the default value.",
            qualifier: new aasTypes.Qualifier(
                'SMT/AllowedRange',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/AllowedRange/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/AllowedIdShort',
            description:
                'Specifies a regular expression validating the idShort of the created SubmodelElement instance. Note: The format shall conform to POSIX extended regular expressions.',
            qualifier: new aasTypes.Qualifier(
                'SMT/AllowedIdShort',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/AllowedIdShort/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/AllowedValue',
            description:
                'Specifies a regular expression validating the value of the created SubmodelElement instance in its string representation. Note: the format shall conform to POSIX extended regular expressions.',
            qualifier: new aasTypes.Qualifier(
                'SMT/AllowedValue',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/AllowedValue/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/RequiredLang',
            description:
                "If the SMT element is a multi-language property (MLP), it specifies the required languages, which shall be given. Note: Multiple languages can be given by multiple Qualifiers. Note: Multiple languages can be given by delimiting them by '|' Note: languages are specified either by ISO 639-1 or ISO 639-2 codes.",
            qualifier: new aasTypes.Qualifier(
                'SMT/RequiredLang',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/RequiredLang/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                null,
                null
            ),
        },
        {
            title: 'SMT/AccessMode Read/Write',
            description:
                'Specifies the user access mode for SubmodelElement instance. When a Submodel is received from another party, if set to Read/Only, then the user shall not change the value.',
            qualifier: new aasTypes.Qualifier(
                'SMT/AccessMode',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/AccessMode/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                'Read/Write',
                null
            ),
        },
        {
            title: 'SMT/AccessMode Read/Only',
            description:
                'Specifies the user access mode for SubmodelElement instance. When a Submodel is received from another party, if set to Read/Only, then the user shall not change the value.',
            qualifier: new aasTypes.Qualifier(
                'SMT/AccessMode',
                aasTypes.DataTypeDefXsd.String,
                new aasTypes.Reference(
                    aasTypes.ReferenceTypes.ExternalReference,
                    [
                        new aasTypes.Key(
                            aasTypes.KeyTypes.GlobalReference,
                            'https://admin-shell.io/SubmodelTemplates/AccessMode/1/0'
                        ),
                    ],
                    null
                ),
                null,
                aasTypes.QualifierKind.TemplateQualifier,
                'Read/Only',
                null
            ),
        },
    ];
    const predefinedQualifierItemSelected = ref<aasTypes.Qualifier>(predefinedQualifierItems[0].qualifier);

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

        if (predefinedQualifierItemSelected.value !== null)
            qualifiersValue.value.push(predefinedQualifierItemSelected.value as aasTypes.Qualifier);
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
