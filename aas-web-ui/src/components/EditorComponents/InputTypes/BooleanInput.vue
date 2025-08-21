<template>
    <v-checkbox v-model="booleanValue" density="comfortable" :label="label"></v-checkbox>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';

    const props = defineProps<{
        label: string;
        modelValue: boolean | string;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const booleanValue = ref<boolean>(
        typeof props.modelValue === 'string' ? props.modelValue.toLowerCase() === 'true' : props.modelValue
    );

    watch(booleanValue, (newValue) => {
        emit('update:modelValue', newValue);
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            booleanValue.value = typeof newValue === 'string' ? newValue.toLowerCase() === 'true' : newValue;
        }
    );
</script>
