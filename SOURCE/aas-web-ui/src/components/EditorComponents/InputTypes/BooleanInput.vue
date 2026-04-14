<template>
    <div class="d-flex align-center gap-1">
        <!-- Switch control with value embedded in label -->
        <v-switch
            v-model="booleanValue"
            inset
            density="compact"
            color="primary"
            @update:model-value="updateValue">
            <template #label>
                <span class="d-flex align-center gap-2">
                    Value:
                    <span :class="booleanValue ? 'text-success' : 'text-warning'" style="font-weight: 500">
                        {{ booleanValue ? 'true' : 'false' }}
                    </span>
                </span>
            </template>
        </v-switch>
    </div>
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

    function updateValue(): void {
        emit('update:modelValue', booleanValue.value);
    }
</script>
