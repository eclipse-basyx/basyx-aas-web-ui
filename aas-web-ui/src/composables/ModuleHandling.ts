import type { ModuleNavigationRoute } from '@/types/Application'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAASStore } from '@/store/AASDataStore'
import { useEnvStore } from '@/store/EnvironmentStore'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { useNavigationStore } from '@/store/NavigationStore'
import { supportsInfrastructureTemplate } from '@/utils/InfrastructureUtils'

interface ModuleHandling {
  determineFilteredAndOrderedModuleRoutes: () => ModuleNavigationRoute[]
  isActiveModuleRoute: (routePath: string) => boolean
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

  function isModuleRouteVisible (
    moduleRoute: ModuleNavigationRoute,
    currentRouteName: string | undefined,
  ): boolean {
    if (!matchesMobileVisibility(moduleRoute)) {
      return false
    }
    if (
      !supportsInfrastructureTemplate(
        moduleRoute?.meta?.supportedInfrastructureTemplates,
        selectedInfrastructure.value,
      )
    ) {
      return false
    }
    if (!matchesSelectedAasRequirement(moduleRoute)) {
      return false
    }
    if (!matchesSelectedNodeRequirement(moduleRoute)) {
      return false
    }
    if (!matchesVisibleOnRoutesRequirement(moduleRoute, currentRouteName)) {
      return false
    }
    if (!matchesNeedsEnvVariablesRequirement(moduleRoute)) {
      return false
    }
    if (!matchesNeedsInfrastructureEndpoints(moduleRoute)) {
      return false
    }
    return (
      moduleRoute?.meta?.isVisibleModule === true
      || isActiveModuleRoute(moduleRoute.path)
    )
  }

  function determineFilteredAndOrderedModuleRoutes () {
    const currentRouteName = typeof route.name === 'string' ? route.name : undefined
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

  return { determineFilteredAndOrderedModuleRoutes, isActiveModuleRoute }
}
