# Keyboard Shortcuts System

This directory contains the keyboard shortcut system for the BaSyx AAS Web UI. The system supports global shortcuts (available on all pages) and route-specific shortcuts (only available on certain pages).

## Architecture

### Files Overview

- **`useShortcutManager.ts`** - Central keyboard event dispatcher with scope management
- **`useShortcutDefinitions.ts`** - Global shortcut definitions available across all pages
- **`useRouteShortcuts.ts`** - Route-specific shortcut definitions that extend global shortcuts
- **`useGlobalShortcuts.ts`** - Registers all shortcuts (global + route-specific) with the event manager

### How It Works

1. The shortcut manager listens for keyboard events at the global level
2. When a key combination is pressed, it dispatches to registered handlers based on scope
3. Route-specific shortcuts are checked first, then global shortcuts
4. Shortcuts are displayed in the Command Palette (`CommandPalette.vue`)

## Shortcut Definition Structure

```typescript
interface ShortcutDefinition {
    id: string;                    // Unique identifier
    title: string;                 // Display title
    description: string;           // Description shown in command palette
    prependIcon: string;          // Vuetify icon (e.g., 'mdi-home')
    category: string;             // Category for grouping (e.g., 'Global Shortcuts', 'AAS Viewer Shortcuts')
    keys: {
        mac: string;              // Mac key combination (e.g., 'cmd+shift+h')
        windows: string;          // Windows key combination (e.g., 'ctrl+shift+h')
    };
    handler: () => void;          // Function to execute when shortcut is triggered
}
```

## Adding Global Shortcuts

Global shortcuts are available on all pages. Define them in `useShortcutDefinitions.ts`:

```typescript
// Example: Add a new global shortcut
{
    id: 'settings',
    title: 'Open Settings',
    description: 'Navigate to settings page',
    prependIcon: 'mdi-cog',
    category: 'Global Shortcuts',
    keys: {
        mac: 'cmd+,',
        windows: 'ctrl+,'
    },
    handler: () => {
        router.push({ name: 'Settings' });
    }
}
```

**Important:** All global shortcuts must use the category `'Global Shortcuts'` to ensure they appear together in the Command Palette.

## Adding Route-Specific Shortcuts

Route-specific shortcuts are only visible and active when on a particular page. Define them in `useRouteShortcuts.ts`:

### Step 1: Add Shortcut Definition

```typescript
// Example: Add shortcuts for the SubmodelEditor page
if (currentRoute === 'SMEditor') {
    const envStore = useEnvStore();
    
    routeShortcuts.push({
        id: 'save-submodel',
        title: 'Save Submodel',
        description: 'Save the current submodel',
        prependIcon: 'mdi-content-save',
        category: 'SM Editor Shortcuts',
        keys: {
            mac: 'cmd+s',
            windows: 'ctrl+s'
        },
        handler: () => {
            // Implement save logic
            console.log('Saving submodel...');
        }
    });
}
```

**Important:** The `category` field should follow the format `'<Route Name> Shortcuts'` where the route name is human-readable (e.g., `'AAS Viewer Shortcuts'`, `'SM Editor Shortcuts'`). This ensures shortcuts are grouped under their respective page sections in the Command Palette with proper subheaders.

### Step 2: Ensure Route Name Matches

The route name must match the name defined in your router configuration (`router.ts`). For example:

```typescript
{
    path: '/submodelelement-editor',
    name: 'SMEditor',  // This is the route name to use
    component: () => import('@/pages/SMEditor.vue')
}
```

## Adding Module-Specific Shortcuts

Modules (pages in `@/pages/modules/`) can define their own shortcuts without modifying core application code. This is perfect for keeping module functionality self-contained.

### How to Add Shortcuts to a Module

Add a second `<script>` block to your module file that exports a `shortcuts` function:

```typescript
<script setup lang="ts">
    // Your regular component setup code
    import { ref } from 'vue';
    
    const myData = ref('');
    // ... component logic
</script>

<script lang="ts">
    import type { ModuleShortcutDefinitions } from '@/composables/Shortcuts/useRouteShortcuts';

    // Module shortcuts - automatically loaded when module route is active
    export const shortcuts: ModuleShortcutDefinitions = ({ route, navigationStore }) => [
        {
            id: 'my-module-action',
            title: 'My Action',
            description: 'Perform a module-specific action',
            prependIcon: 'mdi-cog',
            category: 'My Module Shortcuts',  // Will appear as a subheader
            keys: {
                mac: 'cmd+m',
                windows: 'ctrl+m'
            },
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                // Your action logic here
                console.log('Module shortcut triggered!');
            }
        }
    ];
</script>
```

### Available Parameters

The shortcuts function receives an object with:
- `route` - Current Vue Router route object
- `navigationStore` - Access to navigation store methods
- Any other stores can be imported and used within the function

### Example: AasImporter Module

```typescript
<script lang="ts">
    import type { ModuleShortcutDefinitions } from '@/composables/Shortcuts/useRouteShortcuts';

    export const shortcuts: ModuleShortcutDefinitions = () => [
        {
            id: 'aas-importer-clear',
            title: 'Clear Input',
            description: 'Clear the asset ID input field',
            prependIcon: 'mdi-eraser',
            category: 'AAS Importer Shortcuts',
            keys: {
                mac: 'cmd+shift+backspace',
                windows: 'ctrl+shift+backspace'
            },
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                // Clear the input
                const input = document.querySelector('input') as HTMLInputElement;
                if (input) input.value = '';
            }
        }
    ];
</script>
```

**Important Notes:**
- Module shortcuts are only active when the module route is active
- Shortcuts are cached for performance
- No core application code changes needed
- Category should be `'<Module Name> Shortcuts'` for consistency

## Key Combination Format

Key combinations are strings with modifiers and keys separated by `+`:

- **Modifiers**: `cmd`, `ctrl`, `alt`, `shift`
- **Keys**: Any letter, number, or special key name

### Examples

```typescript
// Single key with modifier
'cmd+k'          // Command + K (Mac) or Ctrl + K (Windows)

// Multiple modifiers
'cmd+shift+h'    // Command + Shift + H

// Letter keys
'cmd+s'          // Command + S (save)

// Special keys
'cmd+enter'      // Command + Enter
'escape'         // Escape key alone
```

### Platform Differences

Always provide both `mac` and `windows` key combinations:

```typescript
keys: {
    mac: 'cmd+s',      // Uses Command key on Mac
    windows: 'ctrl+s'  // Uses Control key on Windows
}
```

## Complete Example: Adding Shortcuts to a New Page

Let's say you're creating a new "Dashboard" page and want to add shortcuts for it.

### 1. Define the route in `router.ts`:

```typescript
{
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue')
}
```

### 2. Add shortcuts in `useRouteShortcuts.ts`:

```typescript
// Dashboard specific shortcuts
if (currentRoute === 'Dashboard') {
    const aasStore = useAASStore();
    
    routeShortcuts.push(
        {
            id: 'refresh-dashboard',
            title: 'Refresh Dashboard',
            description: 'Reload dashboard data',
            prependIcon: 'mdi-refresh',
            category: 'Dashboard Shortcuts',
            keys: {
                mac: 'cmd+r',
                windows: 'ctrl+r'
            },
            handler: () => {
                // Refresh logic
                window.location.reload();
            }
        },
        {
            id: 'toggle-view',
            title: 'Toggle View',
            description: 'Switch between grid and list view',
            prependIcon: 'mdi-view-dashboard',
            category: 'Dashboard Shortcuts',
            keys: {
                mac: 'cmd+shift+v',
                windows: 'ctrl+shift+v'
            },
            handler: () => {
                // Toggle view logic
                console.log('Toggling view...');
            }
        }
    );
}
```

### 3. Test your shortcuts:

1. Navigate to your Dashboard page
2. Press `Cmd+K` (or `Ctrl+K` on Windows) to open the Command Palette
3. You should see your Dashboard-specific shortcuts along with global shortcuts

## Best Practices

### 1. Avoid Key Conflicts

- Check existing shortcuts before adding new ones
- Don't override browser shortcuts (e.g., `Cmd+T` for new tab)
- Be consistent with platform conventions

### 2. Use Meaningful Icons

Choose Vuetify Material Design Icons that match the action:

- `mdi-refresh` - Refresh/reload actions
- `mdi-content-save` - Save actions
- `mdi-delete` - Delete actions
- `mdi-pencil` - Edit actions
- Browse all icons: [Material Design Icons](https://pictogrammers.com/library/mdi/)

### 3. Clear Descriptions

Write concise, action-oriented descriptions:

- ✅ "Refresh AAS data from server"
- ❌ "This will refresh the data"

### 4. Handle Context Properly

Ensure your shortcut handler has access to necessary context:

```typescript
// ✅ Good: Access store data within handler
handler: () => {
    const selectedAAS = aasStore.getSelectedAAS;
    if (selectedAAS) {
        copyToClipboard(selectedAAS.id);
    }
}

// ❌ Bad: Trying to access undefined context
handler: () => {
    copyToClipboard(selectedAAS.id); // selectedAAS not defined
}
```

### 5. Prevent Default Behavior

The shortcut system automatically prevents default browser behavior and stops propagation, but be aware of potential conflicts.

## Debugging

If your shortcuts aren't working:

1. **Check the console logs** - The system logs when shortcuts are registered
2. **Verify route name** - Ensure the route name matches exactly (case-sensitive)
3. **Check the Command Palette** - Open it to see if your shortcut appears
4. **Test key combination** - Make sure the keys aren't captured by the browser first

## Related Components

- **`CommandPalette.vue`** - UI component that displays all shortcuts
- **`AppNavigation.vue`** - Integrates the command palette into the main navigation

## Future Enhancements

Potential improvements for the shortcut system:

- [ ] User-customizable key bindings
- [ ] Shortcut conflict detection
- [ ] Shortcut cheat sheet overlay
- [ ] Context-aware shortcut suggestions
- [ ] Export/import shortcut configurations
