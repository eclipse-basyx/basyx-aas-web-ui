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

              <span>Reload Policy List</span>
            </v-tooltip>

            <v-text-field
              v-model="searchQuery"
              clearable
              density="compact"
              hide-details
              label="Search for Policy ..."
              variant="outlined"
              @update:model-value="filterPolicyList"
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
                  <!-- Create Policy Dialog -->
                  <v-tooltip v-if="isEdcV0_12_1" location="bottom" open-delay="600">
                    <template #activator="{ props }">
                      <v-list-item prepend-icon="mdi-upload" slim v-bind="props" @click="createPolicyDialog = true">
                        <template #prepend>
                          <v-icon size="small">mdi-plus</v-icon>
                        </template>
                        Create Policy
                      </v-list-item>
                    </template>

                    <span>Create a new Policy</span>
                  </v-tooltip>

                  <v-tooltip location="bottom" open-delay="600">
                    <template #activator="{ props }">
                      <v-list-item prepend-icon="mdi-upload" slim v-bind="props" @click="createPolicyFromTemplateDialog = true">
                        <template #prepend>
                          <v-icon size="small">mdi-plus</v-icon>
                        </template>
                        Create Policy from Template
                      </v-list-item>
                    </template>

                    <span>Create a new Policy from Template</span>
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

              <!-- List of Policys -->
              <v-list
                v-if="policyList.length > 0"
                class="pa-0"
                density="compact"
                nav
              >
                <v-virtual-scroll
                  ref="virtualScrollRef"
                  class="bg-card mb-2"
                  :item-height="56"
                  :items="policyList"
                >

                  <template #default="{ item }">
                    <!-- Single Policy -->
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
                      @click="selectPolicy(item)"
                    >
                      <template #prepend>
                        <v-btn
                          class="ml-n1"
                          color="primary"
                          icon="mdi-shield-check-outline"
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
                        <!-- Policy ID -->
                        <div v-if="item['@id']" class="text-body-small">
                          <span class="font-weight-bold">{{ 'ID: ' }}</span>
                          {{ item['@id'] }}
                        </div>

                        <!-- Created At -->
                        <div v-if="item['createdAt']" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ 'Created: ' }}</span>
                          {{ new Date(item['createdAt']).toISOString() }}
                        </div>

                        <!-- Type -->
                        <div v-if="getPolicyType(item)" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ 'Type: ' }}</span>
                          {{ getPolicyType(item) + ' Policy' }}
                        </div>

                      </v-tooltip>

                      <v-list-item-title class="text-primary">
                        {{ item['@id'] }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-listItemText font-italic">
                        {{ getPolicyType(item) }}
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

                              <!-- Update Policy -->
                              <v-list-item @click="openUpdateDialog(item)">
                                <template #prepend>
                                  <v-icon size="x-small">mdi-pencil</v-icon>
                                </template>

                                <v-list-item-subtitle>Edit Policy</v-list-item-subtitle>
                              </v-list-item>

                              <!-- Delete Policy -->
                              <v-list-item @click="openDeleteDialog(item)">
                                <template #prepend>
                                  <v-icon size="x-small">mdi-delete</v-icon>
                                </template>

                                <v-list-item-subtitle>Delete Policy</v-list-item-subtitle>
                              </v-list-item>

                              <v-divider />
                              <!-- Copy Policy ID to clipboard -->
                              <v-list-item
                                @click.stop="
                                  copyToClipboard(item['@id'], 'PolicyId', copyIconAsRef)
                                "
                              >
                                <template #prepend>
                                  <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                </template>

                                <v-list-item-subtitle>Copy Policy ID</v-list-item-subtitle>
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
                title="No existing Policys"
              />
            </template>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid>

          <div v-if="!selectedPolicy || Object.keys(selectedPolicy).length === 0" class="d-flex align-center justify-center" :style="{'height': fullHeightMain}">

            <v-empty-state
              icon="mdi-gesture-tap"
              text="Please select a Policy to view"
              title="Select Policy"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>

          </div>

          <template v-else>
            <!-- View mode tabs -->
            <div class="d-flex justify-start mb-2">
              <v-btn-toggle
                v-model="selectedView"
                density="compact"
                mandatory
                rounded="lg"
                variant="outlined"
              >
                <v-btn value="tree">
                  <v-icon start>mdi-file-tree-outline</v-icon>
                  Tree
                </v-btn>

                <v-btn value="json">
                  <v-icon start>mdi-code-json</v-icon>
                  JSON
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- JSON view -->
            <pre
              v-if="selectedView === 'json'"
              class="json-content bg-surface rounded border"
              :style="{'height': fullHeightMainWithTabs}"
            >
              <code v-html="selectedPolicyJsonFormatted" />
            </pre>

            <!-- Tree view -->
            <div
              v-else
              class="rounded border overflow-y-auto pa-4"
              :style="{'height': fullHeightMainWithTabs, 'background-color': '#f5f5f5'}"
            >
              <JsonTreeView :data="selectedPolicy" />
            </div>
          </template>

        </v-container>
      </v-main>
    </v-layout>
  </v-container>

  <CreatePolicyDialog v-model="createPolicyDialog" @policy-created="onPolicyCreated" />
  <CreatePolicyFromTemplateDialog v-model="createPolicyFromTemplateDialog" @policy-created="onPolicyCreated" />

  <UpdatePolicyDialog v-model="updatePolicyDialog" :policy="policyToUpdate" @policy-updated="onPolicyUpdated" />

  <DeletePolicyDialog v-model="deletePolicyDialog" :policy="policyToDelete" @policy-deleted="onPolicyDeleted" />
</template>

<script lang="ts" setup>
  import * as Prism from 'prismjs'
  import { useTheme } from 'vuetify'
  import JsonTreeView from '@/components/UIComponents/JsonTreeView.vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import CreatePolicyDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/CreatePolicyDialog.vue'
  import CreatePolicyFromTemplateDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/CreatePolicyFromTemplateDialog.vue'
  import DeletePolicyDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/DeletePolicyDialog.vue'
  import UpdatePolicyDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/UpdatePolicyDialog.vue'
  import { type PolicyDefinition, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
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
  const { queryPolicyDefinitions } = useEdcClient()
  const { copyToClipboard } = useClipboardUtil()

  // Vuetify
  const theme = useTheme()

  // Data
  const searchQuery = ref('')
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px)') // Full height - header - tabs - footer - padding - border
  const fullHeightMainWithTabs = ref('calc(100vh - 64px - 48px - 40px - 32px - 44px - 2px)') // Full height - header - tabs - footer - padding - view toggle - border
  const selectedView = ref<'json' | 'tree'>('tree')
  const policyList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Policy data
  const policyListUnfiltered = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Policy data before filtering
  const listLoading = ref(false) // Variable to store if the AAS List is loading
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const selectedPolicy = ref({} as any)
  const selectedPolicyJson = ref<string>('')
  const selectedPolicyJsonFormatted = ref<string>('')
  const createPolicyDialog = ref(false) // Variable to store if the Create Policy Dialog should be shown
  const createPolicyFromTemplateDialog = ref(false) // Variable to store if the Create Policy from Template Dialog should be shown
  const updatePolicyDialog = ref(false) // Variable to store if the Update Policy Dialog should be shown
  const policyToUpdate = ref<any>({}) // Variable to store the policy to be updated
  const deletePolicyDialog = ref(false) // Variable to store if the Delete Policy Dialog should be shown
  const policyToDelete = ref<any>({}) // Variable to store the policy to be deleted
  const copyIcon = ref<string>('mdi-clipboard-file-outline')

  // Computed properties
  const isEdcV0_12_1 = computed(() => edcStore.getEdcType === 'Tractus-X EDC v0.12.1')
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
    () => selectedPolicy.value,
    () => {
      try {
        selectedPolicyJson.value = JSON.stringify(selectedPolicy.value)
        const formatted = formatJSON(selectedPolicyJson.value)

        // Apply syntax highlighting using Prism
        if (Prism && Prism.highlight) {
          selectedPolicyJsonFormatted.value = Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
        } else {
          selectedPolicyJsonFormatted.value = formatted
          console.warn('Prism highlighting not available')
        }
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        selectedPolicyJsonFormatted.value = selectedPolicyJson.value || ''
      }
    },
    { deep: true },
  )

  onMounted(() => {
    initialize()
  })

  onActivated(() => {
    scrollToSelectedPolicy()
  })

  async function initialize (): Promise<void> {
    listLoading.value = true

    const policies = await queryPolicyDefinitions()

    if (policies && Array.isArray(policies) && policies.length > 0) {
      const policiesSorted = policies.toSorted((policyA: any, policyB: any) => {
        // Sort Policies with respect to id
        return policyA['@id']
          > policyB['@id']
          ? 1
          : -1
      })

      policyList.value = [...policiesSorted]
      policyListUnfiltered.value = [...policiesSorted]

      if (searchQuery.value !== '')
        filterPolicyList(searchQuery.value)

      scrollToSelectedPolicy()
    }

    listLoading.value = false
  }

  async function onPolicyCreated (policyId: string): Promise<void> {
    // Reload the policy list
    await initialize()

    // Find and select the newly created policy
    const newPolicy = policyList.value.find((policy: any) => policy['@id'] === policyId)
    if (newPolicy) {
      selectedPolicy.value = newPolicy
      scrollToSelectedPolicy()
    }
  }

  function openUpdateDialog (policy: any): void {
    policyToUpdate.value = policy
    updatePolicyDialog.value = true
  }

  function openDeleteDialog (policy: any): void {
    deletePolicyDialog.value = true
    policyToDelete.value = policy
  }

  async function onPolicyUpdated (): Promise<void> {
    // Remember the currently selected policy's ID before reloading
    const previouslySelectedId = selectedPolicy.value?.['@id']

    // Reload the policy list
    await initialize()

    // Re-select the updated policy so the JSON/Tree view reflects the new data
    if (previouslySelectedId) {
      const updatedPolicy = policyList.value.find((p: any) => p['@id'] === previouslySelectedId)
      if (updatedPolicy) {
        selectedPolicy.value = updatedPolicy
      }
    }
  }

  async function onPolicyDeleted (): Promise<void> {
    // Only clear the selection if the deleted asset was the currently selected one
    if (policyToDelete.value?.['@id'] === selectedPolicy.value?.['@id']) {
      selectedPolicy.value = {}
    }
    // Reload the policy list
    await initialize()
  }

  function filterPolicyList (value: string): void {
    if (!value || value.trim() === '') {
      policyList.value = policyListUnfiltered.value
    } else {
      // Filter list of SMs (cf. AASList.vue)
      const policyListFiltered = policyListUnfiltered.value.filter(
        (policy: any) =>
          policy['@id'].toLowerCase().includes(value.toLowerCase()),
      )
      policyList.value = policyListFiltered
    }
    scrollToSelectedPolicy()
  }

  function selectPolicy (policy: any): void {
    if (isSelected(policy)) {
      selectedPolicy.value = {}
    } else {
      selectedPolicy.value = policy

      if (!selectedPolicy.value || Object.keys(selectedPolicy.value).length === 0) {
        scrollToSelectedPolicy()
      }
    }
  }

  function isSelected (policy: any): boolean {
    if (
      !selectedPolicy.value
      || Object.keys(selectedPolicy.value).length === 0
      || !selectedPolicy.value['@id']
      || !policy
      || Object.keys(policy).length === 0
      || !policy['@id']
    ) {
      return false
    }
    return selectedPolicy.value['@id'] === policy['@id']
  }

  function scrollToSelectedPolicy (): void {
    // Find the index of the selected item
    const index = policyList.value.findIndex((sm: any) => isSelected(sm))

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

  function getPolicyType (policyDefinition: PolicyDefinition): string {
    const permission = policyDefinition?.policy?.['odrl:permission'] ?? policyDefinition?.policy?.permission
    const action = permission?.['odrl:action'] ?? permission?.action
    const actionId = action?.['@id']

    if (!actionId)
      return ''

    switch (actionId) {
      case 'odrl:use':
      case 'use':
      {
        return 'Usage'
      }
      case 'odrl:access':
      case 'access':
      case 'cx-policy:access':
      {
        return 'Access'
      }
    }

    return ''
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
