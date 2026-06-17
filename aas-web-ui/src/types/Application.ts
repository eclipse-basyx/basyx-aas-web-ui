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
  preserveRouteQuery?: boolean
}

export interface ModuleNavigationRoute {
  path: string
  name?: string | symbol
  meta?: ModuleNavigationRouteMeta
}
