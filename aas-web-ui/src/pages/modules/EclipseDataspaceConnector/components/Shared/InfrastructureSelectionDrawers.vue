<template>
  <v-navigation-drawer
    class="leftMenu"
    color="appNavigation"
    :width="336"
  >
    <v-card class="d-flex flex-column" color="rgba(0,0,0,0)" elevation="0" height="100%">
      <!-- Infrastructure Selection -->
      <div class="pl-2 pt-2 d-flex align-center">
        <v-select
          v-model="selectedInfrastructureId"
          density="compact"
          hide-details
          item-title="name"
          item-value="id"
          :items="selectableInfrastructures"
          label="Select AAS Infrastructure"
          no-data-text="No infrastructure with configured AAS Repository"
          variant="outlined"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="getInfrastructureTemplateDefinition(item).label">
              <template v-if="isOAuth2Secured(item)" #append>
                <v-icon size="small">mdi-lock</v-icon>
              </template>
            </v-list-item>
          </template>
        </v-select>

        <!-- Login or logout, only enabled for infrastructures secured with OAuth2 -->
        <v-tooltip location="bottom" open-delay="600" :text="authTooltip">
          <template #activator="{ props: tooltipProps }">
            <!-- The span shows the tooltip of the disabled button as well -->
            <span v-bind="tooltipProps">
              <v-btn
                :aria-label="loggedIn ? 'Logout from infrastructure' : 'Login to infrastructure'"
                class="ma-0"
                :disabled="!loginAvailable"
                :icon="loggedIn ? 'mdi-logout' : 'mdi-login'"
                :loading="loggingIn"
                variant="plain"
                @click="loggedIn ? logout(selectedInfrastructure!) : login()"
              />
            </span>
          </template>
        </v-tooltip>
      </div>

      <!-- AAS List of the selected Infrastructure -->
      <InfrastructureAasList
        :key="aasListKey"
        v-model="selectedAas"
        v-model:unavailable="aasUnavailable"
        class="flex-grow-1"
        :infrastructure="selectedInfrastructure"
      />
    </v-card>
  </v-navigation-drawer>

  <v-navigation-drawer
    color="appNavigation"
    :width="336"
  >
    <v-card class="d-flex flex-column" color="rgba(0,0,0,0)" elevation="0" height="100%">
      <!-- Selected AAS (as high as the infrastructure selection row with its 48px login button, so both lists align) -->
      <v-sheet class="mx-2 mt-2 d-flex align-center" color="transparent" height="48">
        <v-text-field
          density="compact"
          hide-details
          label="Selected AAS"
          :model-value="selectedAas ? nameToDisplay(selectedAas) : ''"
          prepend-inner-icon="custom:aasIcon"
          readonly
          variant="outlined"
        />
      </v-sheet>

      <!-- Submodel List of the selected AAS -->
      <InfrastructureSubmodelList
        v-model="selectedSubmodels"
        v-model:failed="submodelListFailed"
        :aas="selectedAas"
        :aas-unavailable="aasUnavailable"
        class="flex-grow-1"
        :infrastructure="selectedInfrastructure"
        :preselect-all="preselectAllSubmodels"
      />
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  import type { AasUnavailableReason } from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import type { InfrastructureConfig } from '@/types/Infrastructure'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useAuth } from '@/composables/Auth/useAuth'
  import InfrastructureAasList from '@/pages/modules/EclipseDataspaceConnector/components/Assets/InfrastructureAasList.vue'
  import InfrastructureSubmodelList from '@/pages/modules/EclipseDataspaceConnector/components/Assets/InfrastructureSubmodelList.vue'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { getInfrastructureTemplateDefinition, isAasSourceInfrastructure } from '@/utils/InfrastructureUtils'

  // Drawers to select an AAS infrastructure, one of its AAS and Submodels of that AAS, placed in a v-layout
  defineProps<{
    preselectAllSubmodels?: boolean // Select all Submodels of a newly selected AAS
  }>()

  const selectedInfrastructureId = defineModel<string | null>('infrastructureId', { default: null })
  const selectedAas = defineModel<any>('aas', { default: null })
  const selectedSubmodels = defineModel<Array<any>>('submodels', { default: () => [] })
  const aasUnavailable = defineModel<AasUnavailableReason | null>('aasUnavailable', { default: null }) // Set by the AAS List
  const submodelListFailed = defineModel<boolean>('submodelListFailed', { default: false }) // Set by the Submodel List

  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { nameToDisplay } = useReferableUtils()
  const { clearInfrastructureToken, loginToInfrastructure } = useAuth()

  // Data
  const loggingIn = ref(false)
  const aasListKey = ref(0) // Changed to reload the AAS List after a login or logout

  // Computed Properties
  const selectableInfrastructures = computed(() =>
    infrastructureStore.getInfrastructures.filter(infrastructure => isAasSourceInfrastructure(infrastructure)),
  )
  const selectedInfrastructure = computed<InfrastructureConfig | null>(() =>
    selectableInfrastructures.value.find(infrastructure => infrastructure.id === selectedInfrastructureId.value) ?? null,
  )
  const loginAvailable = computed(() => !!selectedInfrastructure.value && isOAuth2Secured(selectedInfrastructure.value))
  const loggedIn = computed(() =>
    loginAvailable.value && !!selectedInfrastructure.value?.token?.accessToken && selectedInfrastructure.value.isAuthenticated !== false,
  )
  const authTooltip = computed(() => {
    const name = selectedInfrastructure.value?.name
    if (!name) return 'Select an infrastructure to log in'
    if (!loginAvailable.value) {
      const securityType = selectedInfrastructure.value?.auth?.securityType
      return securityType && securityType !== 'No Authentication'
        ? `Uses preconfigured ${securityType}`
        : `No authentication configured for ${name}`
    }
    return loggedIn.value ? `Logout from ${name}` : `Login to ${name}`
  })

  // Watchers
  watch(
    () => selectedInfrastructureId.value,
    (infrastructureId, previousInfrastructureId) => {
      // Log out of the previously selected secured infrastructure when switching to another one or closing the dialog.
      // The infrastructure selected in the app keeps its login, the app uses it as well.
      const previousInfrastructure = selectableInfrastructures.value.find(infrastructure => infrastructure.id === previousInfrastructureId)
      if (previousInfrastructure && previousInfrastructure.id !== infrastructureStore.getSelectedInfrastructureId) {
        logout(previousInfrastructure)
      }
    },
  )

  // Methods
  function isOAuth2Secured (infrastructure: InfrastructureConfig): boolean {
    return infrastructure.auth?.securityType === 'OAuth2'
  }

  async function login (): Promise<void> {
    loggingIn.value = true
    // The authorization code flow redirects to the identity provider and back to the current page
    await loginToInfrastructure(selectedInfrastructure.value)
    loggingIn.value = false
    if (loggedIn.value) aasListKey.value++
  }

  // Only discards the token, the session at the identity provider is kept
  function logout (infrastructure: InfrastructureConfig): void {
    if (!isOAuth2Secured(infrastructure) || !infrastructure.token?.accessToken) return

    clearInfrastructureToken(infrastructure)
    if (infrastructure.id === selectedInfrastructureId.value) aasListKey.value++
  }
</script>
