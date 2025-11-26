<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <!-- Title bar -->
            <template v-if="!singleAas">
                <v-card-title>
                    <v-row align="center">
                        <v-col cols="auto" class="px-0">
                            <v-tooltip open-delay="600" location="bottom" :disabled="isMobile">
                                <template #activator="{ props }">
                                    <v-btn
                                        icon="mdi-reload"
                                        variant="plain"
                                        :loading="listLoading"
                                        v-bind="props"
                                        @click="initialize()">
                                        <template #loader>
                                            <span class="custom-loader"><v-icon light>mdi-cached</v-icon></span>
                                        </template>
                                    </v-btn>
                                </template>
                                <span>Reload AAS List</span>
                            </v-tooltip>
                        </v-col>
                        <!-- AAS Search Field -->
                        <v-col class="pl-0" :class="editMode || allowUploading ? 'pr-0' : 'pr-2'">
                            <v-text-field
                                variant="outlined"
                                density="compact"
                                hide-details
                                label="Search for AAS..."
                                clearable
                                :placeholder="aasList.length.toString() + ' Shells'"
                                persistent-placeholder
                                @update:model-value="debouncedFilterAasList"></v-text-field>
                        </v-col>
                        <!-- Add AAS -->
                        <v-col cols="auto" class="px-0">
                            <v-menu v-if="editMode">
                                <template #activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" variant="plain" v-bind="props"></v-btn>
                                </template>
                                <v-sheet border>
                                    <v-list density="compact" class="py-0">
                                        <!-- Open Upload Dialog -->
                                        <template v-if="allowUploading">
                                            <v-tooltip
                                                open-delay="600"
                                                :location="editMode ? 'end' : 'bottom'"
                                                :disabled="isMobile">
                                                <template #activator="{ props }">
                                                    <v-list-item
                                                        prepend-icon="mdi-upload"
                                                        slim
                                                        v-bind="props"
                                                        @click="uploadAASDialog = true">
                                                        <template #prepend>
                                                            <v-icon size="small">mdi-upload</v-icon>
                                                        </template>
                                                        Upload AAS
                                                    </v-list-item>
                                                </template>
                                                <span>Upload AAS File to Environment</span>
                                            </v-tooltip>
                                            <v-divider></v-divider>
                                        </template>
                                        <!-- Open AAS create dialog -->
                                        <v-tooltip open-delay="600" location="end">
                                            <template #activator="{ props }">
                                                <v-list-item slim v-bind="props" @click="openEditDialog(true)">
                                                    <template #prepend>
                                                        <v-icon size="small">mdi-plus</v-icon>
                                                    </template>
                                                    Create AAS
                                                </v-list-item>
                                            </template>
                                            <span>Create a new AAS</span>
                                        </v-tooltip>
                                    </v-list>
                                </v-sheet>
                            </v-menu>
                            <v-tooltip
                                v-else-if="allowUploading"
                                open-delay="600"
                                :location="editMode ? 'end' : 'bottom'"
                                :disabled="isMobile">
                                <template #activator="{ props }">
                                    <v-btn
                                        icon="mdi-upload"
                                        variant="plain"
                                        v-bind="props"
                                        @click="uploadAASDialog = true"></v-btn>
                                </template>
                                <span>Upload AAS File to Environment</span>
                            </v-tooltip>
                        </v-col>
                    </v-row>
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <!-- AAS List -->
            <v-list
                v-if="!singleAas"
                nav
                bg-color="card"
                class="pa-0"
                :style="{
                    display: 'flex',
                    'flex-direction': 'column',
                }">
                <template v-if="listLoading">
                    <v-list-item v-for="i in 6" :key="i" density="compact" :height="48" nav class="px-0 py-3">
                        <v-list-item-title>
                            <v-skeleton-loader type="list-item" :width="300"></v-skeleton-loader>
                        </v-list-item-title>
                        <template #append>
                            <v-skeleton-loader type="list-item" :width="50"></v-skeleton-loader>
                        </template>
                    </v-list-item>
                </template>
                <template v-else>
                    <v-virtual-scroll ref="virtualScrollRef" :items="aasList" :item-height="56" class="pb-2 bg-card">
                        <template #default="{ item }">
                            <!-- Single AAS -->
                            <v-list-item
                                v-if="item && Object.keys(item).length > 0"
                                class="mt-2 mx-2"
                                :active="isSelected(item)"
                                color="primarySurface"
                                base-color="listItem"
                                variant="tonal"
                                style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
                                :border="isSelected(item) ? 'primary' : 'listItem thin'"
                                :style="{
                                    'border-color': isSelected(item)
                                        ? primaryColor + ' !important'
                                        : isDark
                                          ? '#686868 !important'
                                          : '#ABABAB !important',
                                }"
                                @click="selectAAS(item)">
                                <!-- Tooltip with idShort and id -->
                                <v-tooltip
                                    v-if="!isMobile"
                                    activator="parent"
                                    open-delay="600"
                                    transition="slide-x-transition"
                                    :disabled="isMobile">
                                    <!-- AAS ID -->
                                    <div v-if="item.id" class="text-caption">
                                        <span class="font-weight-bold">{{ 'ID: ' }}</span>
                                        {{ item.id }}
                                    </div>
                                    <!-- AAS idShort -->
                                    <div v-if="item.idShort" class="text-caption">
                                        <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                                        {{ item.idShort }}
                                    </div>
                                    <v-divider v-if="item.administration?.version" class="my-1" />
                                    <!-- AAS administrative information -->
                                    <div v-if="item.administration?.version" class="text-caption">
                                        <span class="font-weight-bold">{{ 'Version: ' }}</span>
                                        {{
                                            item.administration.version +
                                            (item.administration.revision ? '.' + item.administration.revision : '')
                                        }}
                                    </div>
                                </v-tooltip>
                                <template #title>
                                    <div class="text-primary" style="z-index: 9999">
                                        {{ nameToDisplay(item) }}
                                    </div>
                                </template>
                                <template #subtitle>
                                    <div class="text-listItemText">{{ item.id }}</div>
                                </template>
                                <!-- open Details Button (with Status Badge) -->
                                <template #append>
                                    <v-badge
                                        :model-value="
                                            item.status && item.status.trim() !== '' && item.status === 'offline'
                                                ? true
                                                : false
                                        "
                                        icon="mdi-network-strength-4-alert"
                                        color="error"
                                        text-color="buttonText"
                                        inline></v-badge>
                                    <v-menu v-if="editMode">
                                        <template #activator="{ props }">
                                            <v-btn
                                                icon="mdi-dots-vertical"
                                                variant="plain"
                                                color="listItemText"
                                                size="x-small"
                                                v-bind="props"
                                                @click.prevent></v-btn>
                                        </template>
                                        <v-sheet border>
                                            <v-list dense slim density="compact" class="py-0">
                                                <v-list-item @click="openDownloadDialog(item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-download</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Download AAS</v-list-item-subtitle>
                                                </v-list-item>
                                                <v-divider></v-divider>
                                                <!-- Open AAS edit dialog -->
                                                <v-list-item @click="openEditDialog(false, item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-pencil</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Edit AAS</v-list-item-subtitle>
                                                </v-list-item>
                                                <!-- Delete AAS -->
                                                <v-list-item @click="openDeleteDialog(item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-delete</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Delete AAS</v-list-item-subtitle>
                                                </v-list-item>
                                                <v-divider></v-divider>
                                                <!-- Copy AAS Endpoint to clipboard -->
                                                <v-list-item
                                                    @click.stop="
                                                        copyToClipboard(item.path, 'AAS Endpoint', copyIconAsRef)
                                                    ">
                                                    <template #prepend>
                                                        <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Copy AAS Endpoint</v-list-item-subtitle>
                                                </v-list-item>
                                            </v-list>
                                        </v-sheet>
                                    </v-menu>
                                    <template v-else>
                                        <v-btn
                                            v-if="isSelected(item)"
                                            icon="mdi-content-cut"
                                            size="x-small"
                                            variant="plain"
                                            color="listItemText"
                                            class="ml-n2"
                                            style="z-index: 9000"
                                            @click.stop="cutCopyPasteShell(item, 0)"></v-btn>
                                        <v-btn
                                            v-if="isSelected(item)"
                                            icon="mdi-content-copy"
                                            size="x-small"
                                            variant="plain"
                                            color="listItemText"
                                            class="ml-n2"
                                            style="z-index: 9000"
                                            @click.stop="cutCopyPasteShell(item, 1)"></v-btn>
                                        <v-btn
                                            v-if="isSelected(item)"
                                            icon="mdi-content-paste"
                                            size="x-small"
                                            variant="plain"
                                            color="listItemText"
                                            class="ml-n2"
                                            style="z-index: 9000"
                                            @click.stop="cutCopyPasteShell(item, 2)"></v-btn>
                                        <v-btn
                                            v-if="isSelected(item)"
                                            icon="mdi-delete"
                                            size="x-small"
                                            variant="plain"
                                            color="listItemText"
                                            class="ml-n2"
                                            style="z-index: 9000"
                                            @click.stop="deleteShell(item)"></v-btn>
                                    </template>
                                </template>
                            </v-list-item>
                        </template>
                    </v-virtual-scroll>
                </template>
            </v-list>
        </v-card>
    </v-container>
    <!-- Dialog for creating/editing AAS -->
    <AASForm v-model="editDialog" :new-shell="newShell" :aas="aasToEdit"></AASForm>
    <!-- Dialog for uploading AAS -->
    <UploadAAS v-model="uploadAASDialog"></UploadAAS>
    <!-- Dialog for deleting AAS -->
    <DeleteAAS v-model="deleteDialog" :aas="aasToDelete" :list-loading-state="listLoading"></DeleteAAS>
    <!-- Dialog for downloading AAS -->
    <DownloadAAS v-model="downloadAASDialog" :aas="aasToDownload"></DownloadAAS>
</template>

<script lang="ts" setup>
    import type { ComponentPublicInstance } from 'vue';
    import _ from 'lodash';
    import debounce from 'lodash/debounce';
    import { computed, onActivated, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';

    // Extend the ComponentPublicInstance type to include scrollToIndex
    interface VirtualScrollInstance extends ComponentPublicInstance {
        scrollToIndex: (index: number) => void;
    }

    // Vue Router
    const route = useRoute();

    interface Props {
        useSecondaryRepo?: boolean;
    }
    const props = withDefaults(defineProps<Props>(), {
        useSecondaryRepo: false,
    });

    // Composables
    const { fetchAasDescriptorList, fetchAasList, aasIsAvailableById } = useAASHandling(true, props.useSecondaryRepo);
    const { nameToDisplay, descriptionToDisplay } = useReferableUtils();
    const { copyToClipboard } = useClipboardUtil();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore('commanderList');
    const envStore = useEnvStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const aasList = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data (AAS or AAS Descriptors)
    const aasListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data before filtering
    const debouncedFilterAasList = debounce(filterAasList, 300); // Debounced function to filter the AAS List
    const listLoading = ref(false); // Variable to store if the AAS List is loading
    const deleteDialog = ref(false); // Variable to store if the Delete Dialog should be shown
    const downloadAASDialog = ref(false); // Variable to store if the DownloadAAS Dialog should be shown
    const aasToDelete = ref({}); // Variable to store the AAS to be deleted
    const aasToDownload = ref({}); // Variable to store the AAS to be downloaded
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component
    const uploadAASDialog = ref(false); // Variable to store if the Upload AAS Dialog should be shown
    const editDialog = ref(false); // Variable to store if the Edit Dialog should be shown
    const newShell = ref(false); // Variable to store if a new Shell should be created
    const aasToEdit = ref<any | undefined>(undefined); // Variable to store the AAS to be edited
    const statusCheckInterval = ref<number | undefined>(undefined);
    const copyIcon = ref<string>('mdi-clipboard-file-outline');

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const isDark = computed(() => theme.global.current.value.dark); // Check if the current Theme is dark
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // Get AAS Registry URL from Store
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const primaryColor = computed(() => theme.current.value.colors.primary); // returns the primary color of the current theme
    const triggerAASListReload = computed(() => navigationStore.getTriggerAASListReload); // Get the trigger signal for AAS List reload from store
    const singleAas = computed(() => envStore.getSingleAas); // Get the single AAS state from the Store
    const editMode = computed(() => route.name === 'AASEditor'); // Check if the current Route is the AAS Editor
    const allowUploading = false; //computed(() => envStore.getAllowUploading); // Check if the current environment config allows uploading shells
    const statusCheck = computed(() => navigationStore.getStatusCheck);
    const copyIconAsRef = computed(() => copyIcon);

    // For managing the Cut, Copy, and Paste Operations
    let deleteAfter = -1;
    const { getSubmodelRefsById, otherUploadURL } = useAASRepositoryClient(props.useSecondaryRepo);
    const { fetchSmById, submodelRepoUrl } = useSMRepositoryClient(props.useSecondaryRepo);
    const { getRequest, postRequest, deleteRequest } = useRequestHandling();
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';

    // Watchers
    watch(
        () => aasRegistryURL.value,
        () => {
            initialize();
        }
    );

    watch(
        () => selectedAAS.value,
        () => {
            scrollToSelectedAAS();
        },
        { deep: true }
    );

    watch(
        () => statusCheck.value,
        (statusCheckValue) => {
            window.clearInterval(statusCheckInterval.value); // clear old interval
            if (statusCheckValue.state === true) {
                updateStatus();

                // create new interval
                statusCheckInterval.value = window.setInterval(() => {
                    updateStatus();
                }, statusCheck.value.interval);
            } else {
                aasList.value.forEach((aasDescriptor: any) => {
                    aasDescriptor.status = 'check disabled';
                });

                // Reset status icon after 2 seconds
                setTimeout(() => {
                    aasList.value.forEach((aasDescriptor: any) => {
                        aasDescriptor.status = '';
                    });
                }, 2000);
            }
        },
        { deep: true }
    );

    watch(
        () => triggerAASListReload.value,
        (triggerVal) => {
            if (triggerVal === true) {
                initialize();
            }
        }
    );

    onMounted(() => {
        if (statusCheck.value.state === true) {
            window.clearInterval(statusCheckInterval.value); // clear old interval

            // create new interval
            statusCheckInterval.value = window.setInterval(() => {
                updateStatus();
            }, statusCheck.value.interval);
        }

        initialize();
    });

    onBeforeUnmount(() => {
        window.clearInterval(statusCheckInterval.value);
    });

    onActivated(() => {
        scrollToSelectedAAS();
    });

    // Function to get the AAS Data from the Registry Server
    async function initialize(): Promise<void> {
        listLoading.value = true;
        fetchAasDescriptorList().then(async (aasDescriptorList: Array<any>) => {
            let sortedList =
                aasDescriptorList.length > 0
                    ? aasDescriptorList.sort((a, b) => (a.id > b.id ? 1 : -1))
                    : (await fetchAasList()).sort((a, b) => (a.id > b.id ? 1 : -1));

            // Precompute lowercase search fields
            const processedList = sortedList.map((item) => ({
                ...item,
                idLower: item?.id?.toLowerCase() || '',
                idShortLower: item?.idShort?.toLowerCase() || '',
                nameLower: nameToDisplay(item).toLowerCase(),
                descLower: descriptionToDisplay(item).toLowerCase(),
            }));

            aasList.value = processedList;
            aasListUnfiltered.value = processedList;
            scrollToSelectedAAS();
            listLoading.value = false;
        });
    }

    /**
     * Updates the status of each AAS descriptor in the descriptor list.
     *
     * This function checks the availability of the AAS in the repository
     * updates its status based on the result.
     *
     * @param {boolean} [init=false] - Indicates whether to initialize the status
     *                                  of descriptors. If true, sets status to
     *                                  an empty string; if false, sets it
     *                                  based on availability checks.
     */
    function updateStatus(init: boolean = false): void {
        if (Array.isArray(aasList.value) && aasList.value.length > 0)
            aasList.value.forEach(async (aasOrAasDescriptor: any) => {
                if (aasOrAasDescriptor && Object.keys(aasOrAasDescriptor).length > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 600)); // Give the UI the chance to refresh status icons

                    const aasIsAvailable = await aasIsAvailableById(aasOrAasDescriptor.id);

                    if (aasIsAvailable) {
                        aasOrAasDescriptor.status =
                            statusCheck.value.state === true ? 'online' : init ? '' : 'check disabled';
                    } else {
                        aasOrAasDescriptor.status =
                            statusCheck.value.state === true ? 'offline' : init ? '' : 'check disabled';
                    }
                }
            });
    }

    function filterAasList(value: string): void {
        if (!value || value.trim() === '') {
            aasList.value = aasListUnfiltered.value;
        } else {
            const search = value.toLowerCase();
            aasList.value = aasListUnfiltered.value.filter(
                (aasOrAasDescriptor) =>
                    aasOrAasDescriptor.idLower.includes(search) ||
                    aasOrAasDescriptor.idShortLower.includes(search) ||
                    aasOrAasDescriptor.nameLower.includes(search) ||
                    aasOrAasDescriptor.descLower.includes(search)
            );
        }
        scrollToSelectedAAS();
    }

    // Function to select an AAS
    function selectAAS(aas: any): void {
        if (listLoading.value) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Please wait for the current Request to finish.',
            });
            return;
        }
        if (isSelected(aas)) {
            // Deselect AAS: remove aas and path url query parameter
            const query = _.cloneDeep(route.query);
            if (Object.hasOwn(query, 'aas')) delete query.aas;
            if (Object.hasOwn(query, 'path')) delete query.path;
            selectedAAS.value.id = undefined;
        } else {
            // Select AAS: Set AAS path as aas url query parameter
            const query = _.cloneDeep(route.query);
            query.aas = aas.path;
            if (Object.hasOwn(query, 'path')) delete query.path;
            selectedAAS.value.id = aas.id;
        }
    }

    function isSelected(aasOrAasDescriptor: any): boolean {
        if (
            !selectedAAS.value ||
            Object.keys(selectedAAS.value).length === 0 ||
            !selectedAAS.value.id ||
            !aasOrAasDescriptor ||
            Object.keys(aasOrAasDescriptor).length === 0 ||
            !aasOrAasDescriptor.id
        ) {
            deleteAfter = -1; // Reset variable for Cut, Copy, and Paste
            return false;
        }
        return selectedAAS.value.id === aasOrAasDescriptor.id;
    }

    async function cutCopyPasteShell(aasDescriptor: any, cutCopyOrPaste: number): Promise<boolean> {
        let success = true;
        if (cutCopyOrPaste == 0) {
            deleteAfter = 1;
        } else if (cutCopyOrPaste == 1) {
            deleteAfter = 0;
        } else if (cutCopyOrPaste == 2) {
            if (deleteAfter > -1) {
                success = await transfer(aasDescriptor);
                //return if false
            }
            // Delete the Source AAS in case of Cut
            if (deleteAfter == 1) {
                success = await deleteShell(aasDescriptor);
            }
            deleteAfter = -1;
        }
        return success;
    }

    async function deleteShell(aasDescriptor: any): Promise<boolean> {
        let success = true;
        const submodelIds = ref<any[]>([]);
        const submodelRefs = await getSubmodelRefsById(aasDescriptor.id);
        for (const submodelRef of submodelRefs) {
            const submodel = await fetchSmById(submodelRef.keys[0].value);
            submodelIds.value.push({ smId: submodelRef.keys[0].value, smIdShort: submodel.idShort, submodel });
        }
        const disableMessage = false;
        await removeAAS(aasDescriptor);
        // Remove each submodel
        for (const submodelId of submodelIds.value) {
            const submodelFromRepo = await fetchSmById(submodelId);
            const deletePath = extractEndpointHref(submodelFromRepo, 'SUBMODEL-3.0');
            await deleteRequest(deletePath, 'removing Submodel', disableMessage);
        }
        return success;
    }

    async function removeAAS(AAS: any): Promise<void> {
        const aasEndpoint = extractEndpointHref(AAS, 'AAS-3.0');
        let path = aasEndpoint;
        let context = 'removing AAS';
        let disableMessage = false;
        await deleteRequest(path, context, disableMessage);
    }

    async function transfer(aasDescriptor: any): Promise<boolean> {
        // First download AAS from source
        const selected = ref<string[]>([]);
        const submodelIds = ref<any[]>([]);
        const submodelRefs = await getSubmodelRefsById(aasDescriptor.id);
        //let aasSerializationPath = aasDescriptor.endpoints[0].protocolInformation.href.split('/shells')[0];
        let aasSerializationPath = aasDescriptor.path.split('/shells')[0];
        for (const submodelRef of submodelRefs) {
            const submodel = await fetchSmById(submodelRef.keys[0].value);
            submodelIds.value.push({ smId: submodelRef.keys[0].value, smIdShort: submodel.idShort, submodel });
            selected.value.push(submodelRef.keys[0].value);
        }
        aasSerializationPath +=
            '/serialization?aasIds=' +
            base64Encode(aasDescriptor.id) +
            '&submodelIds=' +
            selected.value.map((submodelId: string) => base64Encode(submodelId)).join('&submodelIds=') +
            '&includeConceptDescriptions=true';

        const aasSerializationContext = 'retrieving AAS serialization';
        const disableMessage = false;
        const aasSerializationHeaders = new Headers();
        aasSerializationHeaders.append('Accept', 'application/asset-administration-shell-package+xml');

        const aasSerializationResponse = await getRequest(
            aasSerializationPath,
            aasSerializationContext,
            disableMessage,
            aasSerializationHeaders
        );
        if (aasSerializationResponse.success) {
            // Now upload AAS to destination
            const aasSerialization = aasSerializationResponse.data;
            const context = 'uploading AAS';
            const headers = new Headers();
            const formData = new FormData();
            formData.append('file', aasSerialization);
            /*const uploadResponse =*/ await postRequest(
                otherUploadURL.value,
                formData,
                headers,
                context,
                disableMessage
            );
            return true;
        }
        return false;
    }

    // Function to scroll to the selected AAS
    function scrollToSelectedAAS(): void {
        // Find the index of the selected item
        const index = aasList.value.findIndex((aasOrAasDescriptor: any) => isSelected(aasOrAasDescriptor));

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

    function openDeleteDialog(aasOrAasDescriptor: any): void {
        deleteDialog.value = true;
        aasToDelete.value = aasOrAasDescriptor;
    }

    function openDownloadDialog(aasDescriptor: any): void {
        downloadAASDialog.value = true;
        aasToDownload.value = aasDescriptor;
    }

    function openEditDialog(createNew: boolean, aasOrAasDescriptor?: any): void {
        editDialog.value = true;
        newShell.value = createNew;
        if (createNew === false && aasOrAasDescriptor) {
            aasToEdit.value = aasOrAasDescriptor;
        }
    }
</script>

<style>
    .custom-loader {
        animation: loader 1s infinite;
        display: flex;
    }

    @-moz-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-webkit-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-o-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>
