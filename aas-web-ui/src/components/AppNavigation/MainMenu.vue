<template>
    <v-container fluid class="pa-0">
        <v-card
            :min-width="isMobile || !endpointConfigAvailable ? 200 : 700"
            :flat="isMobile"
            :color="isMobile ? 'card' : 'navigationMenu'"
            :style="{
                'border-style': isMobile ? '' : 'solid',
                'border-width': isMobile ? '' : '1px',
            }">
            <v-row>
                <!-- Navigation Column -->
                <v-col
                    :cols="isMobile || !endpointConfigAvailable ? 12 : 4"
                    :class="isMobile ? 'bg-card' : 'bg-navigationMenuSecondary'">
                    <v-card
                        variant="flat"
                        class="pt-3"
                        :style="{ borderRadius: '0px' }"
                        :color="isMobile ? 'card' : 'navigationMenuSecondary'">
                        <template v-if="!isMobile && endpointConfigAvailable">
                            <span class="mx-3 text-primary">General Settings</span>
                            <v-list
                                nav
                                class="pa-0 mx-3 mt-3"
                                :class="isMobile ? 'bg-card' : 'bg-navigationMenuSecondary'">
                                <v-list-item>
                                    <v-list-item-title>Endpoints</v-list-item-title>
                                    <template #append>
                                        <v-icon>mdi-chevron-right</v-icon>
                                    </template>
                                </v-list-item>
                            </v-list>
                            <v-divider class="mb-3"></v-divider>
                        </template>
                        <span v-if="!isMobile" class="mx-3 text-primary">Switch to</span>
                        <!-- Select the view you want to use -->
                        <v-list v-if="!isMobile" nav class="pa-0 ma-3 bg-navigationMenuSecondary">
                            <v-list-item to="/" @click="closeMenu()">
                                <v-list-item-title>AAS Editor</v-list-item-title>
                            </v-list-item>
                            <v-list-item to="/aasviewer" @click="closeMenu()">
                                <v-list-item-title>AAS Viewer</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="dashboardAvailable" to="/dashboard" @click="closeMenu()">
                                <v-list-item-title>Dashboard</v-list-item-title>
                            </v-list-item>
                            <v-list-item to="/about" @click="closeMenu()">
                                <v-list-item-title>About</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card>
                </v-col>

                <!-- Configuration Column -->
                <v-col
                    v-if="endpointConfigAvailable"
                    :cols="isMobile ? 12 : 8"
                    :class="isMobile ? 'pt-0 mb-2 px-6 bg-card' : 'pt-4 bg-navigationMenu'">
                    <!-- Iterate over repositories to generate form fields -->
                    <div v-for="(repo, key) in basyxComponents" :key="key">
                        <v-text-field
                            v-model="repo.url"
                            :label="repo.label"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="my-3"
                            :class="isMobile ? '' : 'mr-3'"
                            @keydown.enter="repo.connect">
                            <template #append-inner>
                                <v-btn
                                    size="small"
                                    variant="elevated"
                                    color="primary"
                                    class="text-buttonText"
                                    style="right: -4px"
                                    :loading="repo.loading"
                                    @click.stop="repo.connect">
                                    Connect
                                </v-btn>
                            </template>
                        </v-text-field>
                    </div>
                </v-col>
            </v-row>
            <!-- Platform I 4.0 Logo -->
            <v-row v-if="isMobile">
                <v-col align="center" class="bg-card">
                    <v-img src="I40.png" max-width="260px" :style="{ filter: isDark ? 'invert(1)' : 'invert(0)' }">
                        <template #sources>
                            <source srcset="@/assets/I40.png" />
                        </template>
                    </v-img>
                </v-col>
            </v-row>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import type { BaSyxComponent, RepositoryKey } from '@/types/BaSyx';
    import { computed, onMounted, reactive, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useDashboardHandling } from '@/composables/DashboardHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();

    // Composables
    const { checkDashboardAvailability } = useDashboardHandling();
    const { getRequest } = useRequestHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Vuetify
    const theme = useTheme();

    // Emit
    const emit = defineEmits<{
        (e: 'closeMenu'): void;
    }>();

    // Reactive BaSyx Components Configurations
    const basyxComponents = reactive<Record<RepositoryKey, BaSyxComponent>>({
        AASDiscovery: {
            url: ref(navigationStore.getAASDiscoveryURL), // Ensure the getter is invoked
            loading: ref(false),
            connect: () => connectComponent('AASDiscovery'),
            label: 'AAS Discovery URL',
            pathCheck: '/lookup/shells',
            additionalParams: () => `?limit=1`,
        },
        AASRegistry: {
            url: ref(navigationStore.getAASRegistryURL),
            loading: ref(false),
            connect: () => connectComponent('AASRegistry'),
            label: 'AAS Registry URL',
            pathCheck: '/shell-descriptors',
            additionalParams: () => `?limit=1`,
        },
        SubmodelRegistry: {
            url: ref(navigationStore.getSubmodelRegistryURL),
            loading: ref(false),
            connect: () => connectComponent('SubmodelRegistry'),
            label: 'Submodel Registry URL',
            pathCheck: '/submodel-descriptors',
            additionalParams: () => `?limit=1`,
        },
        AASRepo: {
            url: ref(navigationStore.getAASRepoURL),
            loading: ref(false),
            connect: () => connectComponent('AASRepo'),
            label: 'AAS Repository URL',
            additionalParams: () => `?limit=1`,
        },
        SubmodelRepo: {
            url: ref(navigationStore.getSubmodelRepoURL),
            loading: ref(false),
            connect: () => connectComponent('SubmodelRepo'),
            label: 'Submodel Repository URL',
            additionalParams: () => `?limit=1&level=core`,
        },
        ConceptDescriptionRepo: {
            url: ref(navigationStore.getConceptDescriptionRepoURL),
            loading: ref(false),
            connect: () => connectComponent('ConceptDescriptionRepo'),
            label: 'Concept Description Repository URL',
            additionalParams: () => `?limit=1`,
        },
    });

    // Additional States
    const dashboardAvailable = ref(false);
    const endpointConfigAvailable = ref(envStore.getEndpointConfigAvailable);

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const isDark = computed(() => theme.global.current.value.dark); // Check if the current Theme is dark
    const currentRoute = computed(() => route.name); // get the current route name

    watch(currentRoute, () => {
        aasStore.dispatchSelectedAAS({}); // reset selected AAS
    });

    onMounted(async () => {
        dashboardAvailable.value = await checkDashboardAvailability();
    });

    // Functions
    async function connectComponent(repoKey: keyof typeof basyxComponents) {
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
                } else {
                    // Clear the URL in the navigation store
                    navigationStore.dispatchComponentURL(repoKey, '');

                    // Remove from localStorage if endpoint config is available
                    if (endpointConfigAvailable.value) {
                        // console.log(`Removing ${repoKey} URL from localStorage:`, repo.url);
                        window.localStorage.removeItem(repoKey);
                    }
                }
            } catch (error) {
                repo.loading = false;
                console.error(`Error connecting to ${repo.label}:`, error);
                // Optionally, handle the error (e.g., show a notification)
            }
        } else {
            console.warn(`Repository URL for ${repoKey} is not defined or empty.`);
        }
    }

    function closeMenu() {
        emit('closeMenu');
    }
</script>
