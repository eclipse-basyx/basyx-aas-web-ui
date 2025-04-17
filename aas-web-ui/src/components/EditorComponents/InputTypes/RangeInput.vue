<template>
    <div class="d-flex flex-row">
        <v-text-field
            v-model="minValue"
            label="min"
            variant="outlined"
            density="comfortable"
            bg-color="surface"
            class="mr-1"></v-text-field>
        <v-text-field
            v-model="maxValue"
            label="max"
            variant="outlined"
            density="comfortable"
            bg-color="surface"
            class="ml-1"></v-text-field>
    </div>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';

    const props = defineProps<{
        minValue: string | null;
        maxValue: string | null;
    }>();

    const emit = defineEmits<{
        (event: 'update:minValue', value: string | null): void;
        (event: 'update:maxValue', value: string | null): void;
    }>();

    const minValue = ref<string | null>(props.minValue);
    const maxValue = ref<string | null>(props.maxValue);

    watch(minValue, (newValue) => {
        if (newValue === '') {
            emit('update:minValue', null);
        } else {
            emit('update:minValue', newValue);
        }
    });

    watch(maxValue, (newValue) => {
        if (newValue === '') {
            emit('update:maxValue', null);
        } else {
            emit('update:maxValue', newValue);
        }
    });

    watch(
        () => props.minValue,
        (newValue) => {
            minValue.value = newValue;
        }
    );

    watch(
        () => props.maxValue,
        (newValue) => {
            maxValue.value = newValue;
        }
    );
</script>
