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
    import type { BaSyxComponent, RepositoryKey } from '@/types/BaSyx';
    import { reactive, ref } from 'vue';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const envStore = useEnvStore();
    const navigationStore = useNavigationStore();

    // Composables
    const { getRequest } = useRequestHandling();

    // Reactive BaSyx Components Configurations
    const basyxComponents = reactive<Record<RepositoryKey, BaSyxComponent>>({
        AASDiscovery: {
            url: ref(navigationStore.getAASDiscoveryURL), // Ensure the getter is invoked
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASDiscovery'),
            label: 'AAS Discovery URL',
            pathCheck: '/lookup/shells',
            additionalParams: () => `?limit=1`,
        },
        AASRegistry: {
            url: ref(navigationStore.getAASRegistryURL),
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASRegistry'),
            label: 'AAS Registry URL',
            pathCheck: '/shell-descriptors',
            additionalParams: () => `?limit=1`,
        },
        SubmodelRegistry: {
            url: ref(navigationStore.getSubmodelRegistryURL),
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('SubmodelRegistry'),
            label: 'Submodel Registry URL',
            pathCheck: '/submodel-descriptors',
            additionalParams: () => `?limit=1`,
        },
        AASRepo: {
            url: ref(navigationStore.getAASRepoURL),
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASRepo'),
            label: 'AAS Repository URL',
            additionalParams: () => `?limit=1`,
        },
        SubmodelRepo: {
            url: ref(navigationStore.getSubmodelRepoURL),
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('SubmodelRepo'),
            label: 'Submodel Repository URL',
            additionalParams: () => `?limit=1&level=core`,
        },
        ConceptDescriptionRepo: {
            url: ref(navigationStore.getConceptDescriptionRepoURL),
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('ConceptDescriptionRepo'),
            label: 'Concept Description Repository URL',
            additionalParams: () => `?limit=1`,
        },
    });

    const endpointConfigAvailable = ref(envStore.getEndpointConfigAvailable);

    // Functions
    async function connectComponent(repoKey: keyof typeof basyxComponents): Promise<void> {
        const repo = basyxComponents[repoKey];
        if (repo.url && repo.url.trim() !== '') {
            repo.loading = true;
            let path = repo.url;

            // Append path check for backward compatibility if defined
            if (repo.pathCheck && !path.includes(repo.pathCheck)) {
                path += repo.pathCheck;
            }

            // Append additional parameters if any
            if (repo.additionalParams) {
                path += repo.additionalParams(repoKey);
            }

            const context = `connecting to ${repo.label}`;
            const disableMessage = false;

            try {
                const response = await getRequest(path, context, disableMessage);
                repo.loading = false;

                if (response.success) {
                    // Dispatch to the navigation store
                    navigationStore.dispatchComponentURL(repoKey, repo.url);

                    // Save to localStorage if endpoint config is available
                    if (endpointConfigAvailable.value) {
                        // console.log(`Saving ${repoKey} URL to localStorage:`, repo.url);
                        window.localStorage.setItem(repoKey, repo.url);
                    }

                    // Update the connected status
                    repo.connected = true;
                } else {
                    // Clear the URL in the navigation store
                    navigationStore.dispatchComponentURL(repoKey, '');

                    // Remove from localStorage if endpoint config is available
                    if (endpointConfigAvailable.value) {
                        // console.log(`Removing ${repoKey} URL from localStorage:`, repo.url);
                        window.localStorage.removeItem(repoKey);
                    }

                    // Update the connected status
                    repo.connected = false;
                }
            } catch (error) {
                repo.loading = false;
                console.error(`Error connecting to ${repo.label}:`, error);

                // Clear the URL in the navigation store
                navigationStore.dispatchComponentURL(repoKey, '');

                // Remove from localStorage if endpoint config is available
                if (endpointConfigAvailable.value) {
                    // console.log(`Removing ${repoKey} URL from localStorage:`, repo.url);
                    window.localStorage.removeItem(repoKey);
                }

                // Update the connected status
                repo.connected = false;
            }
        } else {
            repo.connected = false;
            console.warn(`Repository URL for ${repoKey} is not defined or empty.`);
        }
    }
</script>
