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

    <v-row align="start" class="mt-1 mb-4">
        <v-col cols="9" class="py-0">
            <v-select
                v-model="predefinedQualifierIdSelected"
                :items="predefinedQualifier"
                item-title="title"
                item-value="id"
                :hint="predefinedQualifierSelected?.description"
                label="Qualifier"
                variant="outlined"
                density="comfortable"
                persistent-hint />
        </v-col>

        <v-col cols="3" class="py-0 d-flex align-end">
            <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                variant="outlined"
                text="Add Qualifier"
                class="text-none mt-1"
                @click="addQualifier" />
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
    import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
    import { computed, ref, watch } from 'vue';
    import predefinedQualifierJson from '@/assets/data/predefinedQualifier.json';

    const props = defineProps<{
        modelValue: Array<aasTypes.Qualifier> | null;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: Array<aasTypes.Qualifier> | null): void;
    }>();

    const qualifiersValue = ref<Array<aasTypes.Qualifier> | null>(props.modelValue);
    const predefinedQualifier = predefinedQualifierJson.map((predefinedQualifier) => ({
        id: predefinedQualifier.id,
        title: predefinedQualifier.title,
        description: predefinedQualifier.description,
        qualifier: new aasTypes.Qualifier(
            predefinedQualifier.qualifier.type ?? '',
            aasTypes.DataTypeDefXsd[predefinedQualifier.qualifier.dataType as keyof typeof aasTypes.DataTypeDefXsd],
            new aasTypes.Reference(
                aasTypes.ReferenceTypes[
                    predefinedQualifier.qualifier.reference.referenceType as keyof typeof aasTypes.ReferenceTypes
                ],
                predefinedQualifier.qualifier.reference.keys.map(
                    (key) =>
                        new aasTypes.Key(aasTypes.KeyTypes[key.keyType as keyof typeof aasTypes.KeyTypes], key.value)
                ),
                null
            ),
            null,
            aasTypes.QualifierKind[predefinedQualifier.qualifier.kind as keyof typeof aasTypes.QualifierKind],
            predefinedQualifier.qualifier.value ?? null,
            null
        ),
    }));
    const predefinedQualifierIdSelected = ref<string>(predefinedQualifier[0].id);

    const predefinedQualifierSelected = computed(() => {
        return (
            predefinedQualifier.find(
                (predefinedQualifier) => predefinedQualifier.id === predefinedQualifierIdSelected.value
            ) || null
        );
    });

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

        if (predefinedQualifierSelected.value !== null)
            qualifiersValue.value.push(predefinedQualifierSelected.value.qualifier as aasTypes.Qualifier);
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
