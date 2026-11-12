<template>
  <v-alert
    v-if="showNotice"
    class="ma-4"
    role="status"
    title="Connect a BaSyx environment"
    type="info"
    variant="tonal"
  >
    <p>
      The Web UI container does not include the backend services that provide AAS and Submodel data.
      Start a BaSyx backend using a minimal setup below, or connect to an existing environment.
    </p>

    <p v-if="infrastructureStore.getSelectedInfrastructure" class="mt-2">
      No connection to the selected environment is available. If your services are already running,
      check their endpoints, CORS settings, and sign-in requirements.
    </p>

    <p v-if="!envStore.getEndpointConfigAvailable" class="mt-2">
      Contact your deployment administrator to check the configured backend endpoints.
    </p>

    <div class="d-flex flex-wrap ga-2 mt-3">
      <v-btn
        v-if="envStore.getEndpointConfigAvailable"
        size="small"
        variant="outlined"
        @click="managementOpen = true"
      >
        Manage infrastructures
      </v-btn>

      <v-btn
        href="https://github.com/eclipse-basyx/basyx-go-components/tree/main/examples/BaSyxMinimalExample"
        rel="noopener noreferrer"
        size="small"
        target="_blank"
        variant="text"
      >
        Go minimal setup
      </v-btn>

      <v-btn
        href="https://github.com/eclipse-basyx/basyx-java-server-sdk/tree/main/examples/BaSyxMinimal"
        rel="noopener noreferrer"
        size="small"
        target="_blank"
        variant="text"
      >
        Java minimal setup
      </v-btn>
    </div>
  </v-alert>

  <InfrastructureManagement v-if="managementOpen" v-model:open="managementOpen" />
</template>

<script lang="ts" setup>
  import { useRoute } from 'vue-router'
  import { useAASStore } from '@/store/AASDataStore'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { getActiveComponentKeys } from '@/utils/InfrastructureUtils'

  const route = useRoute()
  const aasStore = useAASStore()
  const envStore = useEnvStore()
  const infrastructureStore = useInfrastructureStore()

  const managementOpen = ref(false)

  const showNotice = computed(() => {
    const dataRoutes = [
      'AASViewer', 'AASEditor', 'AASSubmodelViewer', 'AASList', 'SubmodelList',
      'SMViewer', 'SMEditor', 'ComponentVisualization', 'Visualization',
    ]
    if (
      !dataRoutes.includes(String(route.name))
      || !infrastructureStore.isInitialized
      || infrastructureStore.getIsAuthenticating
      || infrastructureStore.getIsTestingConnections
      || envStore.getSingleAas
      || envStore.getSingleSm
      || aasStore.getSelectedAAS?.id
      || aasStore.getSelectedNode?.modelType
    ) {
      return false
    }

    const infrastructure = infrastructureStore.getSelectedInfrastructure
    if (!infrastructure) {
      return true
    }

    const activeKeys = getActiveComponentKeys(infrastructure)
    // EDC infrastructures establish their connections inside the Catena-X module.
    if (activeKeys.length === 0) {
      return false
    }

    return activeKeys.every(key => {
      const component = infrastructureStore.getBasyxComponents[key]
      return !component.loading && component.connected === false
    })
  })
</script>
