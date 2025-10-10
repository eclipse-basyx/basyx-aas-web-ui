<template>
    <v-text-field
        v-model="textValue"
        :label="label"
        variant="outlined"
        density="comfortable"
        bg-color="surface"
        :error-messages="errorMessages">
        <template #append-inner>
            <v-btn
                v-if="showGenerateIriButton"
                color="primary"
                size="small"
                slim
                border
                variant="text"
                text="Generate IRI"
                class="text-none"
                @click.stop="textValue = generateIri(type!)" />
        </template>
    </v-text-field>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import { useIDUtils } from '@/composables/IDUtils';

    // Composables
    const { generateIri } = useIDUtils();

    type Props = {
        label: string;
        modelValue: string | null;
        errorMessages?: string | string[] | null;
    } & ({ showGenerateIriButton: true; type: string } | { showGenerateIriButton?: false; type?: never });

    const props = defineProps<Props>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: string | null): void;
    }>();

    const textValue = ref<string | null>(props.modelValue);

    watch(textValue, (newValue) => {
        if (newValue === '') {
            emit('update:modelValue', null);
            textValue.value = null;
        } else {
            emit('update:modelValue', newValue);
        }
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            textValue.value = newValue;
        }
    );
</script>
