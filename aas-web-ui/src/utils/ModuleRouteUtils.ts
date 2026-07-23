import type { BaSyxComponentKey } from '@/types/BaSyx'
import type { InfrastructureTemplate } from '@/types/Infrastructure'
import type { RouteRecordRaw, RouteRecordSingleView } from 'vue-router'

export type ModuleRouteMeta = {
  name?: string
  moduleTitle?: string
  title?: string
  subtitle?: string
  isDesktopModule?: boolean
  isMobileModule?: boolean
  isVisibleModule?: boolean
  isOnlyVisibleWithSelectedAas?: boolean
  isOnlyVisibleWithSelectedNode?: boolean
  visibleOnRoutes?: Array<string>
  supportedInfrastructureTemplates?: InfrastructureTemplate[]
  preserveRouteQuery?: boolean
  needsInfrastructureEndpoints?: Array<BaSyxComponentKey>
  needsEnvVariables?: Array<string>
}

export type ModuleChildRouteDefinition = {
  path: string
  name?: string
  component: NonNullable<RouteRecordRaw['component']>
  meta?: Record<string, unknown>
}

export type ModuleRouteManifest = {
  children?: Array<ModuleChildRouteDefinition>
}

export function buildModuleRouteMeta (
  moduleName: string,
  moduleOptions: ModuleRouteMeta | undefined,
): ModuleRouteMeta {
  const isOnlyVisibleWithSelectedAas = moduleOptions?.isOnlyVisibleWithSelectedAas ?? false
  const isOnlyVisibleWithSelectedNode = moduleOptions?.isOnlyVisibleWithSelectedNode ?? false
  const preserveRouteQuery = (
    moduleOptions?.preserveRouteQuery
    || isOnlyVisibleWithSelectedAas
    || isOnlyVisibleWithSelectedNode
  )

  return {
    name: moduleName,
    title: moduleOptions?.moduleTitle || moduleName,
    subtitle: 'Module',
    isDesktopModule: moduleOptions?.isDesktopModule ?? true,
    isMobileModule: moduleOptions?.isMobileModule ?? false,
    isVisibleModule: moduleOptions?.isVisibleModule ?? true,
    isOnlyVisibleWithSelectedAas,
    isOnlyVisibleWithSelectedNode,
    visibleOnRoutes: moduleOptions?.visibleOnRoutes ?? [],
    supportedInfrastructureTemplates: moduleOptions?.supportedInfrastructureTemplates ?? [],
    needsInfrastructureEndpoints: moduleOptions?.needsInfrastructureEndpoints ?? [],
    needsEnvVariables: moduleOptions?.needsEnvVariables ?? [],
    preserveRouteQuery,
  }
}

function sanitizeChildRouteSegment (pathSegment: string): string {
  const sanitized = pathSegment
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\//g, '_')
    .replace(/[^\w-]/g, '_')
  return sanitized === '' ? 'Child' : sanitized
}

export function buildValidatedModuleChildRoutes (moduleName: string,
  parentRoutePath: string,
  parentMeta: ModuleRouteMeta,
  moduleManifest: ModuleRouteManifest | undefined): Array<RouteRecordRaw> {
  if (!moduleManifest?.children || moduleManifest.children.length === 0) {
    return []
  }

  const normalizedBasePath = parentRoutePath.replace(/^\/+|\/+$/g, '')
  const childRouteNames = new Set<string>()
  const childPaths = new Set<string>()
  const childRoutes: Array<RouteRecordRaw> = []

  for (const childRouteDefinition of moduleManifest.children) {
    const childPath = childRouteDefinition.path?.trim() || ''
    const relativeChildPath = childPath.replace(/^\/+|\/+$/g, '')

    const isEscapingNamespace
      = childPath.startsWith('/')
        || relativeChildPath === ''
        || relativeChildPath.split('/').some(segment => segment === '..' || segment === '.')

    if (isEscapingNamespace) {
      console.warn(
        `[Module Router] Ignored invalid child route "${childPath}" in module "${moduleName}". Child routes must be relative and stay below /${normalizedBasePath}/**.`,
      )
      continue
    }

    const prefixedRouteName = `${moduleName}__${
      childRouteDefinition.name?.trim() || sanitizeChildRouteSegment(relativeChildPath)
    }`

    if (childRouteNames.has(prefixedRouteName)) {
      console.warn(
        `[Module Router] Ignored duplicate child route name "${prefixedRouteName}" in module "${moduleName}".`,
      )
      continue
    }

    if (childPaths.has(relativeChildPath)) {
      console.warn(
        `[Module Router] Ignored duplicate child route path "${relativeChildPath}" in module "${moduleName}".`,
      )
      continue
    }

    childRouteNames.add(prefixedRouteName)
    childPaths.add(relativeChildPath)

    const childRoute: RouteRecordSingleView = {
      path: relativeChildPath,
      name: prefixedRouteName,
      meta: {
        ...childRouteDefinition.meta,
        parentModuleName: moduleName,
        isDesktopModule: parentMeta.isDesktopModule,
        isMobileModule: parentMeta.isMobileModule,
        isVisibleModule: parentMeta.isVisibleModule,
        isOnlyVisibleWithSelectedAas: parentMeta.isOnlyVisibleWithSelectedAas,
        isOnlyVisibleWithSelectedNode: parentMeta.isOnlyVisibleWithSelectedNode,
        visibleOnRoutes: parentMeta.visibleOnRoutes,
        supportedInfrastructureTemplates:
          childRouteDefinition.meta && Object.hasOwn(childRouteDefinition.meta, 'supportedInfrastructureTemplates')
            ? childRouteDefinition.meta.supportedInfrastructureTemplates
            : parentMeta.supportedInfrastructureTemplates,
        preserveRouteQuery:
                    childRouteDefinition.meta && Object.hasOwn(childRouteDefinition.meta, 'preserveRouteQuery')
                      ? childRouteDefinition.meta.preserveRouteQuery
                      : parentMeta.preserveRouteQuery,
        needsInfrastructureEndpoints: parentMeta.needsInfrastructureEndpoints,
        needsEnvVariables: parentMeta.needsEnvVariables,
      },
      component: childRouteDefinition.component,
    }

    childRoutes.push(childRoute as RouteRecordRaw)
  }

  return childRoutes
}
