# AAS Web UI Modules

This directory contains extension modules for the AAS Web UI.

Vue components added here will be automatically registered with the AAS Web UI and provided as own page via the AAS Web UI navigation.  
Modules can reference/use vue components that are located in the [components](../../components/) directory.  
This way, you can create reusable components that can be used in multiple modules.

## Module Visibility

Modules can limit themselves to specific infrastructure templates by adding
`supportedInfrastructureTemplates` to `defineOptions`. This setting is optional; when it is omitted or
empty, the module is available for all infrastructure templates.

```ts
defineOptions({
    moduleTitle: 'My Module',
    supportedInfrastructureTemplates: ['full', 'mono-repo', 'mono-all'],
});
```

## Linking to Other Modules

Before a module offers a link to another module, it can check that module with `useModuleHandling()`:

- `isModuleAvailable(moduleName)`: the module exists and all its requirements are met in the current state
  (device, infrastructure template, selected AAS or node, env variables, infrastructure endpoints, resource access,
  authentication). The router does not enforce all of these requirements, so a module that is not available may still
  be reachable by its URL. Hidden modules (`isVisibleModule: false`) and modules restricted by `visibleOnRoutes` count
  as available, because their route can be opened.
- `isModuleVisible(moduleName)`: the module is available and listed in the module navigation on the current route.
- `getModuleRouteLocation(moduleName)`: the route location for a link to the module, or `undefined` if the module is
  not available. For modules with `preserveRouteQuery`, it carries the current URL query plus the `aas` and `path`
  the router remembered, which the router does not restore for module routes.

`moduleName` is the module's file or folder name in this directory, or `<ModuleName>__<ChildName>` for one of its
nested routes (see below). Wrap the calls in `computed` to keep them up to date:

```ts
const { getModuleRouteLocation } = useModuleHandling();
const catenaXplorerLink = computed(() => getModuleRouteLocation('CatenaXplorer'));
```

```vue
<v-btn v-if="catenaXplorerLink" :to="catenaXplorerLink">Open CatenaXplorer</v-btn>
```

The [Module Check](ModuleCheck.vue) module lists the availability and visibility of all `Test*` modules.

## Optional Nested Module Routes

Recommended structure for modules with nested routes:

- Module entry: `src/pages/modules/MyModule/index.vue`
- Route manifest: `src/pages/modules/MyModule/routes.ts`

Backward compatible fallback (still supported):

- Module entry: `src/pages/modules/MyModule.vue`
- Route manifest: `src/pages/modules/MyModule.routes.ts`

Example manifest:

```ts
export default {
    children: [
        {
            path: 'technical-data',
            name: 'TechnicalData',
            component: () => import('@/pages/modules/MyModule/TechnicalData.vue'),
        },
    ],
};
```

Rules:

- Child paths must be relative (no leading `/`) and stay inside `/modules/<module-name>/**`.
- Child route names are automatically prefixed with `<ModuleName>__` to avoid collisions.
- Child routes inherit module visibility/platform/query meta by default.
- Existing modules without a `.routes.ts` file continue to work unchanged.
