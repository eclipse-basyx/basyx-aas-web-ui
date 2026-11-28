import type { ModuleNavigationRoute } from '@/types/Application'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { useRoute } from 'vue-router'
import { useAASStore } from '@/store/AASDataStore'
import { useEnvStore } from '@/store/EnvironmentStore'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { useNavigationStore } from '@/store/NavigationStore'
import { supportsInfrastructureTemplate } from '@/utils/InfrastructureUtils'

interface ModuleHandling {
  determineFilteredAndOrderedModuleRoutes: () => ModuleNavigationRoute[]
  isActiveModuleRoute: (routePath: string) => boolean
  isModuleAvailable: (moduleName: string) => boolean
  isModuleVisible: (moduleName: string) => boolean
}

export function useModuleHandling (): ModuleHandling {
  // Vue Router
  const route = useRoute()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const infrastructureStore = useInfrastructureStore()
  const envStore = useEnvStore()

  // Computed Properties
  const isMobile = computed(() => navigationStore.getIsMobile)
  const moduleRoutes = computed(() => navigationStore.getModuleRoutes) // get the module routes
  const selectedAas = computed(() => aasStore.getSelectedAAS) // get selected AAS from Store
  const selectedNode = computed(() => aasStore.getSelectedNode) // get selected node from Store
  const selectedInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure)

  function matchesMobileVisibility (moduleRoute: ModuleNavigationRoute): boolean {
    if (isMobile.value) {
      return !!moduleRoute?.meta?.isMobileModule
    }
    return !!moduleRoute?.meta?.isDesktopModule
  }

  function matchesSelectedAasRequirement (moduleRoute: ModuleNavigationRoute): boolean {
    if (!moduleRoute?.meta?.isOnlyVisibleWithSelectedAas) {
      return true
    }
    return !!selectedAas.value && Object.keys(selectedAas.value).length > 0
  }

  function matchesSelectedNodeRequirement (moduleRoute: ModuleNavigationRoute): boolean {
    if (!moduleRoute?.meta?.isOnlyVisibleWithSelectedNode) {
      return true
    }
    return !!selectedNode.value && Object.keys(selectedNode.value).length > 0
  }

  function matchesVisibleOnRoutesRequirement (
    moduleRoute: ModuleNavigationRoute,
    currentRouteName: string | undefined,
  ): boolean {
    const visibleOnRoutes = moduleRoute?.meta?.visibleOnRoutes
    if (!Array.isArray(visibleOnRoutes) || visibleOnRoutes.length === 0) {
      return true
    }
    return !!currentRouteName && visibleOnRoutes.includes(currentRouteName)
  }

  function matchesNeedsEnvVariablesRequirement (moduleRoute: ModuleNavigationRoute): boolean {
    const needsEnvVariables = moduleRoute?.meta?.needsEnvVariables
    if (!Array.isArray(needsEnvVariables) || needsEnvVariables.length === 0) {
      return true
    }
    return needsEnvVariables.every(envVariableName => envStore.isEnvVariableSet(envVariableName))
  }

  function matchesNeedsInfrastructureEndpoints (moduleRoute: ModuleNavigationRoute): boolean {
    const needsInfrastructureEndpoints = moduleRoute?.meta?.needsInfrastructureEndpoints
    if (!Array.isArray(needsInfrastructureEndpoints) || needsInfrastructureEndpoints.length === 0) {
      return true
    }
    return needsInfrastructureEndpoints.every(componentKey => infrastructureStore.isEndpointSet(componentKey))
  }

  function matchesNeedsAuthentication (moduleRoute: ModuleNavigationRoute): boolean {
    const needsAuthentication = moduleRoute?.meta?.needsAuthentication
    if (needsAuthentication && !infrastructureStore.getHasAuthenticationCredentials) {
      return false
    }
    return true
  }

  function matchesResourceAccessRequirement (moduleRoute: ModuleNavigationRoute): boolean {
    if (!moduleRoute.path.toLowerCase().endsWith('/resourceaccess')) {
      return true
    }
    return ['AASRepo', 'SubmodelRepo', 'AASRegistry', 'SubmodelRegistry', 'AASDiscovery', 'ConceptDescriptionRepo']
      .some(key => infrastructureStore.supportsResourceAccess?.(key as BaSyxComponentKey))
  }

  // A module is available if it can be opened in the current state (device, infrastructure,
  // selection, environment, authentication). Navigation-only options (isVisibleModule,
  // visibleOnRoutes) are ignored: hidden modules can still be opened via their route.
  function isModuleRouteAvailable (moduleRoute: ModuleNavigationRoute): boolean {
    return matchesMobileVisibility(moduleRoute)
      && supportsInfrastructureTemplate(
        moduleRoute?.meta?.supportedInfrastructureTemplates,
        selectedInfrastructure.value,
      )
      && matchesSelectedAasRequirement(moduleRoute)
      && matchesSelectedNodeRequirement(moduleRoute)
      && matchesNeedsEnvVariablesRequirement(moduleRoute)
      && matchesNeedsInfrastructureEndpoints(moduleRoute)
      && matchesResourceAccessRequirement(moduleRoute)
      && matchesNeedsAuthentication(moduleRoute)
  }

  // A module is visible if it is available and listed in the module navigation for the current route.
  function isModuleRouteVisible (
    moduleRoute: ModuleNavigationRoute,
    currentRouteName: string | undefined,
  ): boolean {
    if (!isModuleRouteAvailable(moduleRoute)) {
      return false
    }
    if (!matchesVisibleOnRoutesRequirement(moduleRoute, currentRouteName)) {
      return false
    }
    return (
      moduleRoute?.meta?.isVisibleModule === true
      || isActiveModuleRoute(moduleRoute.path)
    )
  }

  function getCurrentRouteName (): string | undefined {
    return typeof route.name === 'string' ? route.name : undefined
  }

  function findModuleRoute (moduleName: string): ModuleNavigationRoute | undefined {
    return moduleRoutes.value.find((moduleRoute: ModuleNavigationRoute) => moduleRoute.name === moduleName)
  }

  /**
   * Checks whether a module can be opened in the current state, e.g. before linking to it from another module.
   * Unlike {@link isModuleVisible}, hidden modules (isVisibleModule: false) and modules restricted by
   * visibleOnRoutes count as available, because their route can still be opened.
   *
   * @param moduleName - Name of the module, i.e. its file or folder name in `src/pages/modules`
   * @returns true if the module exists and all its requirements are met
   */
  function isModuleAvailable (moduleName: string): boolean {
    const moduleRoute = findModuleRoute(moduleName)
    return !!moduleRoute && isModuleRouteAvailable(moduleRoute)
  }

  /**
   * Checks whether a module is currently listed in the module navigation.
   * A visible module is always available (see {@link isModuleAvailable}).
   *
   * @param moduleName - Name of the module, i.e. its file or folder name in `src/pages/modules`
   * @returns true if the module exists, is available and is shown in the navigation for the current route
   */
  function isModuleVisible (moduleName: string): boolean {
    const moduleRoute = findModuleRoute(moduleName)
    return !!moduleRoute && isModuleRouteVisible(moduleRoute, getCurrentRouteName())
  }

  function determineFilteredAndOrderedModuleRoutes () {
    const currentRouteName = getCurrentRouteName()
    const filteredModuleRoutes = moduleRoutes.value.filter(
      (moduleRoute: ModuleNavigationRoute) => isModuleRouteVisible(moduleRoute, currentRouteName),
    )

    return filteredModuleRoutes.toSorted(
      (moduleRouteA: ModuleNavigationRoute, moduleRouteB: ModuleNavigationRoute) => {
        const moduleNameA: string = moduleRouteA?.name?.toString() || ''
        const moduleNameB: string = moduleRouteB?.name?.toString() || ''
        return moduleNameA.localeCompare(moduleNameB)
      },
    )
  }

  function isActiveModuleRoute (routePath: string): boolean {
    return route.path === routePath || route.path.startsWith(`${routePath}/`)
  }

  return { determineFilteredAndOrderedModuleRoutes, isActiveModuleRoute, isModuleAvailable, isModuleVisible }
}
