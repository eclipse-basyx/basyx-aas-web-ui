<template>
  <div class="Treeview">
    <v-hover>
      <template #default="{ isHovering, props }">
        <v-lazy transition="fade-transition">
          <v-list-item
            :active="isSelected(item)"
            class="py-0"
            :class="editorMode ? 'pr-0' : ''"
            color="primary"
            density="compact"
            nav
            slim
            :style="{ 'padding-left': depth * 22 + 'px' }"
            v-bind="props"
            @click="
              selectSmOrSme(item);
              openTree(item);
            "
          >
            <v-list-item-title>{{ displayNameWithIndex(item) }}</v-list-item-title>

            <template #prepend>
              <!-- Button to show/hide children -->
              <v-btn
                v-if="item.children"
                class="ml-n1"
                :icon="item.showChildren ? 'mdi-menu-down' : 'mdi-menu-right'"
                :ripple="false"
                size="small"
                variant="plain"
                @click.stop="toggleTree(item)"
              />

              <div v-else style="width: 40px; height: 40px" />
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
                color="primary"
              >
                mdi-folder-pound
              </v-icon>
              <!-- Icon for Submodel with children (open/closed) -->
              <v-icon v-else-if="item.modelType === 'Submodel' && item.children" color="primary">
                {{ item.showChildren ? 'mdi-folder-open' : 'mdi-folder' }}
              </v-icon>
              <!-- Icon for empty SubmodelelementCollection -->
              <v-icon
                v-else-if="item.modelType === 'SubmodelElementCollection' && !item.children"
                color="primary"
              >
                mdi-file-alert
              </v-icon>
              <!-- Icon for SubmodelelementCollection -->
              <v-icon v-else-if="item.modelType === 'SubmodelElementCollection'" color="primary">
                mdi-file-multiple
              </v-icon>
              <!-- Icon for empty SubmodelelementList -->
              <v-icon
                v-else-if="item.modelType === 'SubmodelElementList' && !item.children"
                color="primary"
              >
                mdi-file-alert
              </v-icon>
              <!-- Icon for SubmodelelementList -->
              <v-icon
                v-else-if="item.modelType === 'SubmodelElementList'"
                color="primary"
              >mdi-list-box</v-icon>
              <!-- Icon for empty Entities -->
              <v-icon v-else-if="item.modelType === 'Entity' && !item.children" color="primary">
                mdi-file-alert
              </v-icon>
              <!-- Icon for Entities -->
              <v-icon
                v-else-if="item.modelType === 'Entity'"
                color="primary"
              >mdi-format-list-group</v-icon>
              <!-- Icon for empty AnnotatedRelationshipElement -->
              <v-icon
                v-else-if="item.modelType === 'AnnotatedRelationshipElement' && !item.children"
                color="primary"
              >
                mdi-file-alert
              </v-icon>
              <!-- Icon for AnnotatedRelationshipElement -->
              <v-icon
                v-else-if="item.modelType === 'AnnotatedRelationshipElement'"
                color="primary"
              >mdi-vector-link</v-icon>
              <!-- Icon for every other SubmodelElement (like Property) -->
              <v-icon v-else color="primary">mdi-file-code</v-icon>
            </template>

            <template #append>
              <div class="d-flex align-center" style="position: relative; min-height: 24px">
                <v-chip
                  v-if="item.isDirectOperationVariable"
                  class="mr-1"
                  color="secondary"
                  size="x-small"
                  variant="tonal"
                >{{ operationDirectionLabel(item.operationVariableDirection) }}</v-chip>

                <v-tooltip v-if="item.validationError" location="bottom">
                  <template #activator="{ props: validationProps }">
                    <v-icon
                      v-bind="validationProps"
                      :aria-label="item.validationError"
                      class="mr-1"
                      color="error"
                      role="img"
                      size="small"
                      tabindex="0"
                    >
                      mdi-alert-circle
                    </v-icon>
                  </template>
                  {{ item.validationError }}
                </v-tooltip>

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
                    v-if="editorMode && canElementAddSubmodelElement(item) && item.modelType !== 'Operation'"
                    location="bottom"
                    :open-delay="600"
                    text="Add Submodel Element"
                  >
                    <template #activator="{ props: addSubmodelElementTooltipProps }">
                      <v-btn
                        v-bind="addSubmodelElementTooltipProps"
                        class="ml-1"
                        color="subtitleText"
                        icon="mdi-plus"
                        size="small"
                        :style="{
                          display: isHovering ? 'block' : 'none',
                          transition: '0.2s ease',
                          pointerEvents: isHovering ? 'auto' : 'none',
                        }"
                        variant="plain"
                        @click.stop="$emit('open-add-submodel-element-dialog', item)"
                      />
                    </template>
                  </v-tooltip>

                  <v-menu v-else-if="editorMode && item.modelType === 'Operation'">
                    <template #activator="{ props: operationAddMenuProps }">
                      <v-btn
                        v-bind="operationAddMenuProps"
                        class="ml-1"
                        color="subtitleText"
                        icon="mdi-plus"
                        size="small"
                        :style="{
                          display: isHovering ? 'block' : 'none',
                          pointerEvents: isHovering ? 'auto' : 'none',
                        }"
                        variant="plain"
                        @click.stop
                      />
                    </template>

                    <v-list class="py-0" density="compact">
                      <OperationVariableAddMenu :operation="item" @add="emitOperationVariableAdd" />
                    </v-list>
                  </v-menu>
                  <!-- Button to Copy the Path to the clipboard -->
                  <v-tooltip
                    v-if="!editorMode"
                    location="bottom"
                    :open-delay="600"
                    text="Copy Path to Clipboard"
                  >
                    <template #activator="{ props: copyPathTooltipProps }">
                      <v-btn
                        v-bind="copyPathTooltipProps"
                        class="ml-1"
                        color="subtitleText"
                        :icon="copyIcon"
                        size="small"
                        :style="{
                          display: isHovering ? 'block' : 'none',
                          transition: '0.2s ease',
                          pointerEvents: isHovering ? 'auto' : 'none',
                        }"
                        variant="plain"
                        @click.stop="copyItemEndpoint(item)"
                      />
                    </template>
                  </v-tooltip>
                </div>
              </div>
              <!-- Context menu for Submodels -->
              <v-menu v-if="editorMode && item.modelType === 'Submodel'" :close-on-content-click="false">
                <template #activator="{ props: contextMenuProps }">
                  <v-btn
                    color="subtitleText"
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="plain"
                    v-bind="contextMenuProps"
                  />
                </template>

                <template #default="{ isActive }">
                  <v-sheet border>
                    <v-list class="py-0" dense density="compact" slim>
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

                      <v-divider />
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

                      <v-divider />
                      <!-- Copy SM to internal clipboard -->
                      <v-list-item
                        @click.stop="copyElement(item, 'Submodel', copyInternalIconAsRef)"
                      >
                        <template #prepend>
                          <v-icon size="x-small">{{ copyInternalIcon }} </v-icon>
                        </template>

                        <v-list-item-subtitle>Copy Submodel</v-list-item-subtitle>
                      </v-list-item>
                      <!-- Copy SM Endpoint to clipboard -->
                      <v-list-item
                        @click.stop="copyToClipboard(item.path, 'SM Endpoint', copyIconAsRef)"
                      >
                        <template #prepend>
                          <v-icon size="x-small">{{ copyIcon }} </v-icon>
                        </template>

                        <v-list-item-subtitle>Copy Submodel Endpoint</v-list-item-subtitle>
                      </v-list-item>
                      <!-- Copy SM as JSON -->
                      <v-list-item
                        @click.stop="copyJsonToClipboard(item, 'Submodel', copyJsonIconAsRef)"
                      >
                        <template #prepend>
                          <v-icon size="x-small">{{ copyJsonIcon }} </v-icon>
                        </template>

                        <v-list-item-subtitle>Copy Submodel as JSON</v-list-item-subtitle>
                      </v-list-item>

                      <v-divider />
                      <!-- Paste SubmodelElement from internal clipboard -->
                      <v-list-item
                        :disabled="
                          !clipboardElementContentType ||
                            clipboardElementContentType === 'Submodel'
                        "
                        @click.stop="pasteElement(item)"
                      >
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
                    color="subtitleText"
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="plain"
                    v-bind="contextMenuProps"
                  />
                </template>

                <template #default="{ isActive }">
                  <v-sheet border>
                    <v-list class="py-0" dense density="compact" slim>
                      <!-- Open Add SubmodelElement dialog -->
                      <OperationVariableAddMenu
                        v-if="item.modelType === 'Operation'"
                        :operation="item"
                        @add="payload => openOperationVariableDialog(payload, isActive)"
                      />

                      <v-list-item
                        v-if="
                          item.modelType === 'SubmodelElementCollection' ||
                            item.modelType === 'SubmodelElementList' ||
                            item.modelType === 'Entity' ||
                            item.modelType === 'AnnotatedRelationshipElement'
                        "
                        @click="openAddSubmodelElementDialog(item, isActive)"
                      >
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
                            item.modelType === 'Entity' ||
                            item.modelType === 'AnnotatedRelationshipElement'
                        "
                        @click="openJsonInsertDialog(item, isActive)"
                      >
                        <template #prepend>
                          <v-icon size="x-small">mdi-code-json</v-icon>
                        </template>

                        <v-list-item-subtitle>Submodel Element from JSON</v-list-item-subtitle>
                      </v-list-item>

                      <v-divider
                        v-if="
                          item.modelType === 'SubmodelElementCollection' ||
                            item.modelType === 'SubmodelElementList' ||
                            item.modelType === 'Entity' ||
                            item.modelType === 'AnnotatedRelationshipElement'
                        "
                      />
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

                      <template v-if="item.isDirectOperationVariable">
                        <v-divider />

                        <v-list-item
                          :disabled="item.operationVariableIndex === 0"
                          @click="moveOperationVariable(item, { offset: -1 }, isActive)"
                        >
                          <template #prepend><v-icon size="x-small">mdi-arrow-up</v-icon></template>
                          <v-list-item-subtitle>Move up</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          :disabled="!canMoveOperationVariableDown(item)"
                          @click="moveOperationVariable(item, { offset: 1 }, isActive)"
                        >
                          <template #prepend><v-icon size="x-small">mdi-arrow-down</v-icon></template>
                          <v-list-item-subtitle>Move down</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-subheader>Change direction</v-list-subheader>

                        <v-list-item
                          v-for="direction in operationVariableDirections"
                          :key="direction"
                          :disabled="direction === item.operationVariableDirection"
                          @click="moveOperationVariable(item, { direction }, isActive)"
                        >
                          <template #prepend><v-icon size="x-small">mdi-swap-horizontal</v-icon></template>

                          <v-list-item-subtitle>
                            Move to {{ operationDirectionLongLabel(direction) }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </template>

                      <v-divider />
                      <!-- Copy SME to internal clipboard -->
                      <v-list-item
                        @click="copyElement(item, item.modelType, copyInternalIconAsRef)"
                      >
                        <template #prepend>
                          <v-icon size="x-small">{{ copyInternalIcon }} </v-icon>
                        </template>

                        <v-list-item-subtitle>Copy {{ item.modelType }}</v-list-item-subtitle>
                      </v-list-item>
                      <!-- Copy SME endpoint to clipboard -->
                      <v-list-item @click="copyItemEndpoint(item)">
                        <template #prepend>
                          <v-icon size="x-small">{{ copyIcon }} </v-icon>
                        </template>

                        <v-list-item-subtitle>
                          {{ isOperationOwnedNode(item)
                            ? 'Copy owning Operation endpoint'
                            : `Copy ${item.modelType} Endpoint` }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <!-- Copy SME as JSON -->
                      <v-list-item
                        @click.stop="
                          copyJsonToClipboard(item, item.modelType, copyJsonIconAsRef)
                        "
                      >
                        <template #prepend>
                          <v-icon size="x-small">{{ copyJsonIcon }} </v-icon>
                        </template>

                        <v-list-item-subtitle>Copy {{ item.modelType }} as JSON</v-list-item-subtitle>
                      </v-list-item>

                      <v-divider
                        v-if="
                          item.modelType === 'SubmodelElementCollection' ||
                            item.modelType === 'SubmodelElementList' ||
                            item.modelType === 'Entity' ||
                            item.modelType === 'AnnotatedRelationshipElement'
                        "
                      />
                      <!-- Paste SubmodelElement from internal clipboard -->
                      <v-list-item
                        v-if="
                          item.modelType === 'SubmodelElementCollection' ||
                            item.modelType === 'SubmodelElementList' ||
                            item.modelType === 'Entity' ||
                            item.modelType === 'AnnotatedRelationshipElement'
                        "
                        :disabled="!canPasteElement(item)"
                        @click="pasteItem(item)"
                      >
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

              <template v-else-if="editorMode" />
            </template>
          </v-list-item>
        </v-lazy>
      </template>
    </v-hover>
    <!-- Recursive Treeview -->
    <template v-if="item.showChildren">
      <Treeview
        v-for="innerItem in item.children"
        :key="innerItem.selectionKey || innerItem.id || innerItem.path"
        :depth="depth + 1"
        :item="innerItem"
        @move-operation-variable="$emit('move-operation-variable', $event)"
        @open-add-operation-variable-dialog="$emit('open-add-operation-variable-dialog', $event)"
        @open-add-submodel-element-dialog="$emit('open-add-submodel-element-dialog', $event)"
        @open-edit-submodel-element-dialog="$emit('open-edit-submodel-element-dialog', $event)"
        @open-json-insert-dialog="$emit('open-json-insert-dialog', $event)"
        @paste-operation-owned-element="$emit('paste-operation-owned-element', $event)"
        @show-delete-dialog="$emit('show-delete-dialog', $event)"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
  import type { Ref } from 'vue'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { useAASStore } from '@/store/AASDataStore'
  import { useClipboardStore } from '@/store/ClipboardStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { operationVariableDirections } from '@/types/OperationTree'
  import { isOperationOwnedNode } from '@/utils/AAS/OperationTreeUtils'
  import { isChildTypeAllowed } from '@/utils/AAS/SubmodelElementRegistry'

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Composables
  const { nameToDisplay } = useReferableUtils()
  const { copyToClipboard, copyJsonToClipboard, pasteElement } = useClipboardUtil()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const clipboardStore = useClipboardStore()

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
  })

  // Emits
  const emit = defineEmits<{
    'open-edit-dialog': [item: any]
    'show-delete-dialog': [item: any]
    'open-add-submodel-element-dialog': [item: any]
    'open-add-operation-variable-dialog': [payload: any]
    'open-json-insert-dialog': [item: any]
    'open-edit-submodel-element-dialog': [item: any]
    'move-operation-variable': [payload: any]
    'paste-operation-owned-element': [item: any]
  }>()

  // Data
  const copyInternalIcon = ref<string>('mdi-clipboard-outline')
  const copyIcon = ref<string>('mdi-clipboard-file-outline')
  const copyJsonIcon = ref<string>('mdi-clipboard-text-outline')
  const pasteIcon = ref<string>('mdi-file-document-multiple-outline')

  // Computed Properties
  const selectedNode = computed(() => aasStore.getSelectedNode)
  const editorMode = computed(() => ['AASEditor', 'SMEditor'].includes(route.name as string))
  const isMobile = computed(() => navigationStore.getIsMobile)
  const copyInternalIconAsRef = computed(() => copyInternalIcon)
  const copyIconAsRef = computed(() => copyIcon)
  const copyJsonIconAsRef = computed(() => copyJsonIcon)
  const clipboardElementContentType = computed(() => clipboardStore.getClipboardElementModelType())

  function openTree (smOrSme: any): void {
    if (
      (smOrSme.modelType === 'Submodel'
        && smOrSme.submodelElements
        && Array.isArray(smOrSme.submodelElements)
        && smOrSme.submodelElements.length > 0)
      || (['SubmodelElementCollection', 'SubmodelElementList'].includes(smOrSme.modelType)
        && smOrSme.value
        && Array.isArray(smOrSme.value)
        && smOrSme.value.length > 0)
      || (smOrSme.modelType === 'AnnotatedRelationshipElement'
        && smOrSme.annotations
        && Array.isArray(smOrSme.annotations)
        && smOrSme.annotations.length > 0)
      || (smOrSme.modelType === 'Entity'
        && smOrSme.statements
        && Array.isArray(smOrSme.statements)
        && smOrSme.statements.length > 0)
      || Object.hasOwn(smOrSme, 'showChildren')
    ) {
      smOrSme.showChildren = true
    }
  }

  function toggleTree (smOrSme: any): void {
    smOrSme.showChildren = !smOrSme.showChildren
  }

  function selectSmOrSme (smOrSme: any): void {
    if (isSelected(smOrSme)) {
      // Deselect submodel: remove the path query
      const query = structuredClone(route.query)
      delete query.path
      delete query.fragment
      router.push({ query: query })
    } else {
      // Select submodel/submodel element: add smePath to path query
      const query = { ...route.query }
      if (isOperationOwnedNode(smOrSme)) {
        query.path = smOrSme.persistence.operationPath
        query.fragment = smOrSme.persistence.fragment
      } else {
        query.path = smOrSme.path
        delete query.fragment
      }
      if (isMobile.value) {
        // Go to Visualization
        router.push({
          name: 'Visualization',
          query: query,
        })
      } else {
        router.push({
          query: query,
        })
      }
    }
  }

  function isSelected (smOrSme: any): boolean {
    if (
      !selectedNode.value
      || Object.keys(selectedNode.value).length === 0
      || !selectedNode.value.path
      || !smOrSme
      || Object.keys(smOrSme).length === 0
      || !smOrSme.path
    ) {
      return false
    }
    const selectedKey = selectedNode.value.selectionKey || selectedNode.value.path
    const itemKey = smOrSme.selectionKey || smOrSme.path
    return selectedKey === itemKey
  }

  function canElementAddSubmodelElement (item: any): boolean {
    return [
      'Submodel',
      'SubmodelElementCollection',
      'SubmodelElementList',
      'Entity',
      'AnnotatedRelationshipElement',
      'Operation',
    ].includes(item.modelType)
  }

  function canPasteElement (item: any): boolean {
    if (!clipboardElementContentType.value || clipboardElementContentType.value === 'Submodel') {
      return false
    }

    return isChildTypeAllowed(item, clipboardElementContentType.value)
  }

  function displayNameWithIndex (item: any): string {
    const baseName = nameToDisplay(item) || item?.modelType || 'SubmodelElement'
    if (item?.isDirectOperationVariable && item?.operationVariableIndex !== undefined) {
      return `[${item.operationVariableIndex}] ${baseName}`
    }
    // Prepend index for direct children of SubmodelElementList
    if (item?.parent?.modelType === 'SubmodelElementList' && item?.listIndex !== undefined) {
      return `[${item.listIndex}] ${baseName}`
    }
    return baseName
  }

  function copyElement (item: any, valueName: string, iconRef: any): void {
    iconRef.value = 'mdi-check'
    clipboardStore.setClipboardContent(item)
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 2000,
      color: 'success',
      btnColor: 'buttonText',
      text:
        (valueName.trim() === ''
          ? (typeof item === 'object' && item !== null && 'modelType' in item
            ? (item as { modelType?: string }).modelType || 'JSON'
            : 'JSON')
          : valueName) + ' copied to Clipboard.',
    })
    setTimeout(() => {
      iconRef.value = 'mdi-clipboard-outline'
    }, 2000)
  }

  function openAddSubmodelElementDialog (item: any, isActive: Ref<boolean>): void {
    isActive.value = false
    emit('open-add-submodel-element-dialog', item)
  }

  function emitOperationVariableAdd (payload: any): void {
    emit('open-add-operation-variable-dialog', payload)
  }

  function openOperationVariableDialog (payload: any, isActive: Ref<boolean>): void {
    isActive.value = false
    emitOperationVariableAdd(payload)
  }

  function operationDirectionLabel (direction: string): string {
    if (direction === 'inputVariables') return 'IN'
    if (direction === 'inoutputVariables') return 'IN/OUT'
    return 'OUT'
  }

  function operationDirectionLongLabel (direction: string): string {
    if (direction === 'inputVariables') return 'Input'
    if (direction === 'inoutputVariables') return 'In/Out'
    return 'Output'
  }

  function canMoveOperationVariableDown (item: any): boolean {
    const variables = item?.parent?.[item.operationVariableDirection]
    return Array.isArray(variables) && item.operationVariableIndex < variables.length - 1
  }

  function moveOperationVariable (
    item: any,
    change: { direction?: string, offset?: number },
    isActive: Ref<boolean>,
  ): void {
    isActive.value = false
    emit('move-operation-variable', { item, ...change })
  }

  function copyItemEndpoint (item: any): void {
    const endpoint = isOperationOwnedNode(item) ? item.persistence.operationPath : item.path
    const label = isOperationOwnedNode(item) ? 'Owning Operation endpoint' : 'Path'
    copyToClipboard(endpoint, label, copyIconAsRef.value)
  }

  function pasteItem (item: any): void {
    if (isOperationOwnedNode(item)) {
      emit('paste-operation-owned-element', item)
      return
    }
    pasteElement(item)
  }

  function openJsonInsertDialog (item: any, isActive: Ref<boolean>): void {
    isActive.value = false
    emit('open-json-insert-dialog', item)
  }

  function openEditDialog (item: any, isActive: Ref<boolean>): void {
    isActive.value = false
    emit('open-edit-dialog', item)
  }

  function openSubmodelElementEditDialog (item: any, isActive: Ref<boolean>): void {
    isActive.value = false
    emit('open-edit-submodel-element-dialog', item)
  }

  function openDeleteDialog (item: any, isActive: Ref<boolean>): void {
    isActive.value = false
    emit('show-delete-dialog', item)
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
