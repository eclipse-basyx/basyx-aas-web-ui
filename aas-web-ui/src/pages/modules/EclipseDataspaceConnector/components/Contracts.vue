<template>
  <v-container class="pa-0 ma-0" fluid :style="{ 'height': fullHeight}">

    <v-layout :style="{ 'height': fullHeight}">
      <v-navigation-drawer
        class="leftMenu"
        color="appNavigation"
        :width="336"
      >
        <v-card color="rgba(0,0,0,0)" elevation="0">
          <v-card-title
            class="px-0 py-2 d-flex align-center"
          >

            <v-tooltip location="bottom" open-delay="600">
              <template #activator="{ props }">
                <v-btn
                  class="ma-0"
                  icon="mdi-reload"
                  v-bind="props"
                  :loading="listLoading"
                  variant="plain"
                  @click="initialize()"
                />
              </template>

              <span>Reload Contract List</span>
            </v-tooltip>

            <v-text-field
              clearable
              density="compact"
              hide-details
              label="Search for Contract ..."
              variant="outlined"
              @update:model-value="filterContractList"
            />

            <!-- Menu -->
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  class="mx-0"
                  icon="mdi-dots-vertical"
                  variant="plain"
                />
              </template>

              <v-sheet border>
                <v-list class="py-0" density="compact">
                  <!-- Create Contract Dialog -->
                  <v-tooltip location="bottom" open-delay="600">
                    <template #activator="{ props }">
                      <v-list-item prepend-icon="mdi-upload" slim v-bind="props" @click="createContractDialog = true">
                        <template #prepend>
                          <v-icon size="small">mdi-plus</v-icon>
                        </template>
                        Create Contract
                      </v-list-item>
                    </template>

                    <span>Create a new Contract</span>
                  </v-tooltip>

                </v-list>
              </v-sheet>
            </v-menu>

          </v-card-title>

          <v-divider />

          <v-card-text class="pt-0 pb-0 px-2" style="overflow-y: auto; height: calc(100svh - 64px - 48px - 40px - 64px - 3px)">

            <div v-if="listLoading">
              <v-skeleton-loader type="list-item@6" />
            </div>

            <template v-else>

              <!-- List of Contracts -->
              <v-list
                v-if="contractList.length > 0"
                class="pa-0"
                density="compact"
                nav
              >
                <v-virtual-scroll
                  ref="virtualScrollRef"
                  class="bg-card mb-2"
                  :item-height="56"
                  :items="contractList"
                >

                  <template #default="{ item }">
                    <!-- Single Contract -->
                    <v-list-item
                      :key="item['@id']"
                      :active="isSelected(item)"
                      base-color="listItem"
                      :border="isSelected(item) ? 'primary' : 'listItem thin'"
                      class="mt-2 mx-0"
                      color="primarySurface"
                      style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
                      :style="{
                        'border-color': isSelected(item)
                          ? primaryColor + ' !important'
                          : isDark
                            ? '#686868 !important'
                            : '#ABABAB !important',
                      }"
                      variant="tonal"
                      @click="selectContract(item)"
                    >
                      <template #prepend>
                        <v-btn
                          class="ml-n1"
                          color="primary"
                          icon="mdi-file-sign"
                          rel="noopener noreferrer"
                          size="x-small"
                          style="z-index: 9000"
                          target="_blank"
                          variant="plain"
                          @click.stop
                        />
                      </template>

                      <v-tooltip
                        activator="parent"
                        open-delay="600"
                        transition="slide-x-transition"
                      >
                        <!-- Contract ID -->
                        <div v-if="item['@id']" class="text-body-small">
                          <span class="font-weight-bold">{{ 'ID: ' }}</span>
                          {{ item['@id'] }}
                        </div>

                        <!-- Created At -->
                        <div v-if="item['createdAt']" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ 'Created: ' }}</span>
                          {{ new Date(item['createdAt']).toISOString() }}
                        </div>

                      </v-tooltip>

                      <v-list-item-title class="text-primary">
                        {{ item['@id'] }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-listItemText font-italic">
                        <!-- {{ getContractType(item) }} -->
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          color="error"
                          icon="mdi-network-strength-4-alert"
                          inline
                          :model-value="
                            item.status && item.status.trim() !== '' && item.status === 'offline'
                              ? true
                              : false
                          "
                          text-color="buttonText"
                        />

                        <v-menu>
                          <template #activator="{ props }">
                            <v-btn
                              color="listItemText"
                              icon
                              size="x-small"
                              variant="plain"
                              v-bind="props"
                              @click.prevent
                            >
                              <v-icon size="x-small">mdi-dots-vertical</v-icon>
                            </v-btn>
                          </template>

                          <v-sheet border>
                            <v-list class="py-0" dense density="compact" slim>

                              <!-- Delete Contract -->
                              <v-list-item @click="openDeleteDialog(item)">
                                <template #prepend>
                                  <v-icon size="x-small">mdi-delete</v-icon>
                                </template>

                                <v-list-item-subtitle>Delete Contract</v-list-item-subtitle>
                              </v-list-item>

                              <v-divider />
                              <!-- Copy Contract ID to clipboard -->
                              <v-list-item
                                @click.stop="
                                  copyToClipboard(item['@id'], 'ContractId', copyIconAsRef)
                                "
                              >
                                <template #prepend>
                                  <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                </template>

                                <v-list-item-subtitle>Copy Contract ID</v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </v-sheet>
                        </v-menu>

                      </template>

                    </v-list-item>
                  </template>

                </v-virtual-scroll>
              </v-list>

              <v-empty-state
                v-else
                class="text-divider"
                title="No existing Contracts"
              />
            </template>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid>

          <div v-if="!selectedContract || Object.keys(selectedContract).length === 0" class="d-flex align-center justify-center" :style="{'height': fullHeightMain}">

            <v-empty-state
              icon="mdi-gesture-tap"
              text="Please select a Contract to view"
              title="Select Contract"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>
          </div>

          <pre v-else class="json-content bg-surface rounded border" :style="{'height': fullHeightMain}">
            <code v-html="selectedContractJsonFormatted" />
          </pre>

        </v-container>
      </v-main>
    </v-layout>
  </v-container>

  <CreateContractDialog v-model="createContractDialog" @contract-created="onContractCreated" />
  <DeleteContractDialog v-model="deleteContractDialog" :contract="contractToDelete" @contract-deleted="onContractDeleted" />
</template>

<script lang="ts" setup>
  import * as Prism from 'prismjs'
  import { useTheme } from 'vuetify'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import CreateContractDialog from '@/pages/modules/EclipseDataspaceConnector/components/Dialogs/CreateContractDialog.vue'
  import DeleteContractDialog from '@/pages/modules/EclipseDataspaceConnector/components/Dialogs/DeleteContractDialog.vue'
  import { type ContractDefinition, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { queryContractDefinitions } = useEdcClient()
  const { copyToClipboard } = useClipboardUtil()

  // Vuetify
  const theme = useTheme()

  // Data
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px)') // Full height - header - tabs - footer - padding - border
  const contractList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Contract data
  const contractListUnfiltered = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Contract data before filtering
  const listLoading = ref(false) // Variable to store if the AAS List is loading
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const selectedContract = ref({} as any)
  const selectedContractJson = ref<string>('')
  const selectedContractJsonFormatted = ref<string>('')
  const createContractDialog = ref(false) // Variable to store if the Create Contract Dialog should be shown
  const deleteContractDialog = ref(false) // Variable to store if the Delete Contract Dialog should be shown
  const contractToDelete = ref({}) // Variable to store the contract to be deleted
  const copyIcon = ref<string>('mdi-clipboard-file-outline')

  // Computed properties
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const copyIconAsRef = computed(() => copyIcon)

  // Watchers
  watch(
    () => edcStore.getEdcConfig,
    () => {
      initialize()
    },
  )

  watch(
    () => selectedContract.value,
    () => {
      try {
        selectedContractJson.value = JSON.stringify(selectedContract.value)
        const formatted = formatJSON(selectedContractJson.value)

        // Apply syntax highlighting using Prism
        if (Prism && Prism.highlight) {
          selectedContractJsonFormatted.value = Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
        } else {
          selectedContractJsonFormatted.value = formatted
          console.warn('Prism highlighting not available')
        }
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        selectedContractJsonFormatted.value = selectedContractJson.value || ''
      }
    },
    { deep: true },
  )

  onMounted(() => {
    initialize()
  })

  onActivated(() => {
    scrollToSelectedContract()
  })

  async function initialize (): Promise<void> {
    listLoading.value = true

    const policies = await queryContractDefinitions()

    if (policies && Array.isArray(policies) && policies.length > 0) {
      const policiesSorted = policies.toSorted((contractA: any, contractB: any) => {
        // Sort Policies with respect to id
        return contractA['@id']
          > contractB['@id']
          ? 1
          : -1
      })

      contractList.value = [...policiesSorted]
      contractListUnfiltered.value = [...policiesSorted]

      scrollToSelectedContract()
    }

    listLoading.value = false
  }

  async function onContractCreated (contractId: string): Promise<void> {
    // Reload the contract list
    await initialize()

    // Find and select the newly created contract
    const newContract = contractList.value.find((contract: any) => contract['@id'] === contractId)
    if (newContract) {
      selectedContract.value = newContract
      scrollToSelectedContract()
    }
  }

  function openDeleteDialog (contract: any): void {
    deleteContractDialog.value = true
    contractToDelete.value = contract
  }

  async function onContractDeleted (): Promise<void> {
    // Reload the contract list
    selectedContract.value = {}
    await initialize()
  }

  function filterContractList (value: string): void {
    if (!value || value.trim() === '') {
      contractList.value = contractListUnfiltered.value
    } else {
      // Filter list of SMs (cf. AASList.vue)
      const contractListFiltered = contractListUnfiltered.value.filter(
        (contract: any) =>
          contract['@id'].toLowerCase().includes(value.toLowerCase()),
      )
      contractList.value = contractListFiltered
    }
    scrollToSelectedContract()
  }

  function selectContract (contract: any): void {
    if (isSelected(contract)) {
      selectedContract.value = {}
    } else {
      selectedContract.value = contract

      if (!selectedContract.value || Object.keys(selectedContract.value).length === 0) {
        scrollToSelectedContract()
      }
    }
  }

  function isSelected (contract: any): boolean {
    if (
      !selectedContract.value
      || Object.keys(selectedContract.value).length === 0
      || !selectedContract.value['@id']
      || !contract
      || Object.keys(contract).length === 0
      || !contract['@id']
    ) {
      return false
    }
    return selectedContract.value['@id'] === contract['@id']
  }

  function scrollToSelectedContract (): void {
    // Find the index of the selected item
    const index = contractList.value.findIndex((sm: any) => isSelected(sm))

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          virtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
        ) {
          // Access the scrollable container
          virtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

</script>

<style scoped>
    :deep(.token) {
        line-height: 21px;
    }

    :deep(code) {
        line-height: 21px;
    }

    .json-content {
        margin: 0;
        padding: 0 20px 0 20px;
        word-wrap: normal;
        font-size: 14px;
        line-height: 21px;
        flex-grow: 0;
        overflow: auto;
        background-color: #f5f5f5;
    }

    .json-content code {
        display: block;
    }

    :deep(.token.punctuation) {
        color: #999;
    }

    :deep(.token.property) {
        color: #905;
    }

    :deep(.token.string) {
        color: #690;
    }

    :deep(.token.number) {
        color: #07a;
    }

    :deep(.token.boolean) {
        color: #07a;
    }

    :deep(.token.null) {
        color: #999;
    }
</style>
