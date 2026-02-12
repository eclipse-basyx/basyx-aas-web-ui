# AAS Web UI Modules

This directory contains extension modules for the AAS Web UI.

Vue components added here will be automatically registered with the AAS Web UI and provided as own page via the AAS Web UI navigation.  
Modules can reference/use vue components that are located in the [components](../../components/) directory.  
This way, you can create reusable components that can be used in multiple modules.

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
