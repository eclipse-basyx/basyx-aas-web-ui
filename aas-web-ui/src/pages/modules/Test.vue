<template>
    <v-container class="pa-md-12">
        <v-empty-state
            icon="mdi-folder-open-outline"
            text="This is a test module to showcase how to extend the AAS Web UI with new modules."
            :title="moduleName + ' Module'">
            <template #media>
                <v-icon size="64" />
            </template>
        </v-empty-state>
    </v-container>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';

    defineOptions({
        inheritAttrs: false,
        moduleTitle: 'TestTitle', // optional module title
    });

    const moduleName = ref('Test');
</script>
