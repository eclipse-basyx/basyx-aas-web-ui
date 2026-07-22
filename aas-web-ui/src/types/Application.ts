import type { BaSyxComponentKey } from '@/types/BaSyx'
import type { InfrastructureTemplate } from '@/types/Infrastructure'

export interface SnackbarType {
  status: boolean
  timeout?: number
  color?: string
  btnColor?: string
  text?: string
  baseError?: string
  extendedError?: string
  actionText?: string
  actionCallback?: () => void | Promise<void>
  /** Infrastructure that owns this notification, if it is infrastructure-specific. */
  infrastructureId?: string
  /** Category used to prevent duplicate infrastructure-specific notifications. */
  kind?: 'authentication-required' | 'access-denied'
}

export interface AutoSyncType {
  state: boolean
  interval: number
}

export interface StatusCheckType {
  state: boolean
  interval: number
}

export interface PlatformType {
  android: boolean
  chrome: boolean
  cordova: boolean
  edge: boolean
  electron: boolean
  firefox: boolean
  ios: boolean
  linux: boolean
  mac: boolean
  opera: boolean
  ssr: boolean
  touch: boolean
  win: boolean
}

export interface PluginType {
  name: string
  semanticId: string
}

export interface RegisteredQueryParamType {
  paramName: string
  semanticId: string // The semanticId of the plugin that registered this param
}

export interface ModuleNavigationRouteMeta {
  [key: string]: unknown
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
  needsEnvVariables?: Array<string>
  needsInfrastructureEndpoints?: Array<BaSyxComponentKey>
  supportedInfrastructureTemplates?: InfrastructureTemplate[]
  preserveRouteQuery?: boolean
}

export interface ModuleNavigationRoute {
  path: string
  name?: string | symbol
  meta?: ModuleNavigationRouteMeta
}
