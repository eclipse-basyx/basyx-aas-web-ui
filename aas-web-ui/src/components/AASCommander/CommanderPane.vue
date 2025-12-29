<template>
    <v-container fluid class="pa-0 fill-height" style="width: 100%">
        <v-card border rounded="lg" class="fill-height d-flex flex-column" style="width: 100%">
            <v-card-title>Commander List</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="flex-grow-1 overflow-auto"></v-card-text>
        </v-card>
    </v-container>
    <!-- Dialog for creating/editing AAS -->
    <!-- <AASForm v-model="editDialog" :new-shell="newShell" :aas="aasToEdit"></AASForm> -->
    <!-- Dialog for uploading AAS -->
    <!-- <UploadAAS v-model="uploadAASDialog"></UploadAAS> -->
    <!-- Dialog for deleting AAS -->
    <!-- <DeleteAAS v-model="deleteDialog" :aas="aasToDelete" :list-loading-state="listLoading"></DeleteAAS> -->
    <!-- Dialog for downloading AAS -->
    <!-- <DownloadAAS v-model="downloadAASDialog" :aas="aasToDownload"></DownloadAAS> -->
</template>

<script lang="ts" setup></script>

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
