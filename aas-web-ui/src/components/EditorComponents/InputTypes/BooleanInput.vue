<template>
    <v-checkbox v-model="booleanValue" density="comfortable" :label="label"></v-checkbox>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';

    const props = defineProps<{
        label: string;
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const booleanValue = ref<boolean>(props.modelValue);

    watch(booleanValue, (newValue) => {
        emit('update:modelValue', newValue);
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            booleanValue.value = newValue;
        }
    );
</script>
