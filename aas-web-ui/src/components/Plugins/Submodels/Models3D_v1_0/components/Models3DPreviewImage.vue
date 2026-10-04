<template>
  <v-img
    v-if="imageUrl && !failed"
    :alt="alt"
    class="h-100 w-100"
    :cover="!contain"
    :src="imageUrl"
    @error="failed = true"
  />

  <div v-else class="d-flex align-center justify-center h-100 w-100 text-subtitleText">
    <v-icon :size="iconSize">mdi-cube-outline</v-icon>
  </div>
</template>

<script lang="ts" setup>
  import type { SubmodelElementLike } from '../types'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'

  // Props
  const props = withDefaults(
    defineProps<{
      file: SubmodelElementLike | null
      alt?: string
      contain?: boolean
      iconSize?: string | number
    }>(),
    { alt: '3D model preview', contain: false, iconSize: 'large' },
  )

  // Composables
  const { valueBlob } = useSMEFile()

  // Reactive data
  const imageUrl = ref('')
  const failed = ref(false)

  // Watchers
  watch(() => props.file, loadImage, { immediate: true })

  onBeforeUnmount(releaseImage)

  // Methods
  async function loadImage (): Promise<void> {
    releaseImage()
    failed.value = false

    if (!props.file) return

    const file = props.file
    const url = await valueBlob(file)

    // The file changed while the request was running
    if (file !== props.file) {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      return
    }
    imageUrl.value = url
  }

  function releaseImage (): void {
    if (imageUrl.value.startsWith('blob:')) URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
</script>
