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
                <div class="scanner-container" style="position: relative; min-height: 300px">
                    <!-- Loading overlay -->
                    <div
                        v-if="isInitializing"
                        class="text-center py-8"
                        style="position: absolute; width: 100%; z-index: 10">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        <p class="mt-4 text-caption">Initializing camera...</p>
                    </div>
                    <!-- QR reader element -->
                    <div id="qr-reader" style="width: 100%; min-height: 300px"></div>
                </div>

                <!-- Success message -->
                <v-alert v-if="scanSuccess" type="success" density="compact" class="mb-4">
                    QR code scanned successfully!
                </v-alert>

                <!-- Action buttons -->
                <div v-if="!isInitializing" class="mt-4">
                    <!-- Flashlight toggle button (only show when torch is available) -->
                    <v-btn
                        v-if="isScanning && hasTorch"
                        :variant="isTorchOn ? 'flat' : 'outlined'"
                        :color="isTorchOn ? 'warning' : undefined"
                        block
                        class="mb-2"
                        @click="toggleTorch">
                        <v-icon start>{{ isTorchOn ? 'mdi-flashlight-off' : 'mdi-flashlight' }}</v-icon>
                        {{ isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight' }}
                    </v-btn>

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
                    <v-btn variant="outlined" block @click="triggerFileInput">
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
    import { Html5Qrcode } from 'html5-qrcode';
    import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';

    interface CameraInfo {
        id: string;
        label: string;
        facing: 'front' | 'back' | 'unknown';
    }

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
    const allCameras = ref<CameraInfo[]>([]);
    const switchableCameras = ref<CameraInfo[]>([]);
    const currentSwitchIndex = ref(0);
    const hasCameraToggle = ref(false);
    const hasTorch = ref(false);
    const isTorchOn = ref(false);

    let html5QrCode: Html5Qrcode | null = null;
    let currentVideoTrack: MediaStreamTrack | null = null;

    // Probe which deviceId the browser selects for a given facingMode.
    // This is language-independent — facingMode is a WebRTC standard constraint.
    async function probeDeviceIdForFacingMode(facingMode: 'environment' | 'user'): Promise<string | null> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: facingMode } },
            });
            const track = stream.getVideoTracks()[0];
            const deviceId = track.getSettings().deviceId ?? null;
            track.stop();
            return deviceId;
        } catch {
            return null;
        }
    }

    async function buildCameraLists(rawCameras: Array<{ id: string; label: string }>): Promise<void> {
        // Probe browser for front/back deviceIds (language-independent)
        const backDeviceId = await probeDeviceIdForFacingMode('environment');
        const frontDeviceId = await probeDeviceIdForFacingMode('user');
        const hasRecognizedFacing = backDeviceId !== null || frontDeviceId !== null;

        const classified: CameraInfo[] = rawCameras.map((cam) => {
            let facing: 'front' | 'back' | 'unknown' = 'unknown';
            if (cam.id === backDeviceId) facing = 'back';
            else if (cam.id === frontDeviceId) facing = 'front';
            return { id: cam.id, label: cam.label, facing };
        });
        allCameras.value = classified;

        if (hasRecognizedFacing) {
            // Mobile-style: use only the probed front/back cameras for switching
            const curated: CameraInfo[] = [];
            const primaryBack = classified.find((c) => c.facing === 'back');
            const primaryFront = classified.find((c) => c.facing === 'front');
            if (primaryBack) curated.push(primaryBack);
            if (primaryFront) curated.push(primaryFront);
            switchableCameras.value = curated;
        } else {
            // Desktop-style: no facingMode support, expose all cameras
            switchableCameras.value = [...classified];
        }

        hasCameraToggle.value = switchableCameras.value.length > 1;
    }

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
            currentSwitchIndex.value = 0;
        }
    });

    async function startScanning(): Promise<void> {
        try {
            isInitializing.value = true;
            errorMessage.value = '';

            const cameras = await Html5Qrcode.getCameras();

            if (!cameras || cameras.length === 0) {
                console.warn('[QRScanner] No cameras found');
                errorMessage.value = 'No camera found. Please use the upload option.';
                isInitializing.value = false;
                hasCameraToggle.value = false;
                return;
            }

            await buildCameraLists(cameras);

            html5QrCode = new Html5Qrcode('qr-reader');

            // Always use deviceId for a consistent, predictable camera selection
            const selectedCamera = switchableCameras.value[currentSwitchIndex.value];
            const cameraConstraint = { deviceId: { exact: selectedCamera.id } };

            await html5QrCode.start(
                cameraConstraint,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onScanSuccess,
                onScanError
            );

            isScanning.value = true;
            isInitializing.value = false;

            // Check if torch/flashlight is available
            await checkTorchCapability();
        } catch (err: any) {
            console.error('[QRScanner] Error starting QR scanner:', err);

            // Provide more helpful error messages
            let message = 'Unknown error';
            if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === 'string') {
                message = err;
            } else if (err?.message) {
                message = err.message;
            }

            // Check for common issues
            if (message.includes('NotAllowedError') || message.includes('Permission')) {
                errorMessage.value = 'Camera permission denied. Please allow camera access and try again.';
            } else if (message.includes('NotFoundError') || message.includes('not found')) {
                errorMessage.value = 'No camera found on this device.';
            } else if (message.includes('NotReadableError') || message.includes('in use')) {
                errorMessage.value = 'Camera is in use by another app. Please close other apps using the camera.';
            } else if (message.includes('secure context') || message.includes('HTTPS')) {
                errorMessage.value = 'Camera requires HTTPS. Please access this page via HTTPS.';
            } else {
                errorMessage.value = `Failed to start camera: ${message}. Try using "Upload QR Image" instead.`;
            }

            console.error('[QRScanner] Full error object:', JSON.stringify(err, null, 2));
            isInitializing.value = false;
            isScanning.value = false;
        }
    }

    async function stopScanning(): Promise<void> {
        // Turn off torch before stopping
        if (isTorchOn.value) {
            await setTorch(false);
        }

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
        currentVideoTrack = null;
        hasTorch.value = false;
        isTorchOn.value = false;
    }

    async function switchCamera(): Promise<void> {
        if (switchableCameras.value.length <= 1) return;

        currentSwitchIndex.value = (currentSwitchIndex.value + 1) % switchableCameras.value.length;

        await stopScanning();
        await startScanning();
    }

    async function checkTorchCapability(): Promise<void> {
        try {
            // Get the video element created by html5-qrcode
            const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
            if (!videoElement?.srcObject) {
                console.log('[QRScanner] No video stream found for torch check');
                hasTorch.value = false;
                return;
            }

            const stream = videoElement.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];

            if (!track) {
                console.log('[QRScanner] No video track found for torch check');
                hasTorch.value = false;
                return;
            }

            currentVideoTrack = track;

            // Check if torch is supported
            const capabilities = track.getCapabilities() as unknown as { torch?: boolean };
            hasTorch.value = capabilities.torch === true;
            console.log('[QRScanner] Torch capability:', hasTorch.value);
        } catch (err) {
            console.error('[QRScanner] Error checking torch capability:', err);
            hasTorch.value = false;
        }
    }

    async function setTorch(enabled: boolean): Promise<void> {
        if (!currentVideoTrack) {
            console.warn('[QRScanner] No video track available for torch control');
            return;
        }

        try {
            await currentVideoTrack.applyConstraints({ advanced: [{ torch: enabled } as any] });
            isTorchOn.value = enabled;
            console.log('[QRScanner] Torch set to:', enabled);
        } catch (err) {
            console.error('[QRScanner] Error setting torch:', err);
            // Reset torch state if it fails
            isTorchOn.value = false;
        }
    }

    async function toggleTorch(): Promise<void> {
        await setTorch(!isTorchOn.value);
    }

    // Handle visibility change (browser minimized or tab switched)
    function handleVisibilityChange(): void {
        if (document.hidden && isTorchOn.value) {
            console.log('[QRScanner] Browser hidden, turning off torch');
            setTorch(false);
        }
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

    function onScanError(): void {
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

    // Set up visibility change listener
    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    // Cleanup on component unmount
    onUnmounted(async () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
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
