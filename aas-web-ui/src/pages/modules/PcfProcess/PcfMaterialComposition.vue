<template>
    <v-card border rounded="lg">
        <v-card-title class="d-flex align-center">
            <v-btn
                class="mr-3 text-buttonText"
                size="small"
                icon="mdi-arrow-left"
                color="primary"
                @click="modelValue!--" />
            <v-divider vertical inset class="ml-3 mr-6"></v-divider>
            <span>Material Selection for:</span>
            <v-list-item>
                <v-list-item-title class="text-primary">{{ nameToDisplay(shell) }}</v-list-item-title>
                <v-list-item-subtitle>{{ shell.assetInformation.globalAssetId }}</v-list-item-subtitle>
            </v-list-item>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: calc(100vh - 250px)"></v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="flat" color="success" class="text-none text-buttonText" text="Complete" @click="complete" />
            <v-spacer></v-spacer>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts" setup>
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    const { nameToDisplay } = useReferableUtils();

    const modelValue = defineModel<number>();

    const props = defineProps<{
        shell: any;
    }>();

    function complete() {
        console.log('Material composition completed for shell:', props.shell);
    }
</script>
