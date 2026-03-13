<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <!-- Title bar -->
            <template v-if="isMobile || submodelListUnfiltered.length > 10">
                <v-card-title :style="{ padding: !selectedAAS ? '15px 16px 16px' : '0px' }">
                    <div class="d-flex align-center">
                        <v-btn
                            v-if="isMobile"
                            class="ml-0"
                            variant="plain"
                            icon="mdi-chevron-left"
                            @click="backToAASList()" />
                        <span v-if="!selectedAAS || Object.keys(selectedAAS).length === 0">Submodel List </span>
                        <template v-else-if="submodelListUnfiltered.length > 10">
                            <v-col>
                                <v-text-field
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    label="Search for Submodel ..."
                                    clearable
                                    @update:model-value="filterSubmodelList"></v-text-field>
                            </v-col>
                        </template>
                        <template v-else>
                            <v-icon icon="custom:aasIcon" color="primary" size="small" class="ml-2" />
                            <span class="text-truncate ml-2">
                                {{ nameToDisplay(selectedAAS) }}
                            </span>
                        </template>
                    </div>
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <v-card-text class="pt-2 pb-0 px-2" style="overflow-y: auto; height: calc(100svh - 170px)">
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
                                class="bg-card">
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
                                            <v-chip label border color="primary" size="x-small" class="mr-3">
                                                {{ item.kind && item.kind === 'Template' ? 'SMT' : 'SM' }}
                                            </v-chip>
                                        </template>
                                        <v-tooltip
                                            v-if="!isMobile"
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-x-transition"
                                            :disabled="isMobile">
                                            <!-- Submodel ID -->
                                            <div v-if="item.id" class="text-caption">
                                                <span class="font-weight-bold">{{ 'ID: ' }}</span>
                                                {{ item.id }}
                                            </div>
                                            <!-- Submodel idShort -->
                                            <div v-if="item.idShort" class="text-caption">
                                                <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                                                {{ item.idShort }}
                                            </div>
                                            <!-- Submodel semanticId -->
                                            <div v-if="item?.semanticId?.keys[0]?.value" class="text-caption">
                                                <span class="font-weight-bold"> {{ 'semanticId: ' }}</span>
                                                {{ item.semanticId.keys[0].value }}
                                            </div>
                                            <v-divider v-if="item.administration?.version" class="my-1" />
                                            <!-- Submodel administrative information -->
                                            <div v-if="item.administration?.version" class="text-caption">
                                                <span class="font-weight-bold">{{ 'Version: ' }}</span>
                                                {{
                                                    item.administration.version +
                                                    (item.administration.revision
                                                        ? '.' + item.administration.revision
                                                        : '')
                                                }}
                                            </div>
                                            <v-divider
                                                v-if="
                                                    item?.semanticId?.keys[0]?.value &&
                                                    (smts.find(
                                                        (smt: any) => item.semanticId.keys[0].value === smt.semanticId
                                                    ) ||
                                                        extractVersionRevision(item.semanticId.keys[0].value).version)
                                                "
                                                class="my-1" />
                                            <!-- Submodel Template name -->
                                            <div
                                                v-if="
                                                    smts.find(
                                                        (smt: any) =>
                                                            item?.semanticId?.keys[0]?.value === smt.semanticId
                                                    )
                                                "
                                                class="text-caption">
                                                <span class="font-weight-bold">{{ 'SMT: ' }}</span>
                                                {{
                                                    smts.find(
                                                        (smt: any) =>
                                                            item?.semanticId?.keys[0]?.value === smt.semanticId
                                                    )?.name
                                                }}
                                            </div>
                                            <!-- Submodel Template version -->
                                            <div
                                                v-if="
                                                    smts.find(
                                                        (smt: any) =>
                                                            item?.semanticId?.keys[0]?.value === smt.semanticId
                                                    )
                                                "
                                                class="text-caption">
                                                <span class="font-weight-bold">{{ 'SMT Version: ' }}</span>
                                                {{
                                                    smts.find(
                                                        (smt: any) =>
                                                            item?.semanticId?.keys[0]?.value === smt.semanticId
                                                    )?.version
                                                }}
                                            </div>
                                            <!-- Submodel Template version extracted from semanticId -->
                                            <div
                                                v-else-if="
                                                    item?.semanticId?.keys[0]?.value &&
                                                    extractVersionRevision(item?.semanticId?.keys[0]?.value).version
                                                "
                                                class="text-caption">
                                                <span class="font-weight-bold">{{ 'SMT Version: ' }}</span>
                                                {{
                                                    extractVersionRevision(item?.semanticId?.keys[0]?.value).version +
                                                    (extractVersionRevision(item?.semanticId?.keys[0]?.value).revision
                                                        ? '.' +
                                                          extractVersionRevision(item?.semanticId?.keys[0]?.value)
                                                              .revision
                                                        : '')
                                                }}
                                            </div>
                                        </v-tooltip>
                                        <v-list-item-title
                                            :class="isSelected(item) ? 'text-primary' : 'text-listItemText'">
                                            {{ smTitleToDisplay(item) }}
                                        </v-list-item-title>
                                        <template v-if="smVersionToDisplay(item)" #append>
                                            <v-chip size="x-small"> v{{ smVersionToDisplay(item) }} </v-chip>
                                        </template>
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
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractVersionRevision } from '@/utils/AAS/SemanticIdUtils';
    import { smts } from '@/utils/AAS/SubmodelTemplateUtils';

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
    const infrastructureStore = useInfrastructureStore();

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
    const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL);
    const submodelRegistryURL = computed(() => infrastructureStore.getSubmodelRegistryURL);
    const isMobile = computed(() => navigationStore.getIsMobile);
    const primaryColor = computed(() => theme.current.value.colors.primary);

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
            let submodelsSorted = submodels.sort((smA: any, smB: any) => {
                // Sort SMs with respect to displayed title and version
                return smTitleToDisplay(smA) + '|' + smVersionToDisplay(smA) >
                    smTitleToDisplay(smB) + '|' + smVersionToDisplay(smB)
                    ? 1
                    : -1;
            });

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
        // No deselection on mobile
        // On mobile every click on a submodel routes to visualization ()
        if (isSelected(submodel) && !isMobile.value) {
            // Deselect submodel: remove the path query
            const query = structuredClone(route.query);
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

    function smTitleToDisplay(sm: any): string {
        // If there is a specified displayName, use it
        if (sm?.displayName && Array.isArray(sm?.displayName) && sm?.displayName.length > 0) return nameToDisplay(sm);

        // Use name of SMT specification
        const smt = smts.find((smt: any) => sm?.semanticId?.keys[0]?.value === smt.semanticId);
        if (smt) return smt.name;

        return nameToDisplay(sm);
    }

    function smVersionToDisplay(sm: any): string {
        // If there are administrative information use it
        if (sm.administration?.version)
            return sm.administration.version + (sm.administration.revision ? '.' + sm.administration.revision : '');

        // Use version of SMT specification
        if (sm?.semanticId?.keys[0]?.value) {
            const smt = smts.find((smt: any) => sm.semanticId.keys[0].value === smt.semanticId);
            if (smt) return smt.version;
        }

        // Use version of from semanticId
        if (sm?.semanticId?.keys[0]?.value) {
            const semanticId = sm.semanticId.keys[0].value;

            if (semanticId.startsWith('http') && extractVersionRevision(semanticId)) {
                return (
                    extractVersionRevision(semanticId).version +
                    (extractVersionRevision(semanticId).revision
                        ? '.' + extractVersionRevision(semanticId).revision
                        : '')
                );
            }
        }

        return '';
    }
</script>
