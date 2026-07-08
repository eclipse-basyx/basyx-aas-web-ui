<template>
  <v-sheet border class="pa-2 pa-md-4 mb-3 mb-md-4" rounded="lg">
    <div class="d-flex flex-column flex-md-row align-stretch align-md-center ga-2 ga-md-3">
      <div class="d-none d-md-block" style="min-width: min(100%, 280px)">
        <div class="text-h5 font-weight-medium">CatenaXplorer</div>
        <div class="text-body-small text-medium-emphasis text-break">{{ dtrUrlToDisplay }}</div>
      </div>

      <div class="d-flex align-center ga-1 ga-md-2 flex-grow-1" style="min-width: 0">
        <v-text-field
          v-model="assetIdValueModel"
          bg-color="surface-light"
          class="flex-grow-1"
          clearable
          density="compact"
          flat
          hide-details
          label="Search specific asset ID"
          persistent-clear
          persistent-placeholder
          placeholder="Search for Asset ID"
          rounded="lg"
          single-line
          style="min-width: 0"
          variant="outlined"
          @click:clear="clear"
          @keydown.enter.prevent="search"
        >
          <template #append-inner>
            <div class="d-flex align-center ga-1">

              <v-menu
                v-model="curlMenu"
                :close-on-content-click="false"
                location="bottom end"
                offset="8"
                :open-on-click="false"
                open-on-hover
              >
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    icon="mdi-magnify"
                    :loading="isLoading"
                    size="small"
                    variant="text"
                    @click.stop="search"
                  />
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

              <v-divider inset vertical />

              <v-select
                v-model="assetIdNameModel"
                bg-color="surface-light"
                class="me-n3"
                density="compact"
                flat
                hide-details
                :items="assetIdNameSuggestions"
                :menu-props="assetIdSelectMenuProps"
                single-line
                style="width: clamp(112px, 32vw, 210px)"
                variant="solo"
                @click.stop
                @keydown.enter.prevent="search"
                @mousedown.stop
              />
            </div>
          </template>

          <template #clear="{ props: clearProps }">
            <v-icon v-bind="clearProps" icon="mdi-close" size="18" @click.stop="clear" />
          </template>
        </v-text-field>

        <v-tooltip v-if="showDescriptorListButton" location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-badge
              :content="descriptorCount"
              :model-value="descriptorCount > 0"
              offset-x="2"
              offset-y="2"
            >
              <v-btn
                v-bind="tooltipProps"
                icon="mdi-format-list-bulleted"
                variant="text"
                @click="emit('open-descriptor-list')"
              />
            </v-badge>
          </template>

          <span>Show descriptors</span>
        </v-tooltip>

        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon="mdi-reload"
              :loading="isLoading"
              variant="text"
              @click="emit('reload')"
            />
          </template>

          <span>Reload descriptors</span>
        </v-tooltip>
      </div>
    </div>

    <v-alert
      v-if="inlineError"
      class="mt-3"
      density="comfortable"
      icon="mdi-alert-circle-outline"
      :text="inlineError"
      type="warning"
      variant="tonal"
    />

    <v-progress-linear
      v-if="isLoading"
      class="mt-3"
      color="primary"
      height="2"
      indeterminate
    />
  </v-sheet>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { buildShellDescriptorsCurlCommand } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  const props = withDefaults(
    defineProps<{
      assetIdName: string
      assetIdNameSuggestions: string[]
      assetIdValue: string
      descriptorCount?: number
      dtrUrl: string
      dtrUrlToDisplay: string
      inlineError: string
      isLoading: boolean
      showDescriptorListButton?: boolean
    }>(),
    {
      descriptorCount: 0,
      showDescriptorListButton: false,
    },
  )

  const emit = defineEmits<{
    (event: 'clear' | 'open-descriptor-list' | 'reload' | 'search'): void
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
    location: 'top',
  } as const

  const curlCommand = computed(() => {
    return buildShellDescriptorsCurlCommand(props.dtrUrl, props.assetIdName, props.assetIdValue)
  })

  function search (): void {
    emit('search')
  }

  function copyCurlCommand (): void {
    copyToClipboard(curlCommand.value, 'cURL request', copyCurlIconAsRef.value)
  }

  function clear (): void {
    emit('clear')
  }
</script>
