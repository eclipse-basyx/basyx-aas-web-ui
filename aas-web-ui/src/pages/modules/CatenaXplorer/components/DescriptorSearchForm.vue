<template>
  <div class="pa-3">
    <v-text-field
      v-model="assetIdValueModel"
      bg-color="surface-light"
      class="asset-id-search-field"
      clearable
      density="compact"
      flat
      hide-details
      label="Search asset ID"
      persistent-clear
      persistent-placeholder
      placeholder="Search asset ID"
      rounded="lg"
      variant="outlined"
      @click:clear="clear"
      @keydown.enter.prevent="search"
    >
      <template #prepend-inner>
        <v-select
          v-model="assetIdNameModel"
          aria-label="Asset ID key"
          bg-color="surface-light"
          class="asset-id-key-select ms-n3"
          density="compact"
          flat
          hide-details
          :items="assetIdNameSuggestions"
          :menu-props="assetIdSelectMenuProps"
          single-line
          variant="solo"
          @click.stop
          @keydown.enter.prevent="search"
          @mousedown.stop
        />

        <v-divider class="asset-id-key-divider mx-1" vertical />
      </template>

      <template #append-inner>
        <v-menu
          v-model="curlMenu"
          :close-on-content-click="false"
          location="bottom"
          :open-on-click="false"
          open-on-hover
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              aria-label="Search descriptors"
              class="search-action-button text-buttonText"
              color="primary"
              icon="mdi-magnify"
              :loading="isLoading"
              rounded="lg"
              size="x-small"
              variant="flat"
              @click.stop="search"
            />
          </template>

          <v-sheet
            border
            class="curl-preview pa-3"
            rounded="lg"
          >
            <div class="d-flex align-center justify-space-between ga-2">
              <div class="text-subtitle-2">Request as cURL</div>

              <v-tooltip location="bottom" open-delay="600">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    aria-label="Copy cURL request"
                    :icon="copyCurlIcon"
                    size="small"
                    variant="text"
                    @click.stop="copyCurlCommand"
                  />
                </template>

                <span>Copy cURL</span>
              </v-tooltip>
            </div>

            <v-sheet class="pa-2 mt-2" color="surface-light" rounded="lg">
              <code class="curl-preview__code text-label-small text-break">{{ curlCommand }}</code>
            </v-sheet>
          </v-sheet>
        </v-menu>
      </template>

      <template #clear="{ props: clearProps }">
        <v-icon v-bind="clearProps" icon="mdi-close" size="18" @click.stop="clear" />
      </template>
    </v-text-field>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { buildShellDescriptorsCurlCommand } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  const props = defineProps<{
    assetIdName: string
    assetIdNameSuggestions: string[]
    assetIdValue: string
    dtrUrl: string
    isLoading: boolean
  }>()

  const emit = defineEmits<{
    (event: 'clear' | 'search'): void
    (event: 'update:asset-id-name' | 'update:asset-id-value', value: string): void
  }>()

  const { copyToClipboard } = useClipboardUtil()
  const curlMenu = ref(false)
  const copyCurlIcon = ref('mdi-clipboard-file-outline')
  const copyCurlIconAsRef = computed(() => copyCurlIcon)

  const assetIdNameModel = computed({
    get: () => props.assetIdName,
    set: value => emit('update:asset-id-name', value),
  })

  const assetIdValueModel = computed({
    get: () => props.assetIdValue,
    set: value => emit('update:asset-id-value', value ?? ''),
  })

  const curlCommand = computed(() => {
    return buildShellDescriptorsCurlCommand(props.dtrUrl, props.assetIdName, props.assetIdValue)
  })

  const assetIdSelectMenuProps = {
    origin: 'overlap',
    location: 'top',
  } as const

  function search (): void {
    emit('search')
  }

  function clear (): void {
    emit('clear')
  }

  function copyCurlCommand (): void {
    copyToClipboard(curlCommand.value, 'cURL request', copyCurlIconAsRef.value)
  }
</script>

<style scoped>
.asset-id-key-select {
  width: 164px;
}

.asset-id-search-field > :deep(.v-input__control > .v-field) {
  padding-inline-end: 0;
}

.asset-id-search-field > :deep(.v-input__control > .v-field > .v-field__append-inner) {
  padding-inline-end: 4px;
}

.asset-id-key-divider {
  align-self: stretch;
  margin-bottom: 8px;
  margin-top: 8px;
}

.curl-preview {
  width: min(420px, calc(100vw - 32px));
}

.curl-preview__code {
  white-space: pre-wrap;
}
</style>
