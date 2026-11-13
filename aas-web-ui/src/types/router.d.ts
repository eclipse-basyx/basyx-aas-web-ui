import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Backend collection a view depends on; enables setup guidance when no source for it is available. */
    backendDataSource?: 'aas' | 'submodel'
  }
}
