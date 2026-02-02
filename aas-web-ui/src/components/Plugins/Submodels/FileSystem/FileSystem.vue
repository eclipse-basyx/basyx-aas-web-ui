<template>
    <v-container class="pa-0" fluid>
        <div
            v-if="selectedItems.length > 0"
            style="position: absolute; width: 100%; bottom: 0; z-index: 999; display: flex; justify-content: center">
            <v-card color="error" :width="300" class="mb-4 pa-0" flat>
                <v-card-text class="pa-0">
                    <v-list-item>
                        <span class="font-weight-bold">Selected Objects: {{ selectedItems.length }}</span>
                        <template #append>
                            <!-- Delete selected button -->
                            <v-btn
                                v-if="selectedItems.length > 0"
                                icon="mdi-delete"
                                variant="text"
                                class="mr-3"
                                @click="confirmDeleteSelected">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </template>
                    </v-list-item>
                </v-card-text>
            </v-card>
        </div>
        <!-- Grid view of files -->
        <v-container class="pa-0" fluid>
            <v-card>
                <v-toolbar color="cardHeader">
                    <v-toolbar-title>{{ selectedView === 0 ? 'Gallery' : 'File Explorer' }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <!-- Switch between list and grid view -->
                    <v-btn-toggle
                        v-model="selectedView"
                        border
                        density="compact"
                        divided
                        rounded="lg"
                        class="mr-3"
                        mandatory>
                        <v-btn icon="mdi-view-grid" class="px-5"></v-btn>
                        <v-btn icon="mdi-view-list" class="px-5"></v-btn>
                    </v-btn-toggle>
                    <!-- Upload dialog for new files -->
                    <v-dialog v-model="uploadDialog" :width="600">
                        <template #default="{ isActive }">
                            <v-card>
                                <v-card-title>Upload Images/Videos</v-card-title>
                                <v-divider></v-divider>
                                <v-progress-linear v-if="loading" color="primary" indeterminate></v-progress-linear>
                                <v-card-text>
                                    <v-file-input
                                        v-model="files"
                                        label="Select Files"
                                        :accept="acceptedFiles"
                                        variant="outlined"
                                        prepend-icon=""
                                        prepend-inner-icon="$file"
                                        multiple></v-file-input>
                                </v-card-text>
                                <v-divider></v-divider>
                                <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn text="Cancel" @click="isActive.value = false"></v-btn>
                                    <v-btn color="primary" variant="flat" @click="uploadFiles()">Upload</v-btn>
                                </v-card-actions>
                            </v-card>
                        </template>
                    </v-dialog>
                    <!-- Menu for Creating/Renaming Folders -->
                    <v-dialog v-model="folderNamingDialog" :width="600">
                        <template #default="{ isActive }">
                            <v-card>
                                <v-card-title>Name Folder</v-card-title>
                                <v-divider></v-divider>
                                <v-card-text>
                                    <v-text-field
                                        v-model="editingFolderName"
                                        density="compact"
                                        variant="outlined"
                                        label="Folder Name"></v-text-field>
                                </v-card-text>
                                <v-divider></v-divider>
                                <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn text="Cancel" @click="isActive.value = false"></v-btn>
                                    <v-btn
                                        color="primary"
                                        variant="flat"
                                        @click="
                                            isActive.value = false;
                                            saveFolderName();
                                        "
                                        >Save</v-btn
                                    >
                                </v-card-actions>
                            </v-card>
                        </template>
                    </v-dialog>
                    <v-dialog v-model="deleteElementDialog" persistent :width="600">
                        <template #default="{ isActive }">
                            <v-card>
                                <v-card-title v-if="Array.isArray(elementToDelete)">
                                    Are you sure you want to delete <b>{{ elementToDelete.length }}</b> items?
                                </v-card-title>
                                <v-card-title v-else>
                                    {{ elementToDelete.modelType === 'SubmodelElementCollection' ? 'Folder' : 'File' }}
                                    <b>
                                        {{
                                            elementToDelete.modelType === 'SubmodelElementCollection'
                                                ? `${getFolderName(elementToDelete)}`
                                                : `${elementToDelete.idShort}`
                                        }}
                                    </b>
                                    really delete?
                                </v-card-title>
                                <v-divider></v-divider>
                                <v-card-text v-if="Array.isArray(elementToDelete)">
                                    <div class="mb-2">The following items will be permanently deleted:</div>
                                    <v-list density="compact" class="pa-0" style="max-height: 200px; overflow-y: auto">
                                        <v-list-item v-for="item in elementToDelete" :key="item.idShort" class="px-0">
                                            <template #prepend>
                                                <v-icon
                                                    v-if="item.modelType === 'SubmodelElementCollection'"
                                                    color="yellow-darken-2"
                                                    size="small"
                                                    >mdi-folder</v-icon
                                                >
                                                <v-icon
                                                    v-else-if="item.contentType === 'application/pdf'"
                                                    color="red"
                                                    size="small"
                                                    >mdi-file-pdf-box</v-icon
                                                >
                                                <v-icon
                                                    v-else-if="checkContentType(item.contentType) === 'image'"
                                                    color="blue-darken-2"
                                                    size="small"
                                                    >mdi-image</v-icon
                                                >
                                                <v-icon
                                                    v-else-if="checkContentType(item.contentType) === 'video'"
                                                    color="orange-darken-1"
                                                    size="small"
                                                    >mdi-video</v-icon
                                                >
                                                <v-icon v-else color="grey" size="small">mdi-file</v-icon>
                                            </template>
                                            <v-list-item-title class="text-body-2">
                                                {{
                                                    item.modelType === 'SubmodelElementCollection'
                                                        ? getFolderName(item)
                                                        : item.idShort
                                                }}
                                            </v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-card-text>
                                <v-card-text v-else-if="elementToDelete.modelType === 'SubmodelElementCollection'">
                                    When deleting the folder, <b>all</b> subfolders and files will be permanently
                                    deleted.
                                </v-card-text>
                                <v-card-text v-else>The file will be permanently deleted.</v-card-text>
                                <v-divider></v-divider>
                                <v-card-actions>
                                    <v-btn text="Cancel" @click="isActive.value = false"></v-btn>
                                    <v-spacer></v-spacer>
                                    <v-btn
                                        color="error"
                                        variant="flat"
                                        @click="
                                            isActive.value = false;
                                            Array.isArray(elementToDelete)
                                                ? deleteSelectedElements()
                                                : deleteElement(elementToDelete);
                                        "
                                        >Delete
                                    </v-btn>
                                </v-card-actions>
                            </v-card>
                        </template>
                    </v-dialog>
                    <v-menu>
                        <template #activator="{ props: newFileOrFolderProps }">
                            <v-btn
                                prepend-icon="mdi-plus"
                                text="New"
                                variant="flat"
                                color="primary"
                                class="mr-3 text-buttonText"
                                rounded="lg"
                                v-bind="newFileOrFolderProps" />
                        </template>
                        <v-list>
                            <v-list-item @click="uploadDialog = true">
                                <v-list-item-title>
                                    <v-icon>mdi-file</v-icon>
                                    File
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="createFolder">
                                <v-list-item-title>
                                    <v-icon>mdi-folder</v-icon>
                                    Folder
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-toolbar>
                <v-divider></v-divider>
                <v-card-text
                    style="height: 600px"
                    class="overflow-y-auto"
                    :class="{ 'external-drop-zone-active': isExternalDragOver }"
                    @dragover.prevent="handleExternalDragOver"
                    @dragleave="handleExternalDragLeave"
                    @drop.prevent="handleExternalDrop">
                    <!-- Upload Progress Overlay -->
                    <v-overlay :model-value="isUploading" contained persistent class="align-center justify-center">
                        <v-card class="pa-6" min-width="350">
                            <v-card-title class="text-center">Files are being uploaded</v-card-title>
                            <v-card-text>
                                <div class="text-center mb-2">
                                    <span class="text-h5">{{ uploadProgress.current }}</span>
                                    <span class="text-body-1"> / {{ uploadProgress.total }}</span>
                                </div>
                                <v-progress-linear
                                    :model-value="(uploadProgress.current / uploadProgress.total) * 100"
                                    color="primary"
                                    height="20"
                                    rounded>
                                    <template #default>
                                        <strong
                                            >{{
                                                Math.round((uploadProgress.current / uploadProgress.total) * 100)
                                            }}%</strong
                                        >
                                    </template>
                                </v-progress-linear>
                                <div
                                    class="text-caption text-center mt-2 text-truncate"
                                    :title="uploadProgress.fileName">
                                    {{ uploadProgress.fileName }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-overlay>
                    <!-- Moving Progress Overlay -->
                    <v-overlay :model-value="isMoving" contained persistent class="align-center justify-center">
                        <v-card class="pa-6" min-width="350">
                            <v-card-title class="text-center">Items are being moved</v-card-title>
                            <v-card-text>
                                <div class="text-center mb-2">
                                    <span class="text-h5">{{ moveProgress.current }}</span>
                                    <span class="text-body-1"> / {{ moveProgress.total }}</span>
                                </div>
                                <v-progress-linear
                                    :model-value="(moveProgress.current / moveProgress.total) * 100"
                                    color="primary"
                                    height="20"
                                    rounded>
                                    <template #default>
                                        <strong
                                            >{{
                                                Math.round((moveProgress.current / moveProgress.total) * 100)
                                            }}%</strong
                                        >
                                    </template>
                                </v-progress-linear>
                                <div class="text-caption text-center mt-2 text-truncate" :title="moveProgress.itemName">
                                    {{ moveProgress.itemName }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-overlay>
                    <!-- File Path Breadcrumbs divided by a dot -->
                    <v-list-item border rounded="lg" class="pa-0 mb-2">
                        <template #prepend>
                            <v-btn
                                :disabled="!$route.query.filePath"
                                icon="mdi-chevron-up"
                                density="compact"
                                class="ma-2"
                                @click="goUp"></v-btn>
                            <v-divider vertical></v-divider>
                        </template>
                        <v-breadcrumbs divider="/" :items="breadCrumbs" class="ma-0 pa-0 ml-2"></v-breadcrumbs>
                    </v-list-item>
                    <!-- Grid view -->
                    <div v-if="selectedView === 0">
                        <v-row class="mt-2">
                            <v-col
                                v-for="submodelElement in fileObjects.filter(
                                    (element) =>
                                        element.modelType === 'SubmodelElementCollection' ||
                                        element.modelType === 'NavigationElement'
                                )"
                                :key="submodelElement.idShort"
                                cols="12"
                                xl="2"
                                lg="3"
                                md="4"
                                sm="6">
                                <v-lazy v-if="submodelElement.modelType === 'NavigationElement'">
                                    <v-card
                                        :class="{ 'drop-zone-active': dragOverFolder === submodelElement.idShort }"
                                        rounded="lg"
                                        border
                                        flat
                                        @dragover.prevent="handleDragOver($event, submodelElement)"
                                        @dragleave="handleDragLeave($event, submodelElement)"
                                        @drop="handleDrop($event, submodelElement)">
                                        <v-toolbar
                                            density="compact"
                                            color="transparent"
                                            :title="getFolderName(submodelElement)"
                                            class="cursor-pointer"
                                            @click="navigateOneUp()">
                                        </v-toolbar>
                                    </v-card>
                                </v-lazy>
                                <v-lazy v-else-if="submodelElement.modelType === 'SubmodelElementCollection'">
                                    <v-card
                                        class="mx-auto draggable-item"
                                        :class="{
                                            'drop-zone-active': dragOverFolder === submodelElement.idShort,
                                            'selected-item': isItemSelected(submodelElement),
                                        }"
                                        rounded="lg"
                                        border
                                        flat
                                        :draggable="true"
                                        @dragstart="handleDragStart($event, submodelElement)"
                                        @dragend="handleDragEnd"
                                        @dragover.prevent="handleDragOver($event, submodelElement)"
                                        @dragleave="handleDragLeave($event, submodelElement)"
                                        @drop="handleDrop($event, submodelElement)">
                                        <v-toolbar
                                            density="compact"
                                            color="transparent"
                                            class="cursor-pointer"
                                            @click="handleFileExplorerClickFromGalery(submodelElement)">
                                            <v-toolbar-title class="text-truncate text-subtitle-2 ml-2">{{
                                                getFolderName(submodelElement)
                                            }}</v-toolbar-title>
                                            <template #prepend>
                                                <v-checkbox-btn
                                                    :model-value="isItemSelected(submodelElement)"
                                                    density="compact"
                                                    class="ml-1"
                                                    @update:model-value="toggleItemSelection(submodelElement)"
                                                    @click.stop>
                                                </v-checkbox-btn>
                                            </template>
                                            <template #append>
                                                <!-- Actions for handling files -->
                                                <v-btn icon variant="text" size="x-small">
                                                    <v-icon icon="mdi-dots-vertical" />
                                                    <v-menu
                                                        activator="parent"
                                                        location="top end"
                                                        origin="overlap"
                                                        :close-on-content-click="false">
                                                        <v-list slim>
                                                            <v-list-subheader>Actions</v-list-subheader>
                                                            <v-list-item
                                                                link
                                                                title="Delete"
                                                                @click="
                                                                    elementToDelete = submodelElement;
                                                                    deleteElementDialog = true;
                                                                " />
                                                        </v-list>
                                                    </v-menu>
                                                </v-btn>
                                            </template>
                                        </v-toolbar>
                                    </v-card>
                                </v-lazy>
                            </v-col>
                        </v-row>
                        <v-row class="mt-2">
                            <v-col
                                v-for="submodelElement in fileObjects.filter((element) => element.modelType === 'File')"
                                :key="submodelElement.idShort"
                                cols="12"
                                xl="2"
                                lg="3"
                                md="4"
                                sm="6">
                                <v-lazy>
                                    <v-card
                                        class="mx-auto draggable-item"
                                        :class="{ 'selected-item': isItemSelected(submodelElement) }"
                                        border
                                        flat
                                        rounded="lg"
                                        :draggable="true"
                                        @dragstart="handleDragStart($event, submodelElement)"
                                        @dragend="handleDragEnd">
                                        <v-toolbar
                                            density="compact"
                                            color="transparent"
                                            class="cursor-pointer"
                                            @click="previewFile(submodelElement)">
                                            <v-toolbar-title class="text-truncate text-subtitle-2 ml-2">{{
                                                fullFileName(submodelElement)
                                            }}</v-toolbar-title>
                                            <template #prepend>
                                                <v-checkbox-btn
                                                    :model-value="isItemSelected(submodelElement)"
                                                    class="ml-1"
                                                    density="compact"
                                                    @update:model-value="toggleItemSelection(submodelElement)"
                                                    @click.stop>
                                                </v-checkbox-btn>
                                            </template>
                                            <template #append>
                                                <!-- Actions for handling files -->
                                                <v-btn icon variant="text" size="x-small">
                                                    <v-icon icon="mdi-dots-vertical" />
                                                    <v-menu
                                                        activator="parent"
                                                        location="top end"
                                                        origin="overlap"
                                                        :close-on-content-click="false">
                                                        <v-list slim>
                                                            <v-list-subheader>Aktionen</v-list-subheader>

                                                            <v-list-item
                                                                link
                                                                title="Herunterladen"
                                                                @click="
                                                                    downloadFile(
                                                                        fileUrls[submodelElement.idShort],
                                                                        submodelElement
                                                                    )
                                                                " />
                                                            <v-list-item
                                                                link
                                                                title="Löschen"
                                                                @click="
                                                                    elementToDelete = submodelElement;
                                                                    deleteElementDialog = true;
                                                                " />

                                                            <v-checkbox
                                                                v-if="allowStartscreen"
                                                                label="Auf Hauptseite"
                                                                hide-details
                                                                class="mr-2"
                                                                :model-value="getPreviewState(submodelElement)"
                                                                @update:model-value="
                                                                    changeStartscreenState($event, submodelElement)
                                                                " />
                                                        </v-list>
                                                    </v-menu>
                                                </v-btn>
                                            </template>
                                        </v-toolbar>
                                        <v-card-item class="px-2 pb-2 pt-0">
                                            <v-card flat rounded="lg" border class="media-card">
                                                <v-img
                                                    v-if="checkContentType(submodelElement.contentType) === 'image'"
                                                    :src="fileUrls[submodelElement.idShort]"
                                                    block
                                                    cover
                                                    class="cursor-pointer"
                                                    @click="previewFile(submodelElement)">
                                                    <template #placeholder>
                                                        <div class="d-flex align-center justify-center fill-height">
                                                            <v-progress-circular
                                                                color="grey-lighten-4"
                                                                indeterminate></v-progress-circular>
                                                        </div>
                                                    </template>
                                                </v-img>
                                                <video
                                                    v-else-if="
                                                        checkContentType(submodelElement.contentType) === 'video'
                                                    "
                                                    :src="fileUrls[submodelElement.idShort]"
                                                    controls
                                                    class="video-element"></video>
                                                <v-icon
                                                    v-else-if="submodelElement.contentType === 'application/pdf'"
                                                    color="red"
                                                    size="x-large"
                                                    class="cursor-pointer"
                                                    @click="previewFile(submodelElement)"
                                                    >mdi-file-pdf-box</v-icon
                                                >
                                                <v-icon
                                                    v-else
                                                    size="x-large"
                                                    color="grey"
                                                    class="cursor-pointer"
                                                    @click="previewFile(submodelElement)"
                                                    >mdi-file</v-icon
                                                >
                                            </v-card>
                                        </v-card-item>
                                    </v-card>
                                </v-lazy>
                            </v-col>
                        </v-row>
                    </div>
                    <!-- List view -->
                    <v-data-table
                        v-else
                        :headers="tableHeaders"
                        :items="fileObjects"
                        class="bg-transparent"
                        hide-default-footer
                        hover
                        @click:row="handleFileExplorerClick">
                        <template #[`header.selection`]>
                            <v-checkbox-btn
                                :model-value="isAllSelected"
                                :indeterminate="isSomeSelected && !isAllSelected"
                                @update:model-value="toggleSelectAll"
                                @click.stop>
                            </v-checkbox-btn>
                        </template>
                        <template #[`item.selection`]="{ item }">
                            <v-checkbox-btn
                                v-if="item.modelType !== 'NavigationElement'"
                                :model-value="isItemSelected(item)"
                                @update:model-value="toggleItemSelection(item)"
                                @click.stop>
                            </v-checkbox-btn>
                        </template>
                        <template #[`item.idShort`]="{ item }">
                            <v-list-item
                                v-if="item.modelType === 'File'"
                                lines="one"
                                :draggable="true"
                                :class="['draggable-item', { 'selected-item': isItemSelected(item) }]"
                                @dragstart="handleDragStart($event, item)"
                                @dragend="handleDragEnd">
                                <template #prepend>
                                    <v-icon v-if="item.contentType === 'application/pdf'" color="red"
                                        >mdi-file-pdf-box</v-icon
                                    >
                                    <v-icon
                                        v-else-if="checkContentType(item.contentType) === 'image'"
                                        color="blue-darken-2"
                                        >mdi-image</v-icon
                                    >
                                    <v-icon
                                        v-else-if="checkContentType(item.contentType) === 'video'"
                                        color="orange-darken-1"
                                        >mdi-video</v-icon
                                    >
                                    <v-icon v-else color="grey">mdi-file</v-icon>
                                </template>
                                <v-list-item-title class="text-subtitle-2">{{ item.idShort }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item
                                v-else-if="item.modelType === 'SubmodelElementCollection'"
                                :draggable="true"
                                :class="[
                                    'draggable-item',
                                    {
                                        'drop-zone-active': dragOverFolder === item.idShort,
                                        'selected-item': isItemSelected(item),
                                    },
                                ]"
                                @dragstart="handleDragStart($event, item)"
                                @dragend="handleDragEnd"
                                @dragover.prevent="handleDragOver($event, item)"
                                @dragleave="handleDragLeave($event, item)"
                                @drop="handleDrop($event, item)">
                                <template #prepend>
                                    <v-icon color="yellow darken-2">mdi-folder</v-icon>
                                </template>
                                <v-list-item-title class="text-subtitle-2">
                                    {{
                                        item.displayName
                                            ? item.displayName.find((name: any) => name.language === 'de')?.text ||
                                              item.idShort
                                            : item.idShort
                                    }}
                                    <span class="text-caption text-medium-emphasis ml-2"
                                        >({{ getFolderElementCount(item) }})</span
                                    >
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                                v-else-if="item.modelType === 'NavigationElement'"
                                :class="['draggable-item', { 'drop-zone-active': dragOverFolder === item.idShort }]"
                                @click="navigateOneUp()"
                                @dragover.prevent="handleDragOver($event, item)"
                                @dragleave="handleDragLeave($event, item)"
                                @drop="handleDrop($event, item)">
                                <template #prepend>
                                    <v-icon color="yellow darken-2">mdi-folder</v-icon>
                                </template>
                                <v-list-item-title class="text-subtitle-2">...</v-list-item-title>
                            </v-list-item>
                        </template>
                        <template #[`item.contentType`]="{ item }">
                            <span v-if="item.modelType === 'File'">{{ `.${mimeToExtension(item.contentType)}` }}</span>
                            <span v-else-if="item.modelType === 'SubmodelElementCollection'">Ordner</span>
                        </template>
                        <template #[`item.actions`]="{ item }">
                            <v-btn
                                v-if="isOnASubpath() && item.modelType !== 'NavigationElement'"
                                icon="mdi-arrow-up-bold"
                                variant="plain"
                                size="small"
                                :disabled="selectedItems.length > 0"
                                @click.stop="moveElementUp(item)" />
                            <v-btn
                                v-if="item.modelType === 'SubmodelElementCollection'"
                                icon="mdi-pencil"
                                variant="plain"
                                size="small"
                                :disabled="selectedItems.length > 0"
                                @click.stop="editFolderName(item)" />
                            <v-btn
                                v-if="item.modelType === 'File'"
                                icon="mdi-tray-arrow-down"
                                variant="plain"
                                size="small"
                                :disabled="selectedItems.length > 0"
                                @click.stop="downloadFile(fileUrls[item.idShort], item)" />
                            <v-btn
                                v-if="item.modelType !== 'NavigationElement'"
                                icon="mdi-delete"
                                variant="plain"
                                size="small"
                                :disabled="selectedItems.length > 0"
                                @click.stop="
                                    elementToDelete = item;
                                    deleteElementDialog = true;
                                " />
                        </template>
                    </v-data-table>
                </v-card-text>
            </v-card>
        </v-container>
        <PreviewDialog
            :preview-dialog="previewDialog"
            :preview-file="previewElement"
            :file-submodel="submodelElementData"
            @update:preview-dialog="updatePreviewDialog"></PreviewDialog>
    </v-container>
</template>

<script setup lang="ts">
    import { computed, nextTick, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useDisplay } from 'vuetify';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import {
        checkContentType,
        convertFileNameToIdentifier,
        createThumbnail,
        mimeToExtension,
    } from '@/utils/FileHandling';

    // Options
    defineOptions({
        name: 'FileSystem',
        semanticId: 'https://basyx.org/FileSystem/FileSystem/0/1',
    });

    // Props
    interface Props {
        defaultView?: number;
        submodelElementData: any;
        acceptedFiles?: string;
        allowStartscreen?: boolean;
        title?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        defaultView: 0,
        acceptedFiles: undefined,
        allowStartscreen: false,
        title: 'File Explorer',
    });

    // Composables & Stores
    const route = useRoute();
    const router = useRouter();
    const { mdAndUp } = useDisplay();
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();

    // Reactive State
    const uploadDialog = ref(false);
    const loading = ref(false);
    const files = ref<File[] | null>(null);
    const fileObjects = ref<any[]>([]);
    const fileUrls = ref<Record<string, string>>({});
    const selectedView = ref(0);
    const headers = ref<any[]>([
        { title: '', key: 'selection', sortable: false, width: '50px' },
        { title: 'Name', key: 'idShort' },
        { title: 'Type', key: 'contentType' },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '200px' },
    ]);
    const previewDialog = ref(false);
    const previewElement = ref<any | null>(null);
    const folderNamingDialog = ref(false);
    const editingFolder = ref<any | null>(null);
    const editingFolderName = ref('');
    const breadCrumbs = ref<any[]>([]);

    const elementToDelete = ref<any | null>(null);
    const deleteElementDialog = ref<boolean>(false);
    const draggedItems = ref<any[]>([]);
    const dragOverFolder = ref<string | null>(null);
    const isExternalDragOver = ref<boolean>(false);
    const uploadProgress = ref<{ current: number; total: number; fileName: string }>({
        current: 0,
        total: 0,
        fileName: '',
    });
    const isUploading = ref<boolean>(false);
    const selectedItems = ref<any[]>([]);
    const isMoving = ref<boolean>(false);
    const moveProgress = ref<{ current: number; total: number; itemName: string }>({
        current: 0,
        total: 0,
        itemName: '',
    });

    // Computed Properties
    const tableHeaders = computed(() => {
        if (mdAndUp.value) {
            return headers.value;
        } else {
            return headers.value.filter((header) => header.key !== 'contentType');
        }
    });

    // Methods
    const uploadFiles = async () => {
        let filePath = route.query.filePath || '';
        if (files.value && files.value.length > 0) {
            loading.value = true;
            isUploading.value = true;
            uploadProgress.value = { current: 0, total: files.value.length, fileName: '' };

            for (let i = 0; i < files.value.length; i++) {
                const file = files.value[i];
                uploadProgress.value = { current: i + 1, total: files.value.length, fileName: file.name };

                try {
                    const path =
                        props.submodelElementData.path + '/submodel-elements' + (filePath ? `/${filePath}` : '');
                    const idShort = convertFileNameToIdentifier(file.name);
                    const fileSME = {
                        idShort: idShort,
                        modelType: 'File',
                        contentType: file.type,
                        value: '',
                    };
                    const body = JSON.stringify(fileSME);
                    const headersData = new Headers();
                    headersData.append('Content-Type', 'application/json');
                    headersData.append('accept', 'application/json');
                    const context = 'Adding File Element to Submodel';
                    const disableMessage = true;
                    let response = await postRequest(path, body, headersData, context, disableMessage);
                    if (response.success) {
                        const fullPath = filePath ? `${filePath}.${idShort}` : idShort;
                        await addAttachmentFile(file, fullPath);
                    }
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                }
            }

            loading.value = false;
            isUploading.value = false;
            uploadProgress.value = { current: 0, total: 0, fileName: '' };
            files.value = null;
            uploadDialog.value = false;
            const path = route.query.filePath || '';
            fetchFiles(path);
        }
    };

    const addAttachmentFile = async (file: File, idShort: string) => {
        const path = props.submodelElementData.path + '/submodel-elements/' + idShort + '/attachment';
        let formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        const headersData = new Headers();
        headersData.append('accept', 'application/json');
        const context = 'Adding Attachment File to File Element';
        const disableMessage = false;
        await putRequest(path, formData, headersData, context, disableMessage);
    };

    const fetchFiles = (filePath: any = '') => {
        if (props.submodelElementData) {
            const path = props.submodelElementData.path + '/submodel-elements' + (filePath ? `/${filePath}` : '');
            const context = 'Fetching file elements';
            const disableMessage = false;
            getRequest(path, context, disableMessage).then((response: any) => {
                if (response.success) {
                    fileObjects.value = [];
                    const submodelElements = filePath ? response.data.value : response.data.result;
                    if (isOnASubpath()) {
                        fileObjects.value.push({
                            idShort: '...',
                            modelType: 'NavigationElement',
                        });
                    }
                    if (!submodelElements) {
                        return;
                    }

                    let filteredElements = submodelElements.filter(
                        (submodelElement: any) =>
                            submodelElement.modelType === 'File' ||
                            (submodelElement.modelType === 'SubmodelElementCollection' &&
                                submodelElement.semanticId &&
                                submodelElement.semanticId.keys.some(
                                    (key: any) => key.value === 'https://basyx.org/submodels/Folder'
                                )) ||
                            submodelElement.modelType === 'NavigationElement'
                    );

                    // Sort: folders first, then files (alphabetically within each group)
                    filteredElements.sort((a: any, b: any) => {
                        if (
                            a.modelType === 'SubmodelElementCollection' &&
                            b.modelType !== 'SubmodelElementCollection'
                        ) {
                            return -1;
                        }
                        if (
                            a.modelType !== 'SubmodelElementCollection' &&
                            b.modelType === 'SubmodelElementCollection'
                        ) {
                            return 1;
                        }
                        return (a.idShort || '').localeCompare(b.idShort || '');
                    });

                    filteredElements.forEach((file: any) => {
                        if (file.modelType === 'File') getFile(file.idShort);
                        fileObjects.value.push(file);
                    });
                }
            });
        }
    };

    const getFile = (idShort: string) => {
        const currentPath = route.query.filePath || '';
        const path =
            props.submodelElementData.path +
            '/submodel-elements/' +
            (currentPath ? `${currentPath}.` : '') +
            idShort +
            '/attachment';
        const context = 'Fetching File';
        const disableMessage = false;
        getRequest(path, context, disableMessage).then((response: any) => {
            if (response.success) {
                const blob = response.data as Blob;
                if (blob && blob instanceof Blob && blob.type && blob.type.startsWith('image/')) {
                    createThumbnail(blob, 512, (thumbnailUrl: any) => {
                        fileUrls.value[idShort] = thumbnailUrl;
                    });
                } else if (blob && blob instanceof Blob) {
                    fileUrls.value[idShort] = URL.createObjectURL(blob).toString();
                }
            }
        });
    };

    const deleteElement = (file: any) => {
        const filePath = route.query.filePath || '';
        const path =
            props.submodelElementData.path + '/submodel-elements/' + (filePath ? `${filePath}.` : '') + file.idShort;
        const context = 'Deleting File';
        const disableMessage = false;
        deleteRequest(path, context, disableMessage).then((response: any) => {
            if (response.success) {
                const path = route.query.filePath || '';
                fetchFiles(path);
            }
        });
    };

    const isItemSelected = (item: any): boolean => {
        return selectedItems.value.some((selected) => selected.idShort === item.idShort);
    };

    const selectableItems = computed(() => {
        return fileObjects.value.filter((item) => item.modelType !== 'NavigationElement');
    });

    const isAllSelected = computed(() => {
        return selectableItems.value.length > 0 && selectedItems.value.length === selectableItems.value.length;
    });

    const isSomeSelected = computed(() => {
        return selectedItems.value.length > 0;
    });

    const toggleSelectAll = () => {
        if (isAllSelected.value) {
            selectedItems.value = [];
        } else {
            selectedItems.value = [...selectableItems.value];
        }
    };

    const toggleItemSelection = (item: any) => {
        if (item.modelType === 'NavigationElement') return;

        const index = selectedItems.value.findIndex((selected) => selected.idShort === item.idShort);
        if (index === -1) {
            selectedItems.value.push(item);
        } else {
            selectedItems.value.splice(index, 1);
        }
    };

    const confirmDeleteSelected = () => {
        if (selectedItems.value.length > 0) {
            elementToDelete.value = [...selectedItems.value];
            deleteElementDialog.value = true;
        }
    };

    const deleteSelectedElements = async () => {
        if (!Array.isArray(elementToDelete.value)) return;

        const filePath = route.query.filePath || '';
        const itemsToDelete = [...elementToDelete.value];

        for (const item of itemsToDelete) {
            const path =
                props.submodelElementData.path +
                '/submodel-elements/' +
                (filePath ? `${filePath}.` : '') +
                item.idShort;
            const context = 'Deleting Element';
            const disableMessage = true;
            await deleteRequest(path, context, disableMessage);
        }

        selectedItems.value = [];
        fetchFiles(filePath);
    };

    const downloadFile = (url: string, file: any) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fullFileName(file);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fullFileName = (file: any): string => {
        if (!file) return '';

        const extension = mimeToExtension(file.contentType);
        return `${file.idShort}.${extension}`;
    };

    const previewFile = (item: any) => {
        previewDialog.value = true;
        previewElement.value = item;
    };

    const previewFileFromTable = (_clickHandler: any, item: any) => {
        previewDialog.value = true;
        previewElement.value = item.item;
    };

    const updatePreviewDialog = (val: boolean) => {
        previewDialog.value = val;
    };

    const changeStartscreenState = (state: any, file: any) => {
        // Get the PreviewCollection containing the startscreen files
        let previewCollection = props.submodelElementData.submodelElements.find(
            (element: any) => element.idShort === 'PreviewCollection'
        );
        // check if a ReferenceElement already exists for this file
        const referenceElement = previewCollection.value?.find((element: any) => element.idShort === file.idShort);
        if (state) {
            // Add a ReferenceElement to the PreviewCollection
            if (!referenceElement) {
                const reference = {
                    idShort: file.idShort,
                    modelType: 'ReferenceElement',
                    value: {
                        keys: [
                            { type: 'Submodel', value: props.submodelElementData?.id },
                            { type: 'File', value: file.idShort },
                        ],
                    },
                };
                if (!previewCollection.value) previewCollection.value = [];
                previewCollection.value.push(reference);
                addReferenceElement(reference);
            }
        } else {
            // Remove the ReferenceElement from the PreviewCollection
            if (referenceElement) {
                previewCollection.value = previewCollection.value.filter(
                    (element: any) => element.idShort !== file.idShort
                );
                if (previewCollection.value.length === 0) {
                    previewCollection.value = null;
                }
                removeReferenceElement(referenceElement);
            }
        }
    };

    const getPreviewState = (file: any): boolean => {
        // Get the PreviewCollection containing the startscreen files
        const previewCollection = props.submodelElementData.submodelElements.find(
            (element: any) => element.idShort === 'PreviewCollection'
        );
        // check if a ReferenceElement already exists for this file
        const referenceElement = previewCollection.value?.find((element: any) => element.idShort === file.idShort);
        return referenceElement ? true : false;
    };

    const addReferenceElement = async (reference: any) => {
        const path = props.submodelElementData.path + '/submodel-elements/PreviewCollection';
        const body = JSON.stringify(reference);
        const headersData = new Headers();
        headersData.append('Content-Type', 'application/json');
        const context = 'Adding ReferenceElement to PreviewCollection';
        const disableMessage = false;
        await postRequest(path, body, headersData, context, disableMessage);
    };

    const removeReferenceElement = async (reference: any) => {
        const path = props.submodelElementData.path + '/submodel-elements/PreviewCollection.' + reference.idShort;
        const context = 'Removing ReferenceElement from PreviewCollection';
        const disableMessage = false;
        await deleteRequest(path, context, disableMessage);
    };

    const createFolder = async () => {
        const newFolderTemplate = {
            idShort: 'FOLDER_' + Date.now(),
            modelType: 'SubmodelElementCollection',
            value: [],
            displayName: [{ language: 'de', text: 'New Folder' }],
            semanticId: {
                keys: [
                    {
                        type: 'GlobalReference',
                        value: 'https://basyx.org/submodels/Folder',
                    },
                ],
                type: 'ExternalReference',
            },
        };
        let filePath = route.query.filePath || '';
        const path = props.submodelElementData.path + '/submodel-elements' + (filePath ? `/${filePath}` : '');
        const body = JSON.stringify(newFolderTemplate);
        const headersData = new Headers();
        headersData.append('Content-Type', 'application/json');
        const context = 'Creating new folder in File Submodel';
        const disableMessage = false;
        const response = await postRequest(path, body, headersData, context, disableMessage);
        if (response.success) {
            const path = route.query.filePath || '';
            fetchFiles(path);
        }
    };

    const handleFileExplorerClick = (_clickHandler: any, item: any) => {
        if (item.item.modelType === 'File') {
            previewFileFromTable(_clickHandler, item);
        } else if (item.item.modelType === 'SubmodelElementCollection') {
            // Navigate into the folder by updating the route query parameter
            const currentFilePath = route.query.filePath || '';
            const newFilePath = currentFilePath ? `${currentFilePath}.${item.item.idShort}` : item.item.idShort;
            router.push({ query: { ...route.query, filePath: newFilePath } });
        }
    };

    function handleFileExplorerClickFromGalery(item: any): void {
        if (item.modelType === 'SubmodelElementCollection') {
            // Navigate into the folder by updating the route query parameter
            const currentFilePath = route.query.filePath || '';
            const newFilePath = currentFilePath ? `${currentFilePath}.${item.idShort}` : item.idShort;
            router.push({ query: { ...route.query, filePath: newFilePath } });
        }
    }

    const setBreadcrumbItems = async (): Promise<void> => {
        const filePath = route.query.filePath || '';
        breadCrumbs.value = [];
        breadCrumbs.value.push({
            title: props.title ?? 'Root',
            disabled: !filePath,
            to: { query: { ...route.query, filePath: '' } },
            index: 0,
        });
        const splitted = filePath.toString().split('.');
        if (splitted.length === 1 && splitted[0] === '') {
            return;
        }
        splitted.forEach(async (part: string, index: number) => {
            const path = splitted.slice(0, index + 1).join('.');
            const fullPathForCurrentElement = splitted.slice(0, index + 1).join('.');
            const displayName = await getDisplayNameByPathFromAASServer(fullPathForCurrentElement);
            breadCrumbs.value.push({
                title: displayName,
                disabled: path === filePath,
                to: { query: { ...route.query, filePath: path } },
                index: index,
            });
            breadCrumbs.value.sort((a, b) => a.index - b.index);
        });
    };

    const goUp = () => {
        const filePath = route.query.filePath || '';
        if (filePath) {
            const splitted = filePath.toString().split('.');
            splitted.pop();
            const newFilePath = splitted.join('.');
            router.push({ query: { ...route.query, filePath: newFilePath } });
        }
    };

    const editFolderName = (item: any): void => {
        folderNamingDialog.value = true;
        editingFolder.value = item;
        if (
            !editingFolder.value.displayName ||
            editingFolder.value.displayName.find((name: any) => name.language === 'de') === undefined
        ) {
            editingFolder.value.displayName = [{ language: 'de', text: editingFolder.value.idShort }];
        }
        editingFolderName.value = editingFolder.value.displayName.find((name: any) => name.language === 'de').text;
    };

    const saveFolderName = (): void => {
        if (editingFolder.value) {
            const nameEntry = editingFolder.value.displayName.find((name: any) => name.language === 'de');
            if (nameEntry) {
                nameEntry.text = editingFolderName.value;
            } else {
                editingFolder.value.displayName.push({ language: 'de', text: editingFolderName.value });
            }
            // Update the SubmodelElementCollection on the server
            const queryPath = route.query.filePath || '';
            const path =
                props.submodelElementData.path +
                '/submodel-elements/' +
                (queryPath.length === 0 ? editingFolder.value.idShort : `.${editingFolder.value.idShort}`);
            const body = JSON.stringify(editingFolder.value);
            const headersData = new Headers();
            headersData.append('Content-Type', 'application/json');
            const context = 'Updating Folder Name';
            const disableMessage = false;
            putRequest(path, body, headersData, context, disableMessage).then((response: any) => {
                if (response.success) {
                    const filePath = route.query.filePath || '';
                    fetchFiles(filePath);
                }
            });
        }
    };

    const getDisplayNameByPathFromAASServer = async (idShortPath: string): Promise<string> => {
        const path = props.submodelElementData.path + '/submodel-elements/' + idShortPath;
        const context = 'Fetching Submodel Element for Display Name';
        const disableMessage = true;
        let displayName = idShortPath;
        const response = await getRequest(path, context, disableMessage);
        if (response.success) {
            const submodelElement = response.data;
            if (submodelElement.displayName) {
                const nameEntry = submodelElement.displayName.find((name: any) => name.language === 'de');
                if (nameEntry) {
                    displayName = nameEntry.text;
                }
            }
        }
        return displayName;
    };

    function getFolderName(element: any): string {
        if (element.displayName) {
            const nameEntry = element.displayName.find((name: any) => name.language === 'de');
            if (nameEntry) {
                return nameEntry.text;
            }
        }
        return element.idShort;
    }

    const handleDragStart = (event: DragEvent, item: any) => {
        // If the dragged item is selected, drag all selected items
        // Otherwise, just drag this single item
        if (isItemSelected(item) && selectedItems.value.length > 1) {
            draggedItems.value = [...selectedItems.value];
        } else {
            draggedItems.value = [item];
        }

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', draggedItems.value.map((i) => i.idShort).join(','));

            // Set drag image text for multiple items
            if (draggedItems.value.length > 1) {
                const dragImage = document.createElement('div');
                dragImage.textContent = `${draggedItems.value.length} Elemente`;
                dragImage.style.cssText =
                    'position: absolute; top: -1000px; padding: 8px 16px; background: #2196f3; color: white; border-radius: 4px; font-weight: 500;';
                document.body.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, 0, 0);
                setTimeout(() => document.body.removeChild(dragImage), 0);
            }
        }
    };

    const handleDragEnd = () => {
        draggedItems.value = [];
        dragOverFolder.value = null;
    };

    const handleExternalDragOver = (event: DragEvent) => {
        // Only show drop zone for external files (not internal drag)
        if (draggedItems.value.length > 0) return;

        if (event.dataTransfer?.types.includes('Files')) {
            isExternalDragOver.value = true;
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
        }
    };

    const handleExternalDragLeave = (event: DragEvent) => {
        // Only reset if we're leaving the drop zone entirely
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;

        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            isExternalDragOver.value = false;
        }
    };

    const handleExternalDrop = async (event: DragEvent) => {
        isExternalDragOver.value = false;

        // If this is an internal drag operation, let the other handlers deal with it
        if (draggedItems.value.length > 0) return;

        const fileElements = event.dataTransfer?.files;
        if (!fileElements || fileElements.length === 0) return;

        // Filter files based on acceptedFiles prop if specified
        const fileArray = Array.from(fileElements);
        const validFiles = props.acceptedFiles
            ? fileArray.filter((file) => {
                  const acceptedTypes = props.acceptedFiles!.split(',').map((t) => t.trim());
                  return acceptedTypes.some((type) => {
                      if (type.startsWith('.')) {
                          // Extension match
                          return file.name.toLowerCase().endsWith(type.toLowerCase());
                      } else if (type.endsWith('/*')) {
                          // MIME type wildcard (e.g., image/*)
                          const baseType = type.replace('/*', '');
                          return file.type.startsWith(baseType);
                      } else {
                          // Exact MIME type match
                          return file.type === type;
                      }
                  });
              })
            : fileArray;

        if (validFiles.length === 0) return;

        // Set the files and trigger upload
        files.value = validFiles;
        await uploadFiles();
    };

    const handleDragOver = (event: DragEvent, targetFolder: any) => {
        event.preventDefault();
        // Don't allow dropping on itself or if one of the dragged items is the target
        const isDroppingOnSelf = draggedItems.value.some((item) => item.idShort === targetFolder.idShort);
        if (draggedItems.value.length > 0 && !isDroppingOnSelf) {
            dragOverFolder.value = targetFolder.idShort;
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move';
            }
        }
    };

    const handleDragLeave = (event: DragEvent, targetFolder: any) => {
        if (
            event.currentTarget === event.target ||
            !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)
        ) {
            if (dragOverFolder.value === targetFolder.idShort) {
                dragOverFolder.value = null;
            }
        }
    };

    const handleDrop = async (event: DragEvent, targetFolder: any) => {
        event.preventDefault();
        event.stopPropagation();
        dragOverFolder.value = null;

        // Copy items immediately as dragend may clear them
        const itemsToMove = [...draggedItems.value];
        draggedItems.value = [];

        if (itemsToMove.length === 0) {
            return;
        }

        // Don't allow dropping on itself
        const isDroppingOnSelf = itemsToMove.some((item) => item.idShort === targetFolder.idShort);
        if (isDroppingOnSelf) {
            return;
        }

        // Show moving progress
        isMoving.value = true;
        moveProgress.value = { current: 0, total: itemsToMove.length, itemName: '' };

        // Move all dragged items
        for (let i = 0; i < itemsToMove.length; i++) {
            const item = itemsToMove[i];
            moveProgress.value = {
                current: i + 1,
                total: itemsToMove.length,
                itemName: item.idShort,
            };

            // Check if dropping on the NavigationElement (move up)
            if (targetFolder.modelType === 'NavigationElement') {
                await moveElementUp(item);
            } else {
                // Move the dragged item into the target folder
                await moveElementToFolder(item, targetFolder);
            }
        }

        // Hide moving progress
        isMoving.value = false;
        moveProgress.value = { current: 0, total: 0, itemName: '' };

        // Clear selection after moving
        selectedItems.value = [];

        // Refresh file list
        const currentPath = route.query.filePath || '';
        fetchFiles(currentPath);
    };

    const moveElementToFolder = async (element: any, targetFolder: any) => {
        try {
            // First, get the element data from the current location
            const currentPath = route.query.filePath || '';
            const sourcePath =
                props.submodelElementData.path +
                '/submodel-elements/' +
                (currentPath ? `${currentPath}.${element.idShort}` : element.idShort);

            const context = 'Fetching element data for move';
            const disableMessage = true;
            const response = await getRequest(sourcePath, context, disableMessage);

            if (!response.success) {
                console.error('Failed to fetch element data');
                return;
            }

            const elementData = response.data;
            const isFile = elementData.modelType === 'File';
            let fileBlob: Blob | null = null;

            // If it's a file, get the attachment
            if (isFile) {
                const attachmentPath = sourcePath + '/attachment';
                const attachmentResponse = await getRequest(attachmentPath, 'Fetching file attachment', true);
                if (attachmentResponse.success) {
                    fileBlob = attachmentResponse.data as Blob;
                }
            }

            // Check if element with same idShort exists in target folder
            const targetFolderPath =
                props.submodelElementData.path +
                '/submodel-elements/' +
                (currentPath ? `${currentPath}.${targetFolder.idShort}` : targetFolder.idShort);

            const checkResponse = await getRequest(targetFolderPath, 'Checking target folder', true);
            if (checkResponse.success) {
                const targetFolderData = checkResponse.data;
                const existingElements = targetFolderData.value || [];
                const conflictingElement = existingElements.find((el: any) => el.idShort === elementData.idShort);

                if (conflictingElement) {
                    // Append timestamp to avoid conflict
                    elementData.idShort = `${elementData.idShort}_${Date.now()}`;
                }
            }

            // Create the element in the target folder
            const body = JSON.stringify(elementData);
            const headersData = new Headers();
            headersData.append('Content-Type', 'application/json');
            const createContext = 'Moving element to folder';
            const createResponse = await postRequest(targetFolderPath, body, headersData, createContext, false);

            if (createResponse.success) {
                // If it's a file, upload the attachment to the new location
                if (isFile && fileBlob) {
                    const newIdShortPath =
                        (currentPath ? `${currentPath}.${targetFolder.idShort}.` : `${targetFolder.idShort}.`) +
                        elementData.idShort;
                    await addAttachmentFile(
                        new File([fileBlob], fullFileName(element), { type: elementData.contentType }),
                        newIdShortPath
                    );
                }

                // Delete the element from the original location
                await deleteRequest(sourcePath, 'Removing element from original location', true);
            }
        } catch (error) {
            console.error('Error moving element:', error);
        }
    };

    const moveElementUp = async (element: any) => {
        try {
            const currentPath = route.query.filePath || '';
            if (!currentPath) {
                // Already at root level, can't move up
                return;
            }

            // Get the element data from the current location
            const sourcePath =
                props.submodelElementData.path + '/submodel-elements/' + `${currentPath}.${element.idShort}`;

            const context = 'Fetching element data for move up';
            const disableMessage = true;
            const response = await getRequest(sourcePath, context, disableMessage);

            if (!response.success) {
                console.error('Failed to fetch element data');
                return;
            }

            const elementData = response.data;
            const isFile = elementData.modelType === 'File';
            let fileBlob: Blob | null = null;

            // If it's a file, get the attachment
            if (isFile) {
                const attachmentPath = sourcePath + '/attachment';
                const attachmentResponse = await getRequest(attachmentPath, 'Fetching file attachment', true);
                if (attachmentResponse.success) {
                    fileBlob = attachmentResponse.data as Blob;
                }
            }

            // Calculate parent path (remove one level)
            const pathParts = currentPath.toString().split('.');
            pathParts.pop(); // Remove last part (current folder)
            const parentPath = pathParts.join('.');

            // Check if element with same idShort exists in parent folder
            const targetPath =
                props.submodelElementData.path + '/submodel-elements' + (parentPath ? `/${parentPath}` : '');

            const checkResponse = await getRequest(targetPath, 'Checking parent folder', true);
            if (checkResponse.success) {
                const parentFolderData = parentPath ? checkResponse.data : { result: checkResponse.data.result };
                const existingElements = parentFolderData.value || parentFolderData.result || [];
                const conflictingElement = existingElements.find((el: any) => el.idShort === elementData.idShort);

                if (conflictingElement) {
                    // Append timestamp to avoid conflict
                    elementData.idShort = `${elementData.idShort}_${Date.now()}`;
                }
            }

            // Create the element in the parent folder
            const body = JSON.stringify(elementData);
            const headersData = new Headers();
            headersData.append('Content-Type', 'application/json');
            const createContext = 'Moving element up one level';
            const createResponse = await postRequest(targetPath, body, headersData, createContext, false);

            if (createResponse.success) {
                // If it's a file, upload the attachment to the new location
                if (isFile && fileBlob) {
                    const newIdShortPath = (parentPath ? `${parentPath}.` : '') + elementData.idShort;
                    await addAttachmentFile(
                        new File([fileBlob], fullFileName(element), { type: elementData.contentType }),
                        newIdShortPath
                    );
                }

                // Delete the element from the original location
                await deleteRequest(sourcePath, 'Removing element from original location', true);
            }
        } catch (error) {
            console.error('Error moving element up:', error);
        }
    };

    function isOnASubpath(): boolean {
        const filePath = route.query.filePath || '';
        return filePath.toString().length > 0;
    }

    function navigateOneUp(): void {
        const filePath = route.query.filePath || '';
        if (filePath) {
            const splitted = filePath.toString().split('.');
            splitted.pop();
            const newFilePath = splitted.join('.');
            router.push({ query: { ...route.query, filePath: newFilePath } });
        }
    }

    const getFolderElementCount = (folder: any): number => {
        if (folder.modelType !== 'SubmodelElementCollection' || !folder.value) {
            return 0;
        }
        return folder.value.length;
    };

    // Watchers
    watch(
        () => route.query.filePath,
        (newFilePath) => {
            fetchFiles(newFilePath as string);
        }
    );

    watch(fileObjects, () => {
        setBreadcrumbItems();
    });

    // Lifecycle
    onMounted(() => {
        selectedView.value = props.defaultView;
        nextTick(() => {
            const filePath = route.query.filePath || '';
            fetchFiles(filePath);
        });
    });
</script>

<style scoped>
    .media-card {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding-bottom: 56.25%;
        /* 16:9 aspect ratio */
        height: 0;
        overflow: hidden;
    }

    .media-card > * {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .video-element {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .draggable-item {
        cursor: move;
    }

    .draggable-item:active {
        opacity: 0.5;
    }

    .drop-zone-active {
        background-color: rgba(33, 150, 243, 0.1);
        border: 2px dashed #2196f3;
        border-radius: 8px;
    }

    .selected-item {
        background-color: rgba(33, 150, 243, 0.15);
        border-color: #2196f3 !important;
    }

    .external-drop-zone-active {
        background-color: rgba(76, 175, 80, 0.1);
        border: 3px dashed #4caf50;
        border-radius: 8px;
        position: relative;
    }

    .external-drop-zone-active::after {
        content: 'Dateien hier ablegen zum Hochladen';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.5rem;
        color: #4caf50;
        font-weight: 500;
        pointer-events: none;
        background-color: rgba(255, 255, 255, 0.9);
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10;
    }
</style>
