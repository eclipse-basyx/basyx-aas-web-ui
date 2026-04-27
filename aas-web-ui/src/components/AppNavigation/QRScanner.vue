<template>
  <!-- AAS selection dialog (shown after successful scan + discovery) -->
  <v-dialog v-model="showSelectionDialog" :max-width="400" persistent>
    <v-sheet rounded="lg" border>
      <v-card-title class="d-flex align-center bg-cardHeader">
        <span>Select AAS</span>
        <v-spacer />

        <v-btn icon size="small" variant="text" @click="closeSelectionDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-alert
          v-if="discoveryError"
          class="mb-4"
          density="compact"
          type="error"
        >
          {{ discoveryError }}
        </v-alert>

        <v-radio-group
          v-if="discoveredAasIds.length > 0"
          v-model="selectedAasId"
          hide-details
        >
          <v-radio
            v-for="aasId in discoveredAasIds"
            :key="aasId"
            :label="aasId"
            :value="aasId"
          />
        </v-radio-group>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancel" rounded="lg" @click="closeSelectionDialog" />

        <v-btn
          class="text-buttonText"
          color="primary"
          rounded="lg"
          text="Select"
          :disabled="!selectedAasId"
          variant="flat"
          @click="submitAasSelection"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>

  <v-dialog v-model="dialogModel" :max-width="400" persistent>
    <v-sheet rounded="lg" border>
      <v-card-title class="d-flex align-center bg-cardHeader">
        <span>Scan QR Code</span>
        <v-spacer />

        <v-btn icon size="small" variant="text" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <!-- Error message -->
        <v-alert
          v-if="errorMessage"
          class="mb-4"
          closable
          density="compact"
          type="error"
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <!-- Scanner area (always rendered for html5-qrcode to attach to) -->
        <div class="scanner-container" style="position: relative; min-height: 300px">
          <!-- Loading overlay -->
          <div
            v-if="isInitializing || isDiscovering"
            class="text-center py-8"
            style="position: absolute; width: 100%; z-index: 10"
          >
            <v-progress-circular color="primary" indeterminate />

            <p class="mt-4 text-caption">
              {{ isDiscovering ? 'Looking up AAS...' : 'Initializing camera...' }}
            </p>
          </div>
          <!-- QR reader element -->
          <div id="qr-reader" style="width: 100%; min-height: 300px" />
        </div>

        <!-- Action buttons -->
        <div v-if="!isInitializing && !isDiscovering" class="mt-4">
          <!-- Flashlight toggle button (only show when torch is available) -->
          <v-btn
            v-if="isScanning && hasTorch"
            block
            class="mb-2"
            :color="isTorchOn ? 'warning' : undefined"
            :variant="isTorchOn ? 'flat' : 'outlined'"
            @click="toggleTorch"
          >
            <v-icon start>{{ isTorchOn ? 'mdi-flashlight-off' : 'mdi-flashlight' }}</v-icon>
            {{ isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight' }}
          </v-btn>

          <!-- Camera switch button (only show when camera is active) -->
          <v-btn
            v-if="isScanning && hasCameraToggle"
            block
            class="mb-2"
            variant="outlined"
            @click="switchCamera"
          >
            <v-icon start>mdi-camera-flip</v-icon>
            Switch Camera
          </v-btn>

          <!-- File upload button -->
          <v-btn block variant="outlined" @click="triggerFileInput">
            <v-icon start>mdi-upload</v-icon>
            Upload QR Image
          </v-btn>

          <input
            ref="fileInput"
            accept="image/*"
            style="display: none"
            type="file"
            @change="handleFileUpload"
          >
        </div>
      </v-card-text>
    </v-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
  import { Html5Qrcode } from 'html5-qrcode'
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient'

  interface CameraInfo {
    id: string
    label: string
    facing: 'front' | 'back' | 'unknown'
  }

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'select-aas': [aasId: string]
  }>()

  const { getAasIds } = useAASDiscoveryClient()

  const dialogModel = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const isInitializing = ref(false)
  const isScanning = ref(false)
  const isDiscovering = ref(false)
  const errorMessage = ref('')
  const showSelectionDialog = ref(false)
  const discoveredAasIds = ref<string[]>([])
  const selectedAasId = ref('')
  const discoveryError = ref('')
  const fileInput = ref<HTMLInputElement | null>(null)
  const allCameras = ref<CameraInfo[]>([])
  const switchableCameras = ref<CameraInfo[]>([])
  const currentSwitchIndex = ref(0)
  const hasCameraToggle = ref(false)
  const hasTorch = ref(false)
  const isTorchOn = ref(false)

  let html5QrCode: Html5Qrcode | null = null
  let currentVideoTrack: MediaStreamTrack | null = null

  // Probe which deviceId the browser selects for a given facingMode.
  // This is language-independent — facingMode is a WebRTC standard constraint.
  async function probeDeviceIdForFacingMode (facingMode: 'environment' | 'user'): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facingMode } },
      })
      const track = stream.getVideoTracks()[0]
      const deviceId = track.getSettings().deviceId ?? null
      track.stop()
      return deviceId
    } catch {
      return null
    }
  }

  async function buildCameraLists (rawCameras: Array<{ id: string, label: string }>): Promise<void> {
    // Probe browser for front/back deviceIds (language-independent)
    const backDeviceId = await probeDeviceIdForFacingMode('environment')
    const frontDeviceId = await probeDeviceIdForFacingMode('user')
    const hasRecognizedFacing = backDeviceId !== null || frontDeviceId !== null

    const classified: CameraInfo[] = rawCameras.map(cam => {
      let facing: 'front' | 'back' | 'unknown' = 'unknown'
      if (cam.id === backDeviceId) facing = 'back'
      else if (cam.id === frontDeviceId) facing = 'front'
      return { id: cam.id, label: cam.label, facing }
    })
    allCameras.value = classified

    if (hasRecognizedFacing) {
      // Mobile-style: use only the probed front/back cameras for switching
      const curated: CameraInfo[] = []
      const primaryBack = classified.find(c => c.facing === 'back')
      const primaryFront = classified.find(c => c.facing === 'front')
      if (primaryBack) curated.push(primaryBack)
      if (primaryFront) curated.push(primaryFront)
      switchableCameras.value = curated
    } else {
      // Desktop-style: no facingMode support, expose all cameras
      switchableCameras.value = [...classified]
    }

    hasCameraToggle.value = switchableCameras.value.length > 1
  }

  // Watch dialog open/close to start/stop scanner
  watch(dialogModel, async isOpen => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      await nextTick()
      await startScanning()
    } else {
      await stopScanning()
      // Reset state
      errorMessage.value = ''
      currentSwitchIndex.value = 0
    }
  })

  async function startScanning (): Promise<void> {
    try {
      isInitializing.value = true
      errorMessage.value = ''

      const cameras = await Html5Qrcode.getCameras()

      if (!cameras || cameras.length === 0) {
        console.warn('[QRScanner] No cameras found')
        errorMessage.value = 'No camera found. Please use the upload option.'
        isInitializing.value = false
        hasCameraToggle.value = false
        return
      }

      await buildCameraLists(cameras)

      html5QrCode = new Html5Qrcode('qr-reader')

      // Always use deviceId for a consistent, predictable camera selection
      const selectedCamera = switchableCameras.value[currentSwitchIndex.value]
      const cameraConstraint = { deviceId: { exact: selectedCamera.id } }

      await html5QrCode.start(
        cameraConstraint,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError,
      )

      isScanning.value = true
      isInitializing.value = false

      // Check if torch/flashlight is available
      await checkTorchCapability()
    } catch (error: any) {
      console.error('[QRScanner] Error starting QR scanner:', error)

      // Provide more helpful error messages
      let message = 'Unknown error'
      if (error instanceof Error) {
        message = error.message
      } else if (typeof error === 'string') {
        message = error
      } else if (error?.message) {
        message = error.message
      }

      // Check for common issues
      if (message.includes('NotAllowedError') || message.includes('Permission')) {
        errorMessage.value = 'Camera permission denied. Please allow camera access and try again.'
      } else if (message.includes('NotFoundError') || message.includes('not found')) {
        errorMessage.value = 'No camera found on this device.'
      } else if (message.includes('NotReadableError') || message.includes('in use')) {
        errorMessage.value = 'Camera is in use by another app. Please close other apps using the camera.'
      } else if (message.includes('secure context') || message.includes('HTTPS')) {
        errorMessage.value = 'Camera requires HTTPS. Please access this page via HTTPS.'
      } else {
        errorMessage.value = `Failed to start camera: ${message}. Try using "Upload QR Image" instead.`
      }

      console.error('[QRScanner] Full error object:', JSON.stringify(error, null, 2))
      isInitializing.value = false
      isScanning.value = false
    }
  }

  async function stopScanning (): Promise<void> {
    // Turn off torch before stopping
    if (isTorchOn.value) {
      await setTorch(false)
    }

    if (html5QrCode && isScanning.value) {
      try {
        await html5QrCode.stop()
        html5QrCode.clear()
      } catch (error) {
        console.error('Error stopping QR scanner:', error)
      }
    }
    isScanning.value = false
    html5QrCode = null
    currentVideoTrack = null
    hasTorch.value = false
    isTorchOn.value = false
  }

  async function switchCamera (): Promise<void> {
    if (switchableCameras.value.length <= 1) return

    currentSwitchIndex.value = (currentSwitchIndex.value + 1) % switchableCameras.value.length

    await stopScanning()
    await startScanning()
  }

  async function checkTorchCapability (): Promise<void> {
    try {
      // Get the video element created by html5-qrcode
      const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement
      if (!videoElement?.srcObject) {
        console.warn('[QRScanner] No video stream found for torch check')
        hasTorch.value = false
        return
      }

      const stream = videoElement.srcObject as MediaStream
      const track = stream.getVideoTracks()[0]

      if (!track) {
        console.warn('[QRScanner] No video track found for torch check')
        hasTorch.value = false
        return
      }

      currentVideoTrack = track

      // Check if torch is supported
      const capabilities = track.getCapabilities() as unknown as { torch?: boolean }
      hasTorch.value = capabilities.torch === true
      // console.log('[QRScanner] Torch capability:', hasTorch.value)
    } catch (error) {
      console.error('[QRScanner] Error checking torch capability:', error)
      hasTorch.value = false
    }
  }

  async function setTorch (enabled: boolean): Promise<void> {
    if (!currentVideoTrack) {
      console.warn('[QRScanner] No video track available for torch control')
      return
    }

    try {
      await currentVideoTrack.applyConstraints({ advanced: [{ torch: enabled } as any] })
      isTorchOn.value = enabled
      // console.log('[QRScanner] Torch set to:', enabled)
    } catch (error) {
      console.error('[QRScanner] Error setting torch:', error)
      // Reset torch state if it fails
      isTorchOn.value = false
    }
  }

  async function toggleTorch (): Promise<void> {
    await setTorch(!isTorchOn.value)
  }

  // Handle visibility change (browser minimized or tab switched)
  function handleVisibilityChange (): void {
    if (document.hidden && isTorchOn.value) {
      console.warn('[QRScanner] Browser hidden, turning off torch')
      setTorch(false)
    }
  }

  async function onScanSuccess (decodedText: string): Promise<void> {
    await stopScanning()
    isDiscovering.value = true
    discoveryError.value = ''

    try {
      const aasIds = await getAasIds(decodedText)
      dialogModel.value = false

      if (aasIds.length === 0) {
        discoveryError.value = `No AAS found for asset ID: ${decodedText}`
      } else {
        discoveredAasIds.value = aasIds
        selectedAasId.value = aasIds[0]
      }
      showSelectionDialog.value = true
    } catch {
      dialogModel.value = false
      discoveryError.value = 'Failed to look up AAS. Please try again.'
      showSelectionDialog.value = true
    } finally {
      isDiscovering.value = false
    }
  }

  function onScanError (): void {
    // This is called very frequently during scanning, so we don't show these errors
    // Only log to console for debugging
    // console.debug('QR scan error:', errorMessage);
  }

  function submitAasSelection (): void {
    if (selectedAasId.value) {
      emit('select-aas', selectedAasId.value)
    }
    closeSelectionDialog()
  }

  function closeSelectionDialog (): void {
    showSelectionDialog.value = false
    discoveredAasIds.value = []
    selectedAasId.value = ''
    discoveryError.value = ''
  }

  function triggerFileInput (): void {
    fileInput.value?.click()
  }

  async function handleFileUpload (event: Event): Promise<void> {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    try {
      errorMessage.value = ''

      // Stop camera scanning if active
      if (isScanning.value) {
        await stopScanning()
      }

      // Initialize scanner if not already initialized
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('qr-reader')
      }

      // Scan the uploaded file
      const decodedText = await html5QrCode.scanFile(file, true)
      await onScanSuccess(decodedText)
    } catch (error) {
      console.error('Error scanning file:', error)
      errorMessage.value = 'Failed to scan QR code from image. Please try again.'
    } finally {
      // Reset file input
      if (target) {
        target.value = ''
      }
    }
  }

  function closeDialog (): void {
    dialogModel.value = false
  }

  // Set up visibility change listener
  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  // Cleanup on component unmount
  onUnmounted(async () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    await stopScanning()
  })
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
