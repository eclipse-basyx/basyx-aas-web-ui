<template>
  <v-container class="pa-0" fluid>
    <!-- Main Content -->
    <v-container class="pa-0" fluid>
      <v-card>
        <!-- Toolbar -->
        <FileSystemToolbar
          v-model:selected-view="selectedView"
          :has-selection="selection.hasSelection.value"
          :selected-count="selection.selectionCount.value"
          @create-folder="operations.createFolder"
          @delete-selected="confirmDeleteSelected"
          @deselect-all="selection.clearSelection"
          @open-upload-dialog="uploadDialog = true"
        />

        <v-divider />

        <!-- Card Content -->
        <v-card-text
          class="overflow-y-auto"
          :class="{ 'external-drop-zone-active': dragDrop.isExternalDragOver.value }"
          style="height: 600px; position: relative"
          @dragleave="dragDrop.handleExternalDragLeave"
          @dragover.prevent="dragDrop.handleExternalDragOver"
          @drop.prevent="dragDrop.handleExternalDrop"
        >
          <!-- External Drop Zone Overlay -->
          <v-overlay
            class="align-center justify-center"
            contained
            :model-value="dragDrop.isExternalDragOver.value"
            :opacity="0.1"
            scrim="primary"
          >
            <v-sheet class="pa-5" color="primary" rounded="lg">
              <v-empty-state icon="mdi-upload" title="Drop files here to upload" />
            </v-sheet>
          </v-overlay>

          <!-- Upload Progress Overlay -->
          <v-overlay
            class="align-center justify-center"
            contained
            :model-value="operations.isUploading.value"
            persistent
          >
            <ProgressOverlay :progress="operations.uploadProgress.value" title="Files are being uploaded" />
          </v-overlay>

          <!-- Moving Progress Overlay -->
          <v-overlay
            class="align-center justify-center"
            contained
            :model-value="operations.isMoving.value"
            persistent
          >
            <ProgressOverlay :progress="operations.moveProgress.value" title="Items are being moved" />
          </v-overlay>

          <!-- Breadcrumbs -->
          <FileSystemBreadcrumbs
            :breadcrumbs="breadCrumbs"
            :can-go-up="operations.isOnASubpath()"
            @go-up="goUp"
          />

          <!-- Grid View -->
          <FileGridView
            v-if="selectedView === 0"
            :allow-startscreen="allowStartscreen"
            :drag-over-folder="dragDrop.dragOverFolder.value"
            :file-objects="operations.fileObjects.value"
            :file-urls="operations.fileUrls.value"
            :get-folder-name="operations.getFolderName"
            :get-preview-state="operations.getPreviewState"
            :is-item-selected="selection.isItemSelected"
            @change-startscreen="handleChangeStartscreen"
            @create-folder="operations.createFolder"
            @delete="confirmDeleteElement"
            @download="downloadFile"
            @dragend="dragDrop.handleDragEnd"
            @dragleave="dragDrop.handleDragLeave"
            @dragover="dragDrop.handleDragOver"
            @dragstart="dragDrop.handleDragStart"
            @drop="dragDrop.handleDrop"
            @edit-folder="editFolderName"
            @folder-click="handleFolderClick"
            @navigate-up="navigateOneUp"
            @open-upload-dialog="uploadDialog = true"
            @preview="previewFile"
            @toggle-selection="selection.toggleItemSelection"
          />

          <!-- List View -->
          <FileListView
            v-else
            :drag-over-folder="dragDrop.dragOverFolder.value"
            :file-objects="operations.fileObjects.value"
            :get-folder-element-count="operations.getFolderElementCount"
            :get-folder-name="operations.getFolderName"
            :has-selection="selection.hasSelection.value"
            :headers="tableHeaders"
            :is-all-selected="selection.isAllSelected.value"
            :is-item-selected="selection.isItemSelected"
            :is-on-subpath="operations.isOnASubpath()"
            :is-some-selected="selection.isSomeSelected.value"
            @delete="confirmDeleteElement"
            @download="downloadFile"
            @dragend="dragDrop.handleDragEnd"
            @dragleave="dragDrop.handleDragLeave"
            @dragover="dragDrop.handleDragOver"
            @dragstart="dragDrop.handleDragStart"
            @drop="dragDrop.handleDrop"
            @edit-folder="editFolderName"
            @move-up="operations.moveElementUp"
            @navigate-up="navigateOneUp"
            @row-click="handleRowClick"
            @toggle-select-all="selection.toggleSelectAll"
            @toggle-selection="selection.toggleItemSelection"
          />
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Dialogs -->
    <UploadDialog
      v-model="uploadDialog"
      :accepted-files="acceptedFiles"
      :loading="operations.loading.value"
      @upload="handleUpload"
    />

    <FolderNamingDialog v-model="folderNamingDialog" :folder="editingFolder" @save="handleSaveFolderName" />

    <DeleteConfirmDialog
      v-model="deleteElementDialog"
      :elements-to-delete="elementsToDelete"
      :get-folder-name="operations.getFolderName"
      @confirm-delete="handleConfirmDelete"
    />

    <PreviewDialog
      :file-submodel="submodelElementData"
      :preview-dialog="previewDialog"
      :preview-file="previewElement"
      @update:preview-dialog="previewDialog = $event"
    />
  </v-container>
</template>

<script setup lang="ts">
  import type { BreadcrumbItem, FileElement, FileSystemElement, FolderElement, TableHeader } from './types'
  import { nextTick, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { mimeToExtension } from '@/utils/FileHandling'
  import { useDragAndDrop, useFileSystemOperations, useSelection } from './composables'

  // Options
  defineOptions({
    name: 'FileSystem',
    semanticId: 'https://basyx.org/FileSystem/FileSystem/0/1',
  })

  // Props
  interface Props {
    defaultView?: number
    submodelElementData: {
      id?: string
      path: string
      submodelElements?: FileSystemElement[]
    }
    acceptedFiles?: string
    allowStartscreen?: boolean
    title?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    defaultView: 0,
    acceptedFiles: undefined,
    allowStartscreen: false,
    title: 'File Explorer',
  })

  // Router
  const route = useRoute()
  const router = useRouter()

  // Store
  const navigationStore = useNavigationStore()

  // Constants
  const FILE_SYSTEM_SEMANTIC_ID = 'https://basyx.org/FileSystem/FileSystem/0/1'

  // Register filePath as an allowed query param for this plugin
  // This is done immediately (not in onMounted) so that the router can check it
  // before the component mounts when navigating TO the FileSystem submodel
  navigationStore.registerQueryParam('filePath', FILE_SYSTEM_SEMANTIC_ID)

  // Composables
  const operations = useFileSystemOperations(() => props.submodelElementData)
  const selection = useSelection({ fileObjects: operations.fileObjects })
  const dragDrop = useDragAndDrop({
    selectedItems: selection.selectedItems,
    acceptedFiles: props.acceptedFiles,
    onMoveItems: handleMoveItems,
    onExternalFileDrop: handleExternalFileDrop,
    isItemSelected: selection.isItemSelected,
  })

  // Local State
  const selectedView = ref(0)
  const uploadDialog = ref(false)
  const folderNamingDialog = ref(false)
  const deleteElementDialog = ref(false)
  const previewDialog = ref(false)
  const editingFolder = ref<FolderElement | null>(null)
  const previewElement = ref<FileElement | null>(null)
  const elementsToDelete = ref<FileSystemElement[]>([])
  const breadCrumbs = ref<BreadcrumbItem[]>([])

  // Table headers
  const tableHeaders: TableHeader[] = [
    { title: '', key: 'selection', sortable: false, width: '50px' },
    { title: 'Name', key: 'idShort' },
    { title: 'Type', key: 'contentType' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '200px' },
  ]

  // Navigation Methods
  function goUp (): void {
    const filePath = route.query.filePath || ''
    if (filePath) {
      const splitted = filePath.toString().split('.')
      splitted.pop()
      const newFilePath = splitted.join('.')
      if (newFilePath) {
        router.push({ query: { ...route.query, filePath: newFilePath } })
      } else {
        // Remove filePath param when navigating to root
        const query = { ...route.query }
        delete query.filePath
        router.push({ query })
      }
    }
  }

  function navigateOneUp (): void {
    goUp()
  }

  function handleFolderClick (element: FileSystemElement): void {
    const currentFilePath = route.query.filePath || ''
    const newFilePath = currentFilePath ? `${currentFilePath}.${element.idShort}` : element.idShort
    router.push({ query: { ...route.query, filePath: newFilePath } })
  }

  function handleRowClick (item: FileSystemElement): void {
    if (item.modelType === 'File') {
      previewFile(item)
    } else if (item.modelType === 'SubmodelElementCollection') {
      handleFolderClick(item)
    }
  }

  // File Operations
  async function handleUpload (files: File[]): Promise<void> {
    await operations.uploadFiles(files)
    uploadDialog.value = false
    navigationStore.dispatchTriggerTreeviewReload()
  }

  async function handleExternalFileDrop (files: File[]): Promise<void> {
    await operations.uploadFiles(files)
    navigationStore.dispatchTriggerTreeviewReload()
  }

  async function handleMoveItems (items: FileSystemElement[], targetFolder: FileSystemElement): Promise<void> {
    await operations.moveItems(items, targetFolder)
    selection.clearSelection()
    navigationStore.dispatchTriggerTreeviewReload()
  }

  function handleChangeStartscreen (state: boolean, file: FileSystemElement): void {
    operations.changeStartscreenState(state, file as FileElement)
  }

  function downloadFile (element: FileSystemElement): void {
    const fileElement = element as FileElement
    const url = operations.fileUrls.value[fileElement.idShort]
    if (!url) return

    const extension = mimeToExtension(fileElement.contentType)
    const fileName = `${fileElement.idShort}.${extension}`

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.append(link)
    link.click()
    link.remove()
  }

  // Preview
  function previewFile (element: FileSystemElement): void {
    previewDialog.value = true
    previewElement.value = element as FileElement
  }

  // Folder Editing
  function editFolderName (element: FileSystemElement): void {
    editingFolder.value = element as FolderElement
    folderNamingDialog.value = true
  }

  async function handleSaveFolderName (newName: string): Promise<void> {
    if (editingFolder.value) {
      await operations.saveFolderName(editingFolder.value, newName)
      folderNamingDialog.value = false
      editingFolder.value = null
      navigationStore.dispatchTriggerTreeviewReload()
    }
  }

  // Delete Operations
  function confirmDeleteElement (element: FileSystemElement): void {
    elementsToDelete.value = [element]
    deleteElementDialog.value = true
  }

  function confirmDeleteSelected (): void {
    elementsToDelete.value = [...selection.selectedItems.value]
    deleteElementDialog.value = true
  }

  async function handleConfirmDelete (): Promise<void> {
    await (elementsToDelete.value.length === 1 ? operations.deleteElement(elementsToDelete.value[0]) : operations.deleteElements(elementsToDelete.value))
    selection.clearSelection()
    elementsToDelete.value = []
    navigationStore.dispatchTriggerTreeviewReload()
  }

  // Breadcrumbs
  async function setBreadcrumbItems (): Promise<void> {
    const filePath = route.query.filePath || ''
    breadCrumbs.value = []

    // For root breadcrumb, remove filePath from query instead of setting it to empty
    // Convert LocationQuery to Record<string, string> for type compatibility
    const rootQuery: Record<string, string> = {}
    for (const [key, value] of Object.entries(route.query)) {
      if (key !== 'filePath' && typeof value === 'string') {
        rootQuery[key] = value
      }
    }

    breadCrumbs.value.push({
      title: props.title ?? 'Root',
      disabled: !filePath,
      to: { query: rootQuery },
      index: 0,
    })

    const splitted = filePath.toString().split('.')
    if (splitted.length === 1 && splitted[0] === '') {
      return
    }

    for (let index = 0; index < splitted.length; index++) {
      const path = splitted.slice(0, index + 1).join('.')
      const fullPathForCurrentElement = splitted.slice(0, index + 1).join('.')
      const displayName = await operations.getDisplayNameByPath(fullPathForCurrentElement)

      breadCrumbs.value.push({
        title: displayName,
        disabled: path === filePath,
        to: { query: { ...route.query, filePath: path } },
        index: index + 1,
      })
    }

    breadCrumbs.value.sort((a, b) => a.index - b.index)
  }

  // Watchers
  watch(
    () => route.query.filePath,
    newFilePath => {
      operations.fetchFiles(newFilePath as string)
    },
  )

  watch(operations.fileObjects, () => {
    setBreadcrumbItems()
  })

  watch(selectedView, newView => {
    localStorage.setItem('fileSystemViewMode', String(newView))
  })

  // Lifecycle
  onMounted(() => {
    // Load view preference from local storage, fall back to defaultView
    const savedView = localStorage.getItem('fileSystemViewMode')
    selectedView.value = savedView === null ? props.defaultView : Number.parseInt(savedView, 10)

    nextTick(() => {
      const filePath = route.query.filePath || ''
      operations.fetchFiles(filePath as string)
    })
  })
</script>

<style scoped>
    .external-drop-zone-active {
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }
</style>
