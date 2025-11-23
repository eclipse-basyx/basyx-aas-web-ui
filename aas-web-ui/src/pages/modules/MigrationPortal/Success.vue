<template>
    <v-dialog v-model="dialog" persistent max-width="800">
        <v-card>
            <v-card-title>Migration Done</v-card-title>
            <v-divider />
            <v-card-text> AAS Data Migrated </v-card-text>
            <v-card-actions>
                <v-btn color="primary" variant="tonal" @click="dialog = false">Ok</v-btn>
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

    watch(
        () => props.modelValue,
        (newVal) => {
            dialog.value = newVal;
        },
        { immediate: true }
    );
</script>
