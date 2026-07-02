<template>
  <div class="pa-3">
    <div class="d-flex flex-column ga-2">
      <v-select
        v-model="assetIdNameModel"
        bg-color="surface-light"
        density="compact"
        flat
        hide-details
        :items="assetIdNameSuggestions"
        label="Asset ID key"
        :menu-props="assetIdSelectMenuProps"
        variant="outlined"
        @keydown.enter.prevent="search"
      />

      <div class="d-flex align-center ga-1">
        <v-text-field
          v-model="assetIdValueModel"
          bg-color="surface-light"
          class="flex-grow-1"
          clearable
          density="compact"
          flat
          hide-details
          label="Asset ID value"
          persistent-clear
          placeholder="Search for Asset ID"
          style="min-width: 0"
          variant="outlined"
          @click:clear="clear"
          @keydown.enter.prevent="search"
        >
          <template #clear="{ props: clearProps }">
            <v-icon v-bind="clearProps" icon="mdi-close" size="18" @click.stop="clear" />
          </template>
        </v-text-field>

        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              aria-label="Search descriptors"
              class="text-buttonText"
              color="primary"
              icon="mdi-magnify"
              :loading="isLoading"
              rounded="lg"
              size="x-small"
              variant="flat"
              @click="search"
            />
          </template>

          <span>Search descriptors</span>
        </v-tooltip>

        <v-menu
          v-model="curlMenu"
          :close-on-content-click="false"
          location="bottom end"
          offset="8"
        >
          <template #activator="{ props: menuProps }">
            <v-tooltip location="bottom" open-delay="600">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="mergeProps(menuProps, tooltipProps)"
                  aria-label="Show cURL request"
                  border
                  color="surface-light"
                  icon="mdi-console-line"
                  rounded="lg"
                  size="x-small"
                  variant="flat"
                />
              </template>

              <span>Show cURL request</span>
            </v-tooltip>
          </template>

          <v-sheet
            border
            class="pa-3"
            rounded="lg"
            style="width: min(420px, calc(100vw - 32px))"
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
              <code class="text-label-small text-break" style="white-space: pre-wrap">{{ curlCommand }}</code>
            </v-sheet>
          </v-sheet>
        </v-menu>

        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              aria-label="Reload descriptors"
              border
              color="surface-light"
              icon="mdi-reload"
              :loading="isLoading"
              rounded="lg"
              size="x-small"
              variant="flat"
              @click="emit('reload')"
            />
          </template>

          <span>Reload descriptors</span>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, mergeProps, ref } from 'vue'
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
    (event: 'clear' | 'reload' | 'search'): void
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

  const assetIdSelectMenuProps = {
    origin: 'overlap',
    location: 'bottom',
  } as const

  const curlCommand = computed(() => {
    return buildShellDescriptorsCurlCommand(props.dtrUrl, props.assetIdName, props.assetIdValue)
  })

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
