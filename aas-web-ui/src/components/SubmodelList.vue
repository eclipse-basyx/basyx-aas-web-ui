<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <template v-if="!singleAas || isMobile">
                <!-- Title Bar in the Submodel List -->
                <v-card-title :style="{ padding: isMobile ? '' : '15px 16px 16px' }">
                    <div v-if="!selectedAAS || Object.keys(selectedAAS).length === 0">Submodel List</div>
                    <div v-else class="d-flex align-center">
                        <v-btn
                            v-if="isMobile"
                            class="ml-0"
                            variant="plain"
                            icon="mdi-chevron-left"
                            @click="backToAASList()" />
                        <v-icon icon="custom:aasIcon" color="primary" size="small" class="ml-2" />
                        <template v-if="submodelList.length > 10">
                            <v-col class="ml-2">
                                <v-text-field
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    label="Search for Submodel ..."
                                    clearable
                                    @update:model-value="filterSubmodelList"></v-text-field>
                            </v-col>
                        </template>
                        <span v-else class="text-truncate ml-2">
                            {{ nameToDisplay(selectedAAS) }}
                        </span>
                    </div>
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <v-card-text class="py-2 px-2" style="overflow-y: auto; height: calc(100svh - 170px)">
                <div v-if="listLoading">
                    <v-skeleton-loader type="list-item@6"></v-skeleton-loader>
                </div>
                <template v-else>
                    <template v-if="selectedAAS && Object.keys(selectedAAS).length > 0">
                        <!-- List of Submodels -->
                        <v-list v-if="submodelList.length > 0" class="pa-0" nav density="compact">
                            <v-virtual-scroll
                                ref="virtualScrollRef"
                                :items="submodelList"
                                :item-height="56"
                                class="pb-2 bg-card">
                                <template #default="{ item }">
                                    <v-list-item
                                        :key="item.id"
                                        :active="isSelected(item)"
                                        color="primarySurface"
                                        base-color="listItem"
                                        variant="tonal"
                                        class="mb-2"
                                        style="border-width: 1px"
                                        :style="{
                                            'border-color': isSelected(item)
                                                ? primaryColor + ' !important'
                                                : isDark
                                                  ? '#686868 !important'
                                                  : '#ABABAB !important',
                                        }"
                                        @click="selectSM(item)">
                                        <template #prepend>
                                            <v-chip label border color="primary" size="x-small" class="mr-3">SM</v-chip>
                                        </template>
                                        <v-list-item-title
                                            :class="isSelected(item) ? 'text-primary' : 'text-listItemText'"
                                            >{{ nameToDisplay(item) }}</v-list-item-title
                                        >
                                    </v-list-item>
                                </template>
                            </v-virtual-scroll>
                        </v-list>
                        <v-empty-state
                            v-else
                            title="No existing Submodels"
                            text="The selected AAS does not contain any Submodels"
                            class="text-divider"></v-empty-state>
                    </template>
                    <template v-else>
                        <v-empty-state
                            title="No selected AAS"
                            text="Select an AAS to view its Submodels"
                            class="text-divider"></v-empty-state>
                    </template>
                </template>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import type { ComponentPublicInstance } from 'vue';
    import { computed, onActivated, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Extend the ComponentPublicInstance type to include scrollToIndex
    interface VirtualScrollInstance extends ComponentPublicInstance {
        scrollToIndex: (index: number) => void;
    }

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { fetchAasSmListById } = useAASHandling();
    const { nameToDisplay, descriptionToDisplay } = useReferableUtils();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const submodelList = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the SM Data
    const submodelListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the SM Data before filtering
    const listLoading = ref(false); // Variable to store if the AAS List is loading
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component

    // Computed Properties
    const isDark = computed(() => theme.global.current.value.dark);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const isMobile = computed(() => navigationStore.getIsMobile);
    const primaryColor = computed(() => theme.current.value.colors.primary);
    const singleAas = computed(() => envStore.getSingleAas); // Get the single AAS state from the Store

    // Watchers
    watch(
        () => aasRegistryURL.value,
        () => {
            submodelList.value = [];
        }
    );

    watch(
        () => submodelRegistryURL.value,
        () => {
            submodelList.value = [];
        }
    );

    watch(
        () => selectedAAS.value,
        () => {
            submodelList.value = [];
            initialize();
        }
    );

    watch(
        () => selectedNode.value,
        () => {
            scrollToSelectedSubmodel();
        }
    );

    onMounted(() => {
        initialize();
    });

    onActivated(() => {
        scrollToSelectedSubmodel();
    });

    function initialize(): void {
        if (!selectedAAS.value || Object.keys(selectedAAS).length === 0) {
            submodelList.value = [];
            return;
        }

        listLoading.value = true;

        fetchAasSmListById(selectedAAS.value.id).then((submodels: Array<any>) => {
            let submodelsSorted = submodels.sort((a: { [x: string]: number }, b: { [x: string]: number }) =>
                a['id'] > b['id'] ? 1 : -1
            );

            submodelList.value = [...submodelsSorted];

            submodelListUnfiltered.value = [...submodelsSorted];

            scrollToSelectedSubmodel();

            listLoading.value = false;
        });
    }

    function filterSubmodelList(value: string): void {
        if (!value || value.trim() === '') {
            submodelList.value = submodelListUnfiltered.value;
        } else {
            // Filter list of SMs (cf. AASList.vue)
            let submodelListFiltered = submodelListUnfiltered.value.filter(
                (sm: any) =>
                    sm.id.toLowerCase().includes(value.toLowerCase()) ||
                    sm.idShort.toLowerCase().includes(value.toLowerCase()) ||
                    nameToDisplay(sm).toLowerCase().includes(value.toLowerCase()) ||
                    descriptionToDisplay(sm).toLowerCase().includes(value.toLowerCase())
            );
            submodelList.value = submodelListFiltered;
        }
        scrollToSelectedSubmodel();
    }

    function selectSM(submodel: any): void {
        if (isSelected(submodel)) {
            // Deselect submodel: remove the path query
            let query = { ...route.query };
            delete query.path;
            router.push({ query: query });
        } else {
            // Select submodel: add smePath to path query
            let scrollToSubmodel = false;
            if (!selectedNode.value || Object.keys(selectedNode.value).length === 0) {
                scrollToSubmodel = true;
            }

            let query = { ...route.query };
            query.path = submodel.path;
            if (isMobile.value) {
                // Go to Visualization
                router.push({
                    name: 'Visualization',
                    query: query,
                });
            } else {
                router.push({
                    query: query,
                });
            }

            if (scrollToSubmodel) scrollToSelectedSubmodel();
        }
    }

    function isSelected(submodel: any): boolean {
        if (
            !selectedNode.value ||
            Object.keys(selectedNode.value).length === 0 ||
            !selectedNode.value.id ||
            !submodel ||
            Object.keys(submodel).length === 0 ||
            !submodel.id
        ) {
            return false;
        }
        return selectedNode.value.id === submodel.id;
    }

    function scrollToSelectedSubmodel(): void {
        // Find the index of the selected item
        const index = submodelList.value.findIndex((sm: any) => isSelected(sm));

        if (index !== -1) {
            const intervalId = setInterval(() => {
                if (
                    virtualScrollRef.value &&
                    virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
                ) {
                    // Access the scrollable container
                    virtualScrollRef.value.scrollToIndex(index);
                    clearInterval(intervalId);
                }
            }, 50);
        }
    }

    function backToAASList(): void {
        router.push({ name: 'AASList', query: route.query });
    }
</script>
