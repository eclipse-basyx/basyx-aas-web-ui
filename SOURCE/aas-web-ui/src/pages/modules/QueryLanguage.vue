<template>
    <v-container class="pa-md-12">
        <h1 class="mb-5">Query Language Test Module</h1>
        <v-menu>
            <template #activator="{ props }">
                <v-btn v-bind="props" variant="outlined" color="primary" size="small" class="mb-2">
                    {{ selectedEndpoint ? getSelectedEndpointTitle() : 'Select API Component' }}
                    <v-icon end>mdi-chevron-down</v-icon>
                </v-btn>
            </template>
            <v-list slim border rounded nav>
                <v-list-item
                    v-for="endpoint in availableEndpoints"
                    :key="endpoint.value"
                    class="rounded"
                    @click="selectedEndpoint = endpoint.value">
                    <v-list-item-title>{{ endpoint.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ endpoint.url }}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-menu>
        <v-textarea
            v-model="queryText"
            variant="outlined"
            bg-color="surface"
            density="compact"
            flat
            placeholder="Enter your JSON query here..."
            :error="!isValidJson && queryText.trim() !== ''"
            :error-messages="jsonError"
            rows="15">
        </v-textarea>
        <v-card-actions class="pa-0">
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                text="Execute Query"
                variant="elevated"
                class="text-buttonText"
                @click="executeQuery"></v-btn>
        </v-card-actions>

        <!-- Query Response Display -->
        <v-textarea
            v-if="queryResponse"
            v-model="queryResponse"
            variant="outlined"
            bg-color="surface"
            density="compact"
            flat
            label="Query Response"
            readonly
            rows="15"
            class="mt-4">
        </v-textarea>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';

    const infrastructureStore = useInfrastructureStore();

    const { postRequest } = useRequestHandling();

    // Selected endpoint for the query
    const selectedEndpoint = ref('');

    // Query text and validation
    const queryText = ref('');
    const isValidJson = ref(true);
    const jsonError = ref('');

    // Query response
    const queryResponse = ref('');

    // Watch for changes in queryText to validate JSON
    watch(queryText, (newValue) => {
        if (newValue.trim() === '') {
            isValidJson.value = true;
            jsonError.value = '';
            return;
        }

        try {
            JSON.parse(newValue);
            isValidJson.value = true;
            jsonError.value = '';
        } catch (error) {
            isValidJson.value = false;
            jsonError.value = `Invalid JSON: ${(error as Error).message}`;
        }
    });

    // Helper function to transform URLs for query endpoints
    const transformUrlForQuery = (url: string, componentType: string): string => {
        if (!url || url.trim() === '') return '';

        let transformedUrl = url.trim();
        // Remove trailing slash if present
        if (transformedUrl.endsWith('/')) {
            transformedUrl = transformedUrl.slice(0, -1);
        }

        switch (componentType) {
            case 'aas-registry':
                // Transform shell-descriptors to query/shell-descriptors or add /query/shell-descriptors
                if (transformedUrl.includes('/shell-descriptors')) {
                    transformedUrl = transformedUrl.replace('/shell-descriptors', '/query/shell-descriptors');
                } else {
                    transformedUrl += '/query/shell-descriptors';
                }
                break;
            case 'submodel-registry':
                // Transform submodel-descriptors to query/submodel-descriptors or add /query/submodel-descriptors
                if (transformedUrl.includes('/submodel-descriptors')) {
                    transformedUrl = transformedUrl.replace('/submodel-descriptors', '/query/submodel-descriptors');
                } else {
                    transformedUrl += '/query/submodel-descriptors';
                }
                break;
            case 'aas-repo':
                // Transform shells to query/shells or add /query/shells
                if (transformedUrl.includes('/shells')) {
                    transformedUrl = transformedUrl.replace('/shells', '/query/shells');
                } else {
                    transformedUrl += '/query/shells';
                }
                break;
            case 'submodel-repo':
                // Transform submodels to query/submodels or add /query/submodels
                if (transformedUrl.includes('/submodels')) {
                    transformedUrl = transformedUrl.replace('/submodels', '/query/submodels');
                } else {
                    transformedUrl += '/query/submodels';
                }
                break;
            case 'cd-repo':
                // Transform concept-descriptions to query/concept-descriptions or add /query/concept-descriptions
                if (transformedUrl.includes('/concept-descriptions')) {
                    transformedUrl = transformedUrl.replace('/concept-descriptions', '/query/concept-descriptions');
                } else {
                    transformedUrl += '/query/concept-descriptions';
                }
                break;
            default:
                break;
        }

        return transformedUrl;
    };

    // Computed prop to get available endpoints from the store
    const availableEndpoints = computed(() => {
        const endpoints = [
            {
                title: 'AAS Registry',
                value: 'aas-registry',
                url: transformUrlForQuery(infrastructureStore.getAASRegistryURL, 'aas-registry'),
            },
            {
                title: 'Submodel Registry',
                value: 'submodel-registry',
                url: transformUrlForQuery(infrastructureStore.getSubmodelRegistryURL, 'submodel-registry'),
            },
            {
                title: 'AAS Repository',
                value: 'aas-repo',
                url: transformUrlForQuery(infrastructureStore.getAASRepoURL, 'aas-repo'),
            },
            {
                title: 'Submodel Repository',
                value: 'submodel-repo',
                url: transformUrlForQuery(infrastructureStore.getSubmodelRepoURL, 'submodel-repo'),
            },
            {
                title: 'Concept Description Repository',
                value: 'cd-repo',
                url: transformUrlForQuery(infrastructureStore.getConceptDescriptionRepoURL, 'cd-repo'),
            },
        ];

        // Filter out endpoints that don't have a valid URL
        return endpoints.filter((endpoint) => endpoint.url && endpoint.url.trim() !== '');
    });

    // Helper function to get the title of the selected endpoint
    const getSelectedEndpointTitle = (): string => {
        const endpoint = availableEndpoints.value.find((ep) => ep.value === selectedEndpoint.value);
        return endpoint ? endpoint.title : '';
    };

    defineOptions({
        inheritAttrs: false,
        moduleTitle: 'Query Language', // optional module title
    });

    async function executeQuery(): Promise<void> {
        if (!selectedEndpoint.value) {
            queryResponse.value = 'Error: Please select an API component.';
            return;
        }

        if (!isValidJson.value || queryText.value.trim() === '') {
            queryResponse.value = 'Error: Please enter a valid JSON query.';
            return;
        }

        const endpoint = availableEndpoints.value.find((ep) => ep.value === selectedEndpoint.value);
        if (!endpoint) {
            queryResponse.value = 'Error: Selected endpoint is not valid.';
            return;
        }

        try {
            queryResponse.value = 'Executing query...';

            const requestHeaders = new Headers();
            requestHeaders.append('Content-Type', 'application/json');

            const path = endpoint.url;
            const content = queryText.value;
            const headers = requestHeaders;
            const context = 'executing query';
            const disableMessage = false;
            // send the request
            await postRequest(path, content, headers, context, disableMessage, true).then((response: unknown) => {
                const res = response as { success: boolean; data?: unknown; message?: string };
                if (res.success) {
                    queryResponse.value = JSON.stringify(res.data, null, 2);
                } else {
                    queryResponse.value = `Query failed: ${res.message || 'Unknown error'}`;
                }
            });
        } catch (error) {
            queryResponse.value = `Error executing query: ${(error as Error).message}`;
        }
    }
</script>
