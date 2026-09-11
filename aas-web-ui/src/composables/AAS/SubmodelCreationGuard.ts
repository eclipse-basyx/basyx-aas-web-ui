import { useRoute } from 'vue-router'
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
import { useAASStore } from '@/store/AASDataStore'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { useNavigationStore } from '@/store/NavigationStore'

export function useSubmodelCreationGuard () {
  const route = useRoute()
  const aasStore = useAASStore()
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()
  const { fetchAasUpdateCapability } = useAASRepositoryClient()

  const checkingAccess = ref(false)

  async function canCreateSubmodel (): Promise<boolean> {
    if (route.name !== 'AASEditor' || !infrastructureStore.supportsResourceAccess?.('AASRepo')) {
      return true
    }
    if (checkingAccess.value) {
      return false
    }
    checkingAccess.value = true
    try {
      return await checkSelectedAas()
    } finally {
      checkingAccess.value = false
    }
  }

  async function checkSelectedAas (): Promise<boolean> {
    const aasId = aasStore.getSelectedAAS?.id
    const repositoryUrl = infrastructureStore.getAASRepoURL
    const infrastructureId = infrastructureStore.getSelectedInfrastructure?.id
    const allowed = aasId ? await fetchAasUpdateCapability(aasId) : undefined

    // A response for a previous selection must never authorize the current one.
    if (route.name !== 'AASEditor'
      || !infrastructureStore.supportsResourceAccess?.('AASRepo')
      || aasId !== aasStore.getSelectedAAS?.id
      || repositoryUrl !== infrastructureStore.getAASRepoURL
      || infrastructureId !== infrastructureStore.getSelectedInfrastructure?.id) {
      warn('Your selection changed while checking access. Please try again.')
      return false
    }
    if (allowed === true) {
      return true
    }

    warn(allowed === false
      ? 'You cannot add a submodel to this AAS because you do not have permission to edit it. Ask the owner for editing access.'
      : 'Editing access could not be verified. No submodel was created. Check your connection and sign-in, then try again.')
    return false
  }

  function warn (text: string): void {
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 10_000,
      color: 'warning',
      btnColor: 'buttonText',
      text,
    })
  }

  return { canCreateSubmodel, checkingAccess }
}
