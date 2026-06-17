import type { ModuleNavigationRoute } from '@/types/Application'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAASStore } from '@/store/AASDataStore'
import { useNavigationStore } from '@/store/NavigationStore'

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

  // Computed Properties
  const isMobile = computed(() => navigationStore.getIsMobile)
  const moduleRoutes = computed(() => navigationStore.getModuleRoutes) // get the module routes
  const selectedAas = computed(() => aasStore.getSelectedAAS) // get selected AAS from Store
  const selectedNode = computed(() => aasStore.getSelectedNode) // get selected node from Store

  function determineFilteredAndOrderedModuleRoutes () {
    const currentRouteName = typeof route.name === 'string' ? route.name : undefined
    const filteredModuleRoutes = moduleRoutes.value.filter(
      (moduleRoute: ModuleNavigationRoute) => {
        if (isMobile.value && !moduleRoute?.meta?.isMobileModule) {
          return false
        }
        if (!isMobile.value && !moduleRoute?.meta?.isDesktopModule) {
          return false
        }
        if (
          moduleRoute?.meta?.isOnlyVisibleWithSelectedAas
          && (!selectedAas.value || Object.keys(selectedAas.value).length === 0)
        ) {
          return false
        }
        if (
          moduleRoute?.meta?.isOnlyVisibleWithSelectedNode
          && (!selectedNode.value || Object.keys(selectedNode.value).length === 0)
        ) {
          return false
        }
        if (
          moduleRoute?.meta?.visibleOnRoutes
          && Array.isArray(moduleRoute.meta.visibleOnRoutes)
          && moduleRoute.meta.visibleOnRoutes.length > 0
          && (!currentRouteName || !moduleRoute.meta.visibleOnRoutes.includes(currentRouteName))
        ) {
          return false
        }
        return (
          moduleRoute?.meta?.isVisibleModule === true
          || isActiveModuleRoute(moduleRoute.path)
        )
      },
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
