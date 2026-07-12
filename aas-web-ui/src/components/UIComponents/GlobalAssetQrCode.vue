<template>
  <div v-if="qrCodeUrl" class="qr-container" data-testid="global-asset-qr-code">
    <div v-if="useIso61406_2" class="qr-61406-2-container">
      <div class="qr-61406-2">
        <div class="qr-61406-1-container">
          <img :alt="altText" class="qr-61406-1" :src="qrCodeUrl" :style="moduleSizeStyle">
        </div>
      </div>
    </div>

    <div v-else class="qr-61406-1-container">
      <img :alt="altText" class="qr-61406-1" :src="qrCodeUrl" :style="moduleSizeStyle">
    </div>
  </div>
</template>

<script lang="ts" setup>
  import QRCode from 'qrcode'
  import { computed, ref, watch } from 'vue'

  type IsoVariant = 'auto' | '61406-1' | '61406-2'

  const props = withDefaults(
    defineProps<{
      content: string
      altText?: string
      margin?: number
      scale?: number
      moduleSize?: number
      isoVariant?: IsoVariant
    }>(),
    {
      altText: 'Global Asset ID QR code',
      margin: 3,
      scale: 4,
      moduleSize: 4,
      isoVariant: 'auto',
    },
  )

  const qrCodeUrl = ref('')

  const normalizedContent = computed(() => String(props.content ?? '').trim())
  const useIso61406_2 = computed(() => {
    if (props.isoVariant === '61406-2') return true
    if (props.isoVariant === '61406-1') return false
    return normalizedContent.value.includes('?.')
  })
  const moduleSizeStyle = computed(() => ({
    '--module-size': String(props.moduleSize),
  }))

  watch(
    () => [props.content, props.margin, props.scale],
    () => {
      void generateQrCode()
    },
    { immediate: true },
  )

  async function generateQrCode (): Promise<void> {
    if (normalizedContent.value === '') {
      qrCodeUrl.value = ''
      return
    }

    try {
      qrCodeUrl.value = await QRCode.toDataURL(normalizedContent.value, {
        errorCorrectionLevel: 'Q',
        margin: props.margin,
        scale: props.scale,
      })
    } catch (error) {
      console.error(error)
      qrCodeUrl.value = ''
    }
  }
</script>

<style lang="css" scoped>
  .qr-container {
    margin-left: auto;
    margin-right: auto;
    width: fit-content;
  }

  .qr-61406-1-container {
    background-color: black;
    height: 100%;
    width: 100%;
  }

  .qr-61406-1 {
    height: 100%;
    width: 100%;
    display: block;
    border: calc(var(--module-size) * 1px) solid black;
    clip-path: polygon(
      0 0,
      100% 0,
      100% calc(100% - 24px),
      calc(100% - 24px) 100%,
      0 100%
    );
  }

  .qr-61406-2-container {
    height: 100%;
    width: 100%;
  }

  .qr-61406-2 {
    height: 100%;
    width: 100%;
    display: block;
    clip-path: polygon(
      0 0,
      100% 0,
      100% calc(100% - 18px),
      calc(100% - 18px) 100%,
      0 100%
    );
  }
</style>
