<template>
    <v-divider v-if="!noHeader"></v-divider>
    <v-list-item v-if="!noHeader" class="pl-0 pt-0">
        <template #title>
            <div class="text-subtitle-2">{{ label }}</div>
        </template>
    </v-list-item>
    <!-- Reference Type Selection -->
    <v-list-item v-if="referenceValue !== null" class="px-0 pt-0 mb-4">
        <v-select
            v-model="referenceValue.type"
            :items="referenceTypeOptions"
            label="Reference Type"
            variant="outlined"
            density="comfortable"
            hide-details
            class="mt-2"></v-select>
    </v-list-item>
    <!-- Reference Keys -->
    <v-list-item v-for="(key, i) in referenceValue?.keys" :key="i" class="px-0 py-0">
        <template #prepend>
            <v-select
                v-model="key.type"
                :items="keyTypeOptions"
                label="Key Type"
                variant="outlined"
                density="comfortable"
                :width="220"
                class="mr-3 mt-1"></v-select>
        </template>
        <v-text-field
            v-model="key.value"
            class="mt-1"
            label="Value"
            variant="outlined"
            density="comfortable"
            append-icon="mdi-delete"
            @click:append="deleteReferenceKey(key)"></v-text-field>
    </v-list-item>
    <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="outlined"
        text="Add Key"
        class="text-none mt-1 mb-4"
        @click="addReferenceKey"></v-btn>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';

    type Props = {
        label: string;
        noHeader?: boolean;
        modelValue: aasTypes.Reference | null;
    };

    const props = withDefaults(defineProps<Props>(), {
        noHeader: false,
    });

    const emit = defineEmits<{
        (event: 'update:modelValue', value: aasTypes.Reference | null): void;
    }>();

    const referenceValue = ref<aasTypes.Reference | null>(props.modelValue);

    // Reference Type options
    const referenceTypeOptions = computed(() => [
        { title: 'External Reference', value: aasTypes.ReferenceTypes.ExternalReference },
        { title: 'Model Reference', value: aasTypes.ReferenceTypes.ModelReference },
    ]);

    // Key Type options based on aasTypes.KeyTypes
    const keyTypeOptions = computed(() => [
        { title: 'GlobalReference', value: aasTypes.KeyTypes.GlobalReference },
        { title: 'FragmentReference', value: aasTypes.KeyTypes.FragmentReference },
        { title: 'AssetAdministrationShell', value: aasTypes.KeyTypes.AssetAdministrationShell },
        { title: 'Submodel', value: aasTypes.KeyTypes.Submodel },
        { title: 'ConceptDescription', value: aasTypes.KeyTypes.ConceptDescription },
        { title: 'Identifiable', value: aasTypes.KeyTypes.Identifiable },
        { title: 'Referable', value: aasTypes.KeyTypes.Referable },
        { title: 'SubmodelElement', value: aasTypes.KeyTypes.SubmodelElement },
        { title: 'SubmodelElementCollection', value: aasTypes.KeyTypes.SubmodelElementCollection },
        { title: 'SubmodelElementList', value: aasTypes.KeyTypes.SubmodelElementList },
        { title: 'Property', value: aasTypes.KeyTypes.Property },
        { title: 'MultiLanguageProperty', value: aasTypes.KeyTypes.MultiLanguageProperty },
        { title: 'Range', value: aasTypes.KeyTypes.Range },
        { title: 'File', value: aasTypes.KeyTypes.File },
        { title: 'Blob', value: aasTypes.KeyTypes.Blob },
        { title: 'ReferenceElement', value: aasTypes.KeyTypes.ReferenceElement },
        { title: 'RelationshipElement', value: aasTypes.KeyTypes.RelationshipElement },
        { title: 'AnnotatedRelationshipElement', value: aasTypes.KeyTypes.AnnotatedRelationshipElement },
        { title: 'Entity', value: aasTypes.KeyTypes.Entity },
        { title: 'EventElement', value: aasTypes.KeyTypes.EventElement },
        { title: 'BasicEventElement', value: aasTypes.KeyTypes.BasicEventElement },
        { title: 'Operation', value: aasTypes.KeyTypes.Operation },
        { title: 'Capability', value: aasTypes.KeyTypes.Capability },
        { title: 'DataElement', value: aasTypes.KeyTypes.DataElement },
    ]);

    watch(
        referenceValue,
        (newValue) => {
            emit('update:modelValue', newValue);
        },
        { deep: true }
    );

    watch(
        () => props.modelValue,
        (newValue) => {
            referenceValue.value = newValue;
        }
    );

    function addReferenceKey(): void {
        if (referenceValue.value === null) {
            referenceValue.value = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
                new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, ''),
            ]);
        } else if (referenceValue.value.keys === undefined) {
            referenceValue.value.keys = [new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, '')];
        } else {
            referenceValue.value.keys.push(new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, ''));
        }
    }

    function deleteReferenceKey(key: aasTypes.Key): void {
        if (referenceValue.value?.keys === undefined) return;
        const index = referenceValue.value.keys.indexOf(key);
        if (index > -1) {
            referenceValue.value.keys.splice(index, 1);
        }
        // If there are no keys left, delete the reference
        if (referenceValue.value.keys.length === 0) {
            referenceValue.value = null;
        }
    }
</script>
