<template>
    <div class="VTreeview">
        <v-hover>
            <template #default="{ isHovering, props }">
                <v-lazy transition="fade-transition">
                    <v-list-item
                        :style="{ 'padding-left': depth * 22 + 'px' }"
                        density="compact"
                        class="py-0"
                        :class="editMode ? 'pr-0' : ''"
                        nav
                        slim
                        color="primary"
                        :active="isSelected(item)"
                        v-bind="props"
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
                            <!-- Icon for Submodel Template with children -->
                            <v-icon
                                v-else-if="
                                    item.modelType === 'Submodel' &&
                                    item.kind &&
                                    item.kind === 'Template' &&
                                    item.children
                                "
                                color="primary">
                                mdi-folder-pound
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
                            <v-icon
                                v-else-if="item.modelType === 'SubmodelElementList' && !item.children"
                                color="primary">
                                mdi-file-alert
                            </v-icon>
                            <!-- Icon for SubmodelelementList -->
                            <v-icon v-else-if="item.modelType === 'SubmodelElementList'" color="primary"
                                >mdi-list-box</v-icon
                            >
                            <!-- Icon for empty Entities -->
                            <v-icon v-else-if="item.modelType === 'Entity' && !item.children" color="primary">
                                mdi-file-alert
                            </v-icon>
                            <!-- Icon for Entities -->
                            <v-icon v-else-if="item.modelType === 'Entity'" color="primary"
                                >mdi-format-list-group</v-icon
                            >
                            <!-- Icon for every other SubmodelElement (like Property) -->
                            <v-icon v-else color="primary">mdi-file-code</v-icon>
                        </template>
                        <template #append>
                            <div class="d-flex align-center" style="position: relative; min-height: 24px">
                                <v-chip
                                    v-if="item.modelType"
                                    color="primary"
                                    size="x-small"
                                    :style="{
                                        marginRight:
                                            isHovering && (!editMode || canElementAddSubmodelElement(item))
                                                ? '8px'
                                                : '-24px',
                                        transition: 'margin 0.3s ease',
                                    }"
                                    >{{ item.modelType }}
                                    {{ item.kind && item.kind === 'Template' ? 'Template' : '' }}
                                </v-chip>
                                <!-- Icon Placeholder that is always rendered -->
                                <div class="icon-placeholder">
                                    <!-- Button to add a submodel Element -->
                                    <v-tooltip
                                        v-if="editMode && canElementAddSubmodelElement(item)"
                                        text="Add Submodel Element"
                                        :open-delay="600"
                                        location="bottom">
                                        <template #activator="{ props }">
                                            <v-btn
                                                icon="mdi-plus"
                                                size="small"
                                                variant="plain"
                                                color="subtitleText"
                                                v-bind="props"
                                                class="ml-1"
                                                :style="{
                                                    display: isHovering ? 'block' : 'none',
                                                    transition: '0.2s ease',
                                                    pointerEvents: isHovering ? 'auto' : 'none',
                                                }"
                                                @click.stop="$emit('openAddSubmodelElementDialog', item)" />
                                        </template>
                                    </v-tooltip>
                                    <!-- Button to Copy the Path to the clipboard -->
                                    <v-tooltip
                                        v-if="!editMode"
                                        text="Copy Path to Clipboard"
                                        :open-delay="600"
                                        location="bottom">
                                        <template #activator="{ props }">
                                            <v-btn
                                                :icon="copyIcon"
                                                size="small"
                                                variant="plain"
                                                color="subtitleText"
                                                v-bind="props"
                                                class="ml-1"
                                                :style="{
                                                    display: isHovering ? 'block' : 'none',
                                                    transition: '0.2s ease',
                                                    pointerEvents: isHovering ? 'auto' : 'none',
                                                }"
                                                @click.stop="copyToClipboard(item.path, 'Path', copyIconAsRef)" />
                                        </template>
                                    </v-tooltip>
                                </div>
                            </div>
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
                                        <!-- Open Add SubmodelElement dialog -->
                                        <v-list-item @click="$emit('openAddSubmodelElementDialog', item)">
                                            <template #prepend>
                                                <v-icon size="x-small">mdi-plus</v-icon>
                                            </template>
                                            <v-list-item-subtitle>Add Submodel Element</v-list-item-subtitle>
                                        </v-list-item>
                                        <v-divider></v-divider>
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
                                        <v-divider></v-divider>
                                        <!-- Copy SM Endpoint to clipboard -->
                                        <v-list-item
                                            @click.stop="copyToClipboard(item.path, 'SM Endpoint', copyIconAsRef)">
                                            <template #prepend>
                                                <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                            </template>
                                            <v-list-item-subtitle>Copy Submodel Endpoint</v-list-item-subtitle>
                                        </v-list-item>
                                    </v-list>
                                </v-sheet>
                            </v-menu>
                            <!-- Context menu for Submodel Elements -->
                            <v-menu v-if="editMode && item.modelType !== 'Submodel'">
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
                                        <!-- Open Add SubmodelElement dialog -->
                                        <v-list-item
                                            v-if="
                                                item.modelType === 'SubmodelElementCollection' ||
                                                item.modelType === 'SubmodelElementList' ||
                                                item.modelType === 'Entity'
                                            "
                                            @click="$emit('openAddSubmodelElementDialog', item)">
                                            <template #prepend>
                                                <v-icon size="x-small">mdi-plus</v-icon>
                                            </template>
                                            <v-list-item-subtitle>Add Submodel Element</v-list-item-subtitle>
                                        </v-list-item>
                                        <v-divider
                                            v-if="
                                                item.modelType === 'SubmodelElementCollection' ||
                                                item.modelType === 'SubmodelElementList' ||
                                                item.modelType === 'Entity'
                                            "></v-divider>
                                        <!-- Open Submodel Element edit dialog -->
                                        <v-list-item @click="$emit('openEditSubmodelElementDialog', item)">
                                            <template #prepend>
                                                <v-icon size="x-small">mdi-pencil</v-icon>
                                            </template>
                                            <v-list-item-subtitle>Edit {{ item.modelType }}</v-list-item-subtitle>
                                        </v-list-item>
                                        <!-- Delete Submodel Element -->
                                        <v-list-item @click="$emit('showDeleteDialog', item)">
                                            <template #prepend>
                                                <v-icon size="x-small">mdi-delete</v-icon>
                                            </template>
                                            <v-list-item-subtitle>Delete {{ item.modelType }}</v-list-item-subtitle>
                                        </v-list-item>
                                        <v-divider></v-divider>
                                        <!-- Copy SM endpoint to clipboard -->
                                        <v-list-item @click="copyToClipboard(item.path, 'Path', copyIconAsRef)">
                                            <template #prepend>
                                                <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                            </template>
                                            <v-list-item-subtitle
                                                >Copy {{ item.modelType }} Endpoint</v-list-item-subtitle
                                            >
                                        </v-list-item>
                                    </v-list>
                                </v-sheet>
                            </v-menu>
                            <template v-else-if="editMode"></template>
                        </template>
                    </v-list-item>
                </v-lazy>
            </template>
        </v-hover>
        <!-- Recursive Treeview -->
        <template v-if="item.showChildren">
            <vTreeview
                v-for="innerItem in item.children"
                :key="innerItem.id"
                :item="innerItem"
                :depth="depth + 1"
                @open-add-submodel-element-dialog="$emit('openAddSubmodelElementDialog', $event)"
                @open-edit-submodel-element-dialog="$emit('openEditSubmodelElementDialog', $event)"
                @show-delete-dialog="$emit('showDeleteDialog', $event)"></vTreeview>
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
    defineEmits<{
        (event: 'openEditDialog', item: any): void;
        (event: 'showDeleteDialog', item: any): void;
        (event: 'openAddSubmodelElementDialog', item: any): void;
        (event: 'openEditSubmodelElementDialog', item: any): void;
    }>();

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

    function canElementAddSubmodelElement(item: any): boolean {
        return (
            item.modelType === 'Submodel' ||
            item.modelType === 'SubmodelElementCollection' ||
            item.modelType === 'SubmodelElementList' ||
            item.modelType === 'Entity'
        );
    }
</script>

<style scoped>
    .icon-placeholder {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
