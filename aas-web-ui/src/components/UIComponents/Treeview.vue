<template>
    <div class="Treeview">
        <v-hover>
            <template #default="{ isHovering, props }">
                <v-lazy transition="fade-transition">
                    <v-list-item
                        :style="{ 'padding-left': depth * 22 + 'px' }"
                        density="compact"
                        class="py-0"
                        :class="editorMode ? 'pr-0' : ''"
                        nav
                        slim
                        color="primary"
                        :active="isSelected(item)"
                        v-bind="props"
                        @click="
                            selectSmOrSme(item);
                            openTree(item);
                        ">
                        <v-list-item-title>{{ displayNameWithIndex(item) }}</v-list-item-title>
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
                                            isHovering && (!editorMode || canElementAddSubmodelElement(item))
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
                                        v-if="editorMode && canElementAddSubmodelElement(item)"
                                        text="Add Submodel Element"
                                        :open-delay="600"
                                        location="bottom">
                                        <template #activator="{ props: addSubmodelElementTooltipProps }">
                                            <v-btn
                                                icon="mdi-plus"
                                                size="small"
                                                variant="plain"
                                                color="subtitleText"
                                                v-bind="addSubmodelElementTooltipProps"
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
                                        v-if="!editorMode"
                                        text="Copy Path to Clipboard"
                                        :open-delay="600"
                                        location="bottom">
                                        <template #activator="{ props: copyPathTooltipProps }">
                                            <v-btn
                                                :icon="copyIcon"
                                                size="small"
                                                variant="plain"
                                                color="subtitleText"
                                                v-bind="copyPathTooltipProps"
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
                            <v-menu v-if="editorMode && item.modelType === 'Submodel'" :close-on-content-click="false">
                                <template #activator="{ props: contextMenuProps }">
                                    <v-btn
                                        icon="mdi-dots-vertical"
                                        size="small"
                                        variant="plain"
                                        color="subtitleText"
                                        v-bind="contextMenuProps"></v-btn>
                                </template>
                                <template #default="{ isActive }">
                                    <v-sheet border>
                                        <v-list dense density="compact" class="py-0" slim>
                                            <!-- Open Add SubmodelElement dialog -->
                                            <v-list-item @click="openAddSubmodelElementDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-plus</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Add Submodel Element</v-list-item-subtitle>
                                            </v-list-item>
                                            <!-- Open Insert SubmodelElement from JSON dialog -->
                                            <v-list-item @click="openJsonInsertDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-code-json</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Submodel Element from JSON</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-divider></v-divider>
                                            <!-- Open Submodel edit dialog -->
                                            <v-list-item @click="openEditDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-pencil</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Edit Submodel</v-list-item-subtitle>
                                            </v-list-item>
                                            <!-- Delete Submodel -->
                                            <v-list-item @click="openDeleteDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-delete</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Delete Submodel</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-divider></v-divider>
                                            <!-- Copy SM to internal clipboard -->
                                            <v-list-item
                                                @click.stop="copyElement(item, 'Submodel', copyInternalIconAsRef)">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ copyInternalIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle>Copy Submodel</v-list-item-subtitle>
                                            </v-list-item>
                                            <!-- Copy SM Endpoint to clipboard -->
                                            <v-list-item
                                                @click.stop="copyToClipboard(item.path, 'SM Endpoint', copyIconAsRef)">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle>Copy Submodel Endpoint</v-list-item-subtitle>
                                            </v-list-item>
                                            <!-- Copy SM as JSON -->
                                            <v-list-item
                                                @click.stop="copyJsonToClipboard(item, 'Submodel', copyJsonIconAsRef)">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ copyJsonIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle>Copy Submodel as JSON</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-divider></v-divider>
                                            <!-- Paste SubmodelElement from internal clipboard -->
                                            <v-list-item
                                                :disabled="
                                                    !clipboardElementContentType ||
                                                    clipboardElementContentType === 'Submodel'
                                                "
                                                @click.stop="pasteElement(item)">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ pasteIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle>
                                                    {{
                                                        `Paste ${!clipboardElementContentType || clipboardElementContentType === 'Submodel' ? '' : clipboardElementContentType}`
                                                    }}
                                                </v-list-item-subtitle>
                                            </v-list-item>
                                        </v-list>
                                    </v-sheet>
                                </template>
                            </v-menu>
                            <!-- Context menu for Submodel Elements -->
                            <v-menu v-if="editorMode && item.modelType !== 'Submodel'" :close-on-content-click="false">
                                <template #activator="{ props: contextMenuProps }">
                                    <v-btn
                                        icon="mdi-dots-vertical"
                                        size="small"
                                        variant="plain"
                                        color="subtitleText"
                                        v-bind="contextMenuProps"></v-btn>
                                </template>
                                <template #default="{ isActive }">
                                    <v-sheet border>
                                        <v-list dense density="compact" class="py-0" slim>
                                            <!-- Open Add SubmodelElement dialog -->
                                            <v-list-item
                                                v-if="
                                                    item.modelType === 'SubmodelElementCollection' ||
                                                    item.modelType === 'SubmodelElementList' ||
                                                    item.modelType === 'Entity'
                                                "
                                                @click="openAddSubmodelElementDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-plus</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Add Submodel Element</v-list-item-subtitle>
                                            </v-list-item>
                                            <!-- Open Insert SubmodelElement from JSON dialog -->
                                            <v-list-item
                                                v-if="
                                                    item.modelType === 'SubmodelElementCollection' ||
                                                    item.modelType === 'SubmodelElementList' ||
                                                    item.modelType === 'Entity'
                                                "
                                                @click="openJsonInsertDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-code-json</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Submodel Element from JSON</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-divider
                                                v-if="
                                                    item.modelType === 'SubmodelElementCollection' ||
                                                    item.modelType === 'SubmodelElementList' ||
                                                    item.modelType === 'Entity'
                                                "></v-divider>
                                            <!-- Open Submodel Element edit dialog -->
                                            <v-list-item @click="openSubmodelElementEditDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-pencil</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Edit {{ item.modelType }}</v-list-item-subtitle>
                                            </v-list-item>
                                            <!-- Delete Submodel Element -->
                                            <v-list-item @click="openDeleteDialog(item, isActive)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-delete</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Delete {{ item.modelType }}</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-divider></v-divider>
                                            <!-- Copy SME to internal clipboard -->
                                            <v-list-item
                                                @click="copyElement(item, item.modelType, copyInternalIconAsRef)">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ copyInternalIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle>Copy {{ item.modelType }}</v-list-item-subtitle>
                                            </v-list-item>
                                            <!-- Copy SME endpoint to clipboard -->
                                            <v-list-item @click="copyToClipboard(item.path, 'Path', copyIconAsRef)">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle
                                                    >Copy {{ item.modelType }} Endpoint</v-list-item-subtitle
                                                >
                                            </v-list-item>
                                            <!-- Copy SME as JSON -->
                                            <v-list-item
                                                @click.stop="
                                                    copyJsonToClipboard(item, item.modelType, copyJsonIconAsRef)
                                                ">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ copyJsonIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle
                                                    >Copy {{ item.modelType }} as JSON</v-list-item-subtitle
                                                >
                                            </v-list-item>
                                            <v-divider
                                                v-if="
                                                    item.modelType === 'SubmodelElementCollection' ||
                                                    item.modelType === 'SubmodelElementList' ||
                                                    item.modelType === 'Entity'
                                                "></v-divider>
                                            <!-- Paste SubmodelElement from internal clipboard -->
                                            <v-list-item
                                                v-if="
                                                    item.modelType === 'SubmodelElementCollection' ||
                                                    item.modelType === 'SubmodelElementList' ||
                                                    item.modelType === 'Entity'
                                                "
                                                :disabled="
                                                    !clipboardElementContentType ||
                                                    clipboardElementContentType === 'Submodel'
                                                "
                                                @click="pasteElement(item)">
                                                <template #prepend>
                                                    <v-icon size="x-small">{{ pasteIcon }} </v-icon>
                                                </template>
                                                <v-list-item-subtitle>
                                                    {{
                                                        `Paste ${!clipboardElementContentType || clipboardElementContentType === 'Submodel' ? '' : clipboardElementContentType}`
                                                    }}
                                                </v-list-item-subtitle>
                                            </v-list-item>
                                        </v-list>
                                    </v-sheet>
                                </template>
                            </v-menu>
                            <template v-else-if="editorMode"></template>
                        </template>
                    </v-list-item>
                </v-lazy>
            </template>
        </v-hover>
        <!-- Recursive Treeview -->
        <template v-if="item.showChildren">
            <Treeview
                v-for="innerItem in item.children"
                :key="innerItem.id"
                :item="innerItem"
                :depth="depth + 1"
                @open-add-submodel-element-dialog="$emit('openAddSubmodelElementDialog', $event)"
                @open-edit-submodel-element-dialog="$emit('openEditSubmodelElementDialog', $event)"
                @open-json-insert-dialog="$emit('openJsonInsertDialog', $event)"
                @show-delete-dialog="$emit('showDeleteDialog', $event)"></Treeview>
        </template>
    </div>
</template>

<script lang="ts" setup>
    import { computed, Ref, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import { useAASStore } from '@/store/AASDataStore';
    import { useClipboardStore } from '@/store/ClipboardStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { nameToDisplay } = useReferableUtils();
    const { copyToClipboard, copyJsonToClipboard, pasteElement } = useClipboardUtil();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const clipboardStore = useClipboardStore();

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
    const emit = defineEmits<{
        (event: 'openEditDialog', item: any): void;
        (event: 'showDeleteDialog', item: any): void;
        (event: 'openAddSubmodelElementDialog', item: any): void;
        (event: 'openJsonInsertDialog', item: any): void;
        (event: 'openEditSubmodelElementDialog', item: any): void;
    }>();

    // Data
    const copyInternalIcon = ref<string>('mdi-clipboard-outline');
    const copyIcon = ref<string>('mdi-clipboard-file-outline');
    const copyJsonIcon = ref<string>('mdi-clipboard-text-outline');
    const pasteIcon = ref<string>('mdi-file-document-multiple-outline');

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const editorMode = computed(() => ['AASEditor', 'SMEditor'].includes(route.name as string));
    const isMobile = computed(() => navigationStore.getIsMobile);
    const copyInternalIconAsRef = computed(() => copyInternalIcon);
    const copyIconAsRef = computed(() => copyIcon);
    const copyJsonIconAsRef = computed(() => copyJsonIcon);
    const clipboardElementContentType = computed(() => clipboardStore.getClipboardElementModelType());

    function openTree(smOrSme: any): void {
        if (
            (smOrSme.modelType === 'Submodel' &&
                smOrSme.submodelElements &&
                Array.isArray(smOrSme.submodelElements) &&
                smOrSme.submodelElements.length > 0) ||
            (['SubmodelElementCollection', 'SubmodelElementList'].includes(smOrSme.modelType) &&
                smOrSme.value &&
                Array.isArray(smOrSme.value) &&
                smOrSme.value.length > 0) ||
            (smOrSme.modelType === 'Entity' &&
                smOrSme.statements &&
                Array.isArray(smOrSme.statements) &&
                smOrSme.statements.length > 0) ||
            Object.hasOwn(smOrSme, 'showChildren')
        ) {
            smOrSme.showChildren = true;
        }
    }

    function toggleTree(smOrSme: any): void {
        smOrSme.showChildren = !smOrSme.showChildren;
    }

    function selectSmOrSme(smOrSme: any): void {
        if (isSelected(smOrSme)) {
            // Deselect submodel: remove the path query
            const query = structuredClone(route.query);
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

    function displayNameWithIndex(item: any): string {
        const baseName = nameToDisplay(item);
        // Prepend index for direct children of SubmodelElementList
        if (item?.parent?.modelType === 'SubmodelElementList' && item?.listIndex !== undefined) {
            return `[${item.listIndex}] ${baseName}`;
        }
        return baseName;
    }

    function copyElement(item: any, valueName: string, iconRef: any): void {
        iconRef.value = 'mdi-check';
        clipboardStore.setClipboardContent(item);
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 2000,
            color: 'success',
            btnColor: 'buttonText',
            text:
                (valueName.trim() !== ''
                    ? valueName
                    : typeof item === 'object' && item !== null && 'modelType' in item
                      ? (item as { modelType?: string }).modelType || 'JSON'
                      : 'JSON') + ' copied to Clipboard.',
        });
        setTimeout(() => {
            iconRef.value = 'mdi-clipboard-outline';
        }, 2000);
    }

    function openAddSubmodelElementDialog(item: any, isActive: Ref<boolean>): void {
        isActive.value = false;
        emit('openAddSubmodelElementDialog', item);
    }

    function openJsonInsertDialog(item: any, isActive: Ref<boolean>): void {
        isActive.value = false;
        emit('openJsonInsertDialog', item);
    }

    function openEditDialog(item: any, isActive: Ref<boolean>): void {
        isActive.value = false;
        emit('openEditDialog', item);
    }

    function openSubmodelElementEditDialog(item: any, isActive: Ref<boolean>): void {
        isActive.value = false;
        emit('openEditSubmodelElementDialog', item);
    }

    function openDeleteDialog(item: any, isActive: Ref<boolean>): void {
        isActive.value = false;
        emit('showDeleteDialog', item);
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
