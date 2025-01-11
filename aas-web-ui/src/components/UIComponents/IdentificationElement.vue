<template>
    <v-container fluid class="pa-0">
        <v-hover v-slot="{ isHovering, props }">
            <v-list-item>
                <!-- Tooltip with idShort and identification id -->
                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-if="identificationObject && identificationObject?.id" class="text-caption">
                        <span class="font-weight-bold">{{ 'ID: ' }}</span
                        >{{ identificationObject['id'] }}
                    </div>
                    <div v-if="identificationObject && identificationObject?.idShort" class="text-caption">
                        <span class="font-weight-bold">{{ nameType + ': ' }}</span
                        >{{ identificationObject['idShort'] }}
                    </div>
                </v-tooltip>
                <!-- idShort -->
                <template #title>
                    <div class="text-primary text-subtitle-1">{{ nameToDisplay(identificationObject) }}</div>
                    <div v-if="identificationObject.id">{{ idType + ':' }}</div>
                </template>
                <!-- identification id -->
                <template #subtitle>
                    <div
                        v-if="identificationObject.id"
                        v-bind="props"
                        :class="isHovering ? 'cursor-pointer' : ''"
                        @click="copyToClipboard()">
                        <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">{{
                            copyIcon
                        }}</v-icon>
                        <span>{{ identificationObject.id ? identificationObject.id : '' }}</span>
                    </div>
                </template>
                <!-- modelType -->
                <template #append>
                    <v-chip size="x-small" color="primary">{{ modelType }}</v-chip>
                </template>
            </v-list-item>
        </v-hover>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'IdentificationElement',
        mixins: [SubmodelElementHandling],
        props: ['identificationObject', 'modelType', 'idType', 'nameType'],

        setup() {
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
            };
        },

        data() {
            return {
                copyIcon: 'mdi-clipboard-file-outline',
            };
        },

        methods: {
            // Function to copy the id to the clipboard
            copyToClipboard() {
                if (!this.identificationObject || !this.identificationObject.id) return;
                // console.log('Copy ID to Clipboard: ', this.identificationObject.id);
                // set the icon to checkmark
                this.copyIcon = 'mdi-check';
                // copy the path to the clipboard
                navigator.clipboard.writeText(this.identificationObject.id);
                // set the clipboard tooltip to false after 1.5 seconds
                setTimeout(() => {
                    this.copyIcon = 'mdi-clipboard-file-outline';
                }, 2000);
                // open Snackbar to inform the user that the path was copied to the clipboard
                this.navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 2000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'ID copied to Clipboard.',
                });
            },
        },
    });
</script>
