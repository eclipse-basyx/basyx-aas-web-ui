<template>
    <div class="VTreeview">
        <v-lazy transition="fade-transition">
            <v-list-item
                :style="{ 'padding-left': depth * 22 + 'px' }"
                density="compact"
                class="py-0"
                :class="editMode && item.modelType === 'Submodel' ? 'pr-0' : ''"
                nav
                slim
                color="primary"
                :active="isSelected(item)"
                @click="selectSmOrSme(item)">
                <v-list-item-title>{{ nameToDisplay(item) }}</v-list-item-title>
                <template #prepend>
                    <!-- Button to show/hide children -->
                    <v-btn
                        v-if="item.children"
                        class="ml-n1"
                        size="small"
                        variant="plain"
                        :icon="item.showChildren ? 'mdi-menu-down' : 'mdi-menu-right'"
                        :ripple="false"
                        @click.stop="toggleTree(item)"></v-btn>
                    <div v-else style="width: 40px; height: 40px"></div>
                    <!-- Lock Icon for Authorization Errors -->
                    <v-icon v-if="item.authorizationError" color="error"> mdi-folder-lock </v-icon>
                    <!-- Empty Submodel Icon -->
                    <v-icon v-else-if="item.modelType === 'Submodel' && !item.children" color="primary">
                        mdi-folder-alert
                    </v-icon>
                    <!-- Icon for Submodel with children (open/closed) -->
                    <v-icon v-else-if="item.modelType === 'Submodel' && item.children" color="primary">
                        {{ item.showChildren ? 'mdi-folder-open' : 'mdi-folder' }}
                    </v-icon>
                    <!-- Icon for empty SubmodelelementCollection -->
                    <v-icon
                        v-else-if="item.modelType === 'SubmodelElementCollection' && !item.children"
                        color="primary">
                        mdi-file-alert
                    </v-icon>
                    <!-- Icon for SubmodelelementCollection -->
                    <v-icon v-else-if="item.modelType === 'SubmodelElementCollection'" color="primary">
                        mdi-file-multiple
                    </v-icon>
                    <!-- Icon for empty SubmodelelementList -->
                    <v-icon v-else-if="item.modelType === 'SubmodelElementList' && !item.children" color="primary">
                        mdi-file-alert
                    </v-icon>
                    <!-- Icon for SubmodelelementList -->
                    <v-icon v-else-if="item.modelType === 'SubmodelElementList'" color="primary">mdi-list-box</v-icon>
                    <!-- Icon for empty Entities -->
                    <v-icon v-else-if="item.modelType === 'Entity' && !item.children" color="primary">
                        mdi-file-alert
                    </v-icon>
                    <!-- Icon for Entities -->
                    <v-icon v-else-if="item.modelType === 'Entity'" color="primary">mdi-format-list-group</v-icon>
                    <!-- Icon for every other SubmodelElement (like Property) -->
                    <v-icon v-else color="primary">mdi-file-code</v-icon>
                </template>
                <template #append>
                    <v-chip v-if="item.modelType" color="primary" size="x-small">{{ item.modelType }}</v-chip>
                    <!-- Button to Copy the Path to the clipboard -->
                    <v-tooltip
                        v-if="isSelected(item) && (!editMode || (editMode && item.modelType !== 'Submodel'))"
                        text="Copy Path to Clipboard"
                        :open-delay="600"
                        location="bottom">
                        <template #activator="{ props }">
                            <v-icon
                                color="subtitleText"
                                v-bind="props"
                                class="ml-1"
                                @click="copyToClipboard(item.path, 'Path', copyIconAsRef)">
                                {{ copyIcon }}
                            </v-icon>
                        </template>
                    </v-tooltip>
                    <!-- Context menu for Submodels -->
                    <v-menu v-if="editMode && item.modelType === 'Submodel'">
                        <template #activator="{ props }">
                            <v-btn
                                icon="mdi-dots-vertical"
                                size="small"
                                variant="plain"
                                color="subtitleText"
                                v-bind="props"></v-btn>
                        </template>
                        <v-sheet border>
                            <v-list dense density="compact" class="py-0" slim>
                                <!-- Copy SM endpoint to clipboard -->
                                <v-list-item @click="copyToClipboard(item.path, 'SM endpoint', copyIconAsRef)">
                                    <template #prepend>
                                        <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                    </template>
                                    <v-list-item-subtitle>Copy Submodel endpoint</v-list-item-subtitle>
                                </v-list-item>
                                <v-divider></v-divider>
                                <!-- Open Add SubmodelElement dialog -->
                                <v-list-item @click="$emit('openAddSubmodelElementDialog', item)">
                                    <template #prepend>
                                        <v-icon size="x-small">mdi-plus</v-icon>
                                    </template>
                                    <v-list-item-subtitle>Add Submodel Element</v-list-item-subtitle>
                                </v-list-item>
                                <!-- Open Submodel edit dialog -->
                                <v-list-item @click="$emit('openEditDialog', item)">
                                    <template #prepend>
                                        <v-icon size="x-small">mdi-pencil</v-icon>
                                    </template>
                                    <v-list-item-subtitle>Edit Submodel</v-list-item-subtitle>
                                </v-list-item>
                                <!-- Delete Submodel -->
                                <v-list-item @click="$emit('showDeleteDialog', item)">
                                    <template #prepend>
                                        <v-icon size="x-small">mdi-delete</v-icon>
                                    </template>
                                    <v-list-item-subtitle>Delete Submodel</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-sheet>
                    </v-menu>
                    <template v-else-if="editMode"></template>
                </template>
            </v-list-item>
        </v-lazy>
        <!-- Recursive Treeview -->
        <template v-if="item.showChildren">
            <vTreeview
                v-for="innerItem in item.children"
                :key="innerItem.id"
                :item="innerItem"
                :depth="depth + 1"></vTreeview>
        </template>
    </div>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { nameToDisplay } = useReferableUtils();
    const { copyToClipboard } = useClipboardUtil();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Props
    defineProps({
        item: {
            type: Object as any,
            default: {} as any,
        },
        depth: {
            type: Number,
            default: 0,
        },
    });

    // Emits
    defineEmits(['openEditDialog', 'showDeleteDialog', 'openAddSubmodelElementDialog']);

    // Data
    const copyIcon = ref<string>('mdi-clipboard-file-outline');

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const editMode = computed(() => route.name === 'AASEditor');
    const isMobile = computed(() => navigationStore.getIsMobile);
    const copyIconAsRef = computed(() => copyIcon);

    function toggleTree(smOrSme: any): void {
        smOrSme.showChildren = !smOrSme.showChildren;
    }

    function selectSmOrSme(smOrSme: any): void {
        if (isSelected(smOrSme)) {
            // Deselect submodel: remove the path query
            let query = { ...route.query };
            delete query.path;
            router.push({ query: query });
        } else {
            // Select submodel/submodel element: add smePath to path query
            let query = { ...route.query };
            query.path = smOrSme.path;
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
        }
    }

    function isSelected(smOrSme: any): boolean {
        if (
            !selectedNode.value ||
            Object.keys(selectedNode.value).length === 0 ||
            !selectedNode.value.path ||
            !smOrSme ||
            Object.keys(smOrSme).length === 0 ||
            !smOrSme.path
        ) {
            return false;
        }
        return selectedNode.value.path === smOrSme.path;
    }
</script>
