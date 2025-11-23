<template>
    <v-dialog v-model="dialog" persistent max-width="800">
        <v-card>
            <v-card-title><span class="text-error font-weight-bold">Migration Error</span></v-card-title>
            <v-divider />
            <v-card-text>
                AAS Data Migration <span class="text-error"><strong>Failed</strong></span> - Either the source or
                destination is not reachable, you have no access rights, or an unexpected error occurred - see console
                for details.</v-card-text
            >
            <v-card-actions>
                <v-btn color="primary" variant="tonal" @click="closeDialog">Ok</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';

    const dialog = ref<boolean>(true);

    // Watch model value to set dialog
    const props = defineProps({
        modelValue: { type: Boolean, required: true },
    });

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void;
    }>();

    function closeDialog(): void {
        dialog.value = false;
        emit('update:modelValue', false);
    }

    watch(
        () => props.modelValue,
        (newVal) => {
            dialog.value = newVal;
        },
        { immediate: true }
    );
</script>
