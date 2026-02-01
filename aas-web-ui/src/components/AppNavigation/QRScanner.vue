<template>
    <v-dialog v-model="dialogModel" :max-width="400" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <span>Scan QR Code</span>
                <v-spacer></v-spacer>
                <v-btn icon size="small" variant="text" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text class="pa-4">
                <!-- Error message -->
                <v-alert
                    v-if="errorMessage"
                    type="error"
                    density="compact"
                    closable
                    class="mb-4"
                    @click:close="errorMessage = ''">
                    {{ errorMessage }}
                </v-alert>

                <!-- Scanner area (always rendered for html5-qrcode to attach to) -->
                <div class="scanner-container" style="position: relative; min-height: 300px;">
                    <!-- Loading overlay -->
                    <div v-if="isInitializing" class="text-center py-8" style="position: absolute; width: 100%; z-index: 10;">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        <p class="mt-4 text-caption">Initializing camera...</p>
                    </div>
                    <!-- QR reader element -->
                    <div id="qr-reader" style="width: 100%; min-height: 300px;"></div>
                </div>

                <!-- Success message -->
                <v-alert
                    v-if="scanSuccess"
                    type="success"
                    density="compact"
                    class="mb-4">
                    QR code scanned successfully!
                </v-alert>

                <!-- Action buttons -->
                <div v-if="!isInitializing" class="mt-4">
                    <!-- Camera switch button (only show when camera is active) -->
                    <v-btn
                        v-if="isScanning && hasCameraToggle"
                        variant="outlined"
                        block
                        class="mb-2"
                        @click="switchCamera">
                        <v-icon start>mdi-camera-flip</v-icon>
                        Switch Camera
                    </v-btn>

                    <!-- File upload button -->
                    <v-btn
                        variant="outlined"
                        block
                        :disabled="isScanning"
                        @click="triggerFileInput">
                        <v-icon start>mdi-upload</v-icon>
                        Upload QR Image
                    </v-btn>
                    <input
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="handleFileUpload" />
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Html5Qrcode } from 'html5-qrcode';

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const router = useRouter();
const route = useRoute();

const dialogModel = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
});

const isInitializing = ref(false);
const isScanning = ref(false);
const scanSuccess = ref(false);
const errorMessage = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const currentFacingMode = ref<'environment' | 'user'>('environment'); // 'environment' = back camera
const hasCameraToggle = ref(false);

let html5QrCode: Html5Qrcode | null = null;

// Watch dialog open/close to start/stop scanner
watch(dialogModel, async (isOpen) => {
    if (isOpen) {
        // Small delay to ensure DOM is ready
        await nextTick();
        await startScanning();
    } else {
        await stopScanning();
        // Reset state
        scanSuccess.value = false;
        errorMessage.value = '';
    }
});

async function startScanning(): Promise<void> {
    try {
        console.log('[QRScanner] Starting scanner initialization...');
        isInitializing.value = true;
        errorMessage.value = '';

        // Check if camera is available
        console.log('[QRScanner] Checking for available cameras...');
        const cameras = await Html5Qrcode.getCameras();
        console.log('[QRScanner] Found cameras:', cameras);

        if (!cameras || cameras.length === 0) {
            console.warn('[QRScanner] No cameras found');
            errorMessage.value = 'No camera found. Please use the upload option.';
            isInitializing.value = false;
            hasCameraToggle.value = false;
            return;
        }

        // Enable camera toggle if multiple cameras are available
        hasCameraToggle.value = cameras.length > 1;
        console.log('[QRScanner] Camera toggle enabled:', hasCameraToggle.value);

        // Initialize scanner
        console.log('[QRScanner] Initializing Html5Qrcode...');
        html5QrCode = new Html5Qrcode('qr-reader');

        // Start scanning
        console.log('[QRScanner] Starting camera with facingMode:', currentFacingMode.value);
        await html5QrCode.start(
            { facingMode: currentFacingMode.value },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            },
            onScanSuccess,
            onScanError
        );

        console.log('[QRScanner] Camera started successfully');
        isScanning.value = true;
        isInitializing.value = false;
    } catch (err) {
        console.error('[QRScanner] Error starting QR scanner:', err);
        errorMessage.value = `Failed to start camera: ${err instanceof Error ? err.message : 'Unknown error'}`;
        isInitializing.value = false;
        isScanning.value = false;
    }
}

async function stopScanning(): Promise<void> {
    if (html5QrCode && isScanning.value) {
        try {
            await html5QrCode.stop();
            html5QrCode.clear();
        } catch (err) {
            console.error('Error stopping QR scanner:', err);
        }
    }
    isScanning.value = false;
    html5QrCode = null;
}

async function switchCamera(): Promise<void> {
    // Toggle between front and back camera
    currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment';

    // Restart scanner with new camera
    await stopScanning();
    await startScanning();
}

function onScanSuccess(decodedText: string): void {
    console.log('QR Code scanned:', decodedText);

    // Show success state
    scanSuccess.value = true;

    // Update URL query parameter with the scanned asset ID
    router.push({
        path: route.path,
        query: { ...route.query, assetId: decodedText },
    });

    // Close dialog after a short delay
    setTimeout(() => {
        closeDialog();
    }, 500);
}

function onScanError(errorMessage: string): void {
    // This is called very frequently during scanning, so we don't show these errors
    // Only log to console for debugging
    // console.debug('QR scan error:', errorMessage);
}

function triggerFileInput(): void {
    fileInput.value?.click();
}

async function handleFileUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    try {
        errorMessage.value = '';

        // Stop camera scanning if active
        if (isScanning.value) {
            await stopScanning();
        }

        // Initialize scanner if not already initialized
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode('qr-reader');
        }

        // Scan the uploaded file
        const decodedText = await html5QrCode.scanFile(file, true);
        onScanSuccess(decodedText);
    } catch (err) {
        console.error('Error scanning file:', err);
        errorMessage.value = 'Failed to scan QR code from image. Please try again.';
    } finally {
        // Reset file input
        if (target) {
            target.value = '';
        }
    }
}

function closeDialog(): void {
    dialogModel.value = false;
}

// Cleanup on component unmount
onUnmounted(async () => {
    await stopScanning();
});
</script>

<style scoped>
.scanner-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 250px;
}

/* Override html5-qrcode default styles */
:deep(#qr-reader) {
    border: none !important;
}

:deep(#qr-reader video) {
    border-radius: 8px;
}

:deep(#qr-reader__dashboard_section) {
    display: none !important;
}
</style>
