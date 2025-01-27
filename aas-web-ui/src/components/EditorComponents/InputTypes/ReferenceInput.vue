<template>
    <v-divider v-if="!noHeader"></v-divider>
    <v-list-item v-if="!noHeader" class="pl-0 pt-0">
        <template #title>
            <div class="text-subtitle-2">{{ label }}</div>
        </template>
    </v-list-item>
    <v-list-item v-for="(reference, i) in referenceValue?.keys" :key="i" class="px-0">
        <v-text-field
            v-model="reference.value"
            variant="outlined"
            density="comfortable"
            hide-details
            append-icon="mdi-delete"
            @click:append="deleteReferenceKey(reference)"></v-text-field>
    </v-list-item>
    <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="outlined"
        text="Add"
        class="text-none mt-1 mb-4"
        @click="addReferenceKey"></v-btn>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { ref, watch } from 'vue';

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

    // Data
    const referenceValue = ref<aasTypes.Reference | null>(props.modelValue);

    // Watchers
    watch(referenceValue, (newValue) => {
        emit('update:modelValue', newValue);
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            referenceValue.value = newValue;
        }
    );

    function addReferenceKey() {
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

    function deleteReferenceKey(reference: aasTypes.Key) {
        if (referenceValue.value?.keys === undefined) return;
        const index = referenceValue.value.keys.indexOf(reference);
        if (index > -1) {
            referenceValue.value.keys.splice(index, 1);
        }
        // If there are no keys left, delete the reference
        if (referenceValue.value.keys.length === 0) {
            referenceValue.value = null;
        }
    }
</script>
