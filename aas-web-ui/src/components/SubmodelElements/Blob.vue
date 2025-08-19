<template>
    <v-container fluid class="pa-0">
        <v-list-item class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Value: ' }}</v-list-item-title>
        </v-list-item>
        <v-card v-if="props.blobObject" color="elevatedCard">
            <!-- Path (Value) of the File Element -->
            <v-list nav class="bg-elevatedCard pt-0">
                <v-list-item class="pb-0">
                    <!-- mimeType -->
                    <v-list-item-title>
                        <span class="text-caption">{{ 'Content Type: ' }}</span>
                        <v-chip label size="x-small" border color="primary">{{
                            props.blobObject.contentType ? props.blobObject.contentType : 'no-mime'
                        }}</v-chip>
                    </v-list-item-title>
                    <!-- Download File Button -->
                    <template #append>
                        <v-btn
                            v-if="blobData && props.blobObject.contentType"
                            size="small"
                            color="primary"
                            class="text-buttonText"
                            @click="downloadBlob"
                            >Download Blob to File</v-btn
                        >
                    </template>
                </v-list-item>
                <!-- Blob in Inputfield -->
                <v-list-item class="pt-0">
                    <v-list-item-title>
                        <v-textarea
                            v-model="displayedContent"
                            variant="outlined"
                            density="compact"
                            :hide-details="isTruncated ? false : true"
                            :clearable="props.isEditable"
                            :readonly="!props.isEditable"
                            :hint="
                                isTruncated ? 'Blob content is truncated (showing first ' + maxLength + ' bytes)' : ''
                            "
                            persistent-hint
                            :loading="isLoading"
                            @keydown.enter="updateBlob()"
                            @click:clear="clearBlob()">
                            <!-- Update Blob Button -->
                            <template #append-inner>
                                <v-btn
                                    v-if="props.isEditable"
                                    size="small"
                                    variant="elevated"
                                    color="primary"
                                    class="text-buttonText"
                                    style="right: -4px"
                                    @click.stop="updateBlob()">
                                    <v-icon>mdi-upload</v-icon>
                                </v-btn>
                            </template>
                        </v-textarea>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';

    const props = defineProps({
        blobObject: {
            type: Object as any,
            default: {} as any,
        },
        isEditable: {
            type: Boolean,
            default: true,
        },
    });

    // Stores
    const aasStore = useAASStore();

    // Composables
    const { fetchAndDispatchSme } = useSMEHandling();
    const { putRequest } = useRequestHandling();

    // State
    const blobData = ref<Uint8Array | null>(null);
    const displayedContent = ref<string>('');
    const maxLength = ref<number>(1000); // Max characters to display
    const isTruncated = ref<boolean>(false);
    const isLoading = ref<boolean>(false);

    // Computed values
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);

    // Watch for selected node changes
    watch(
        () => selectedNode.value,
        () => {
            blobData.value = null;
            displayedContent.value = '';
        }
    );

    // Watch for blob object changes
    watch(
        () => props.blobObject,
        (newValue) => {
            if (newValue && newValue.value) {
                processBlobValue(newValue.value);
            }
        },
        { immediate: true }
    );

    // Initial setup
    onMounted(() => {
        if (props.blobObject && props.blobObject.value) {
            processBlobValue(props.blobObject.value);
        }
    });

    // Process base64 encoded blob data
    function processBlobValue(value: string): void {
        try {
            isLoading.value = true;

            // Convert base64 to Uint8Array
            const binaryString = atob(value);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            blobData.value = bytes;

            // Create displayable content
            updateDisplayedContent();
        } catch (error) {
            console.error('Error processing blob:', error);
            displayedContent.value = 'Error: Could not process blob data';
        } finally {
            isLoading.value = false;
        }
    }

    // Update displayed content based on blob data
    function updateDisplayedContent(): void {
        if (!blobData.value) {
            displayedContent.value = '';
            isTruncated.value = false;
            return;
        }

        try {
            let content = '';
            // Try to display as text if it appears to be text content
            if (isTextContentType(props.blobObject.contentType)) {
                try {
                    const decoder = new TextDecoder('utf-8');
                    content = decoder.decode(blobData.value);
                } catch {
                    // Fall back to hex display if text decoding fails
                    content = Array.from(blobData.value)
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join(' ');
                }
            } else {
                // For binary data, show hex representation
                content = Array.from(blobData.value)
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join(' ');
            }

            // Truncate if needed
            if (content.length > maxLength.value) {
                displayedContent.value = content.substring(0, maxLength.value);
                isTruncated.value = true;
            } else {
                displayedContent.value = content;
                isTruncated.value = false;
            }
        } catch (error) {
            console.error('Error rendering content:', error);
            displayedContent.value = 'Error displaying content';
        }
    }

    // Update blob data
    function updateBlob(): void {
        if (!props.isEditable) return;

        try {
            // For text content types, convert displayed text back to base64
            let base64Value = '';

            if (isTextContentType(props.blobObject.contentType)) {
                // Convert text to binary and then to base64
                const bytes = new TextEncoder().encode(displayedContent.value);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                base64Value = btoa(binary);
            } else {
                // For binary content, parse the hex representation back to binary
                const hexValues = displayedContent.value.split(' ');
                const bytes = new Uint8Array(hexValues.length);
                for (let i = 0; i < hexValues.length; i++) {
                    bytes[i] = parseInt(hexValues[i], 16);
                }
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                base64Value = btoa(binary);
            }

            const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');
            const path = aasEndpoint + '/' + selectedNode.value.path + '/value';
            const content = JSON.stringify(base64Value);
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            const context = 'updating ' + props.blobObject.modelType + ' "' + props.blobObject.idShort + '"';

            // Send request to update blob
            putRequest(path, content, headers, context, false).then((response: any) => {
                if (response.success) {
                    // After successful update, fetch and dispatch updated SME
                    fetchAndDispatchSme(selectedNode.value.path, false);
                }
            });
        } catch (error) {
            console.error('Error updating blob:', error);
        }
    }

    // Clear blob data
    function clearBlob(): void {
        displayedContent.value = '';
        if (props.isEditable) {
            updateBlob();
        }
    }

    // Download blob as a file
    function downloadBlob(): void {
        if (!blobData.value || !props.blobObject.contentType) return;

        try {
            const uint8Array = new Uint8Array(blobData.value);
            const blob = new Blob([uint8Array], { type: props.blobObject.contentType });
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;

            // Set filename based on content type
            if (props.blobObject.contentType.startsWith('text/')) {
                link.download = selectedNode.value.idShort + '.txt';
            } else {
                const extension = props.blobObject.contentType.split('/')[1] || 'bin';
                link.download = selectedNode.value.idShort + '.' + extension;
            }

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Release object URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('Error downloading blob:', error);
        }
    }

    // Helper to check if content type is text-based
    function isTextContentType(contentType: string): boolean {
        return /^text\/|application\/(json|xml|javascript|x-javascript)/i.test(contentType || '');
    }
</script>
