<template>
    <v-container class="px-2 pt-2 pb-0">
        <v-list-subheader>Backend Configuration</v-list-subheader>
        <v-list-item v-for="(repo, key) in basyxComponents" :key="key" class="px-0 py-0">
            <v-text-field
                v-model="repo.url"
                :label="repo.label"
                variant="outlined"
                density="compact"
                hide-details
                class="mt-2 mb-1"
                @keydown.enter="repo.connect">
                <template #prepend-inner>
                    <v-icon v-if="repo.connected === null" icon="mdi-help" size="x-small" color="grey" />
                    <v-icon v-else-if="repo.connected" icon="mdi-check" size="x-small" color="success" />
                    <v-icon v-else icon="mdi-close" size="x-small" color="error" />
                </template>
                <template #append-inner>
                    <v-icon icon="mdi-connection" size="x-small" @click="repo.connect" />
                </template>
                <template #loader>
                    <v-progress-linear :active="repo.loading" color="primary" indeterminate></v-progress-linear>
                </template>
            </v-text-field>
        </v-list-item>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Computed Properties
    const basyxComponents = computed(() => navigationStore.getBasyxComponents);
</script>
