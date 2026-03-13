# Keyboard Shortcuts System

This directory contains the keyboard shortcut system for the BaSyx AAS Web UI. The system supports global shortcuts (available on all pages) and route-specific shortcuts (only available on certain pages).

## Architecture

### Files Overview

- **Vuetify `useHotkey` composable** - Central keyboard event handler with scope management (provided by Vuetify)
- **`useShortcutDefinitions.ts`** - Global shortcut definitions available across all pages
- **`useRouteShortcuts.ts`** - Route-specific shortcut definitions that extend global shortcuts
- **`useGlobalShortcuts.ts`** - Registers all shortcuts (global + route-specific) using Vuetify's `useHotkey`

### How It Works

1. Global keyboard events are listened to via Vuetify's `useHotkey` composable
2. When a key combination is pressed, it is dispatched to registered handlers based on scope
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
    keys: string;                 // Key combination (e.g., 'cmd+shift+h' - 'cmd' becomes 'Ctrl' on Windows/Linux automatically)
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
    keys: 'cmd+,',  // 'cmd' automatically becomes 'Ctrl' on Windows/Linux
    handler: () => {
        router.push({ name: 'Settings' });
    }
}
```

**Important:** All global shortcuts must use the category `'Global Shortcuts'` to ensure they appear together in the Command Palette.

## Adding Route-Specific Shortcuts

All pages (both core pages and modules) can define their own shortcuts using the same pattern. Add a second `<script>` block to your page file that exports a `shortcuts` function.

### How to Add Shortcuts to Any Page

```typescript
<script setup lang="ts">
    // Your regular component setup code
    import { ref } from 'vue';
    
    const myData = ref('');
    // ... component logic
</script>

<script lang="ts">
    import type { PageShortcutDefinitions } from '@/composables/Shortcuts/useRouteShortcuts';

    // Page shortcuts - automatically loaded when page is active
    export const shortcuts: PageShortcutDefinitions = ({ route, navigationStore }) => [
        {
            id: 'my-page-action',
            title: 'My Action',
            description: 'Perform a page-specific action',
            prependIcon: 'mdi-cog',
            category: 'My Page Shortcuts',  // Will appear as a subheader
            keys: 'cmd+m',  // 'cmd' automatically becomes 'Ctrl' on Windows/Linux
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                // Your action logic here
                console.log('Page shortcut triggered!');
            }
        }
    ];
</script>
```

**Important:** The `category` field should follow the format `'<Page Name> Shortcuts'` where the page name is human-readable (e.g., `'AAS Viewer Shortcuts'`, `'SM Editor Shortcuts'`). This ensures shortcuts are grouped under their respective page sections in the Command Palette with proper subheaders.

### Available Parameters

The shortcuts function receives an object with:

- `route` - Current Vue Router route object
- `navigationStore` - Access to navigation store methods
- Any other stores can be imported and used within the function

### Example: AasImporter Module

```typescript
<script lang="ts">
    import type { PageShortcutDefinitions } from '@/composables/Shortcuts/useRouteShortcuts';

    export const shortcuts: PageShortcutDefinitions = () => [
        {
            id: 'aas-importer-clear',
            title: 'Clear Input',
            description: 'Clear the asset ID input field',
            prependIcon: 'mdi-eraser',
            category: 'AAS Importer Shortcuts',
            keys: 'cmd+shift+backspace',  // 'cmd' automatically becomes 'Ctrl' on Windows/Linux
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

- Page shortcuts are only active when that page/route is active
- Shortcuts are cached for performance after first load
- Works identically for core pages (`@/pages/*.vue`) and modules (`@/pages/modules/*.vue`)
- No core application code changes needed
- Category should be `'<Page Name> Shortcuts'` for consistency

## Key Combination Format

Key combinations are strings with modifiers and keys separated by `+`. The system uses Vuetify's `useHotkey` composable which automatically handles platform differences.

- **Modifiers**: `cmd`, `ctrl`, `alt`, `shift`, `meta`
- **Keys**: Any letter, number, or special key name
- **Platform-aware**: Use `cmd` for shortcuts - it automatically becomes `Ctrl` on Windows/Linux

### Examples

```typescript
// Single key with modifier
'cmd+k'          // Command + K (Mac) or Ctrl + K (Windows/Linux)

// Multiple modifiers
'cmd+shift+h'    // Command + Shift + H (Mac) or Ctrl + Shift + H (Windows/Linux)

// Letter keys
'cmd+s'          // Command + S (save)

// Special keys
'cmd+enter'      // Command + Enter
'escape'         // Escape key alone

// Explicit Ctrl (same on all platforms)
'ctrl+a'         // Ctrl + A on all platforms
```

### Platform Differences

The `cmd` modifier is **automatically translated**:

- On **macOS**: `cmd` → Command (⌘)
- On **Windows/Linux**: `cmd` → Control (Ctrl)

Simply use `'cmd+key'` format - no need for separate mac/windows definitions!

```typescript
keys: 'cmd+s'  // Automatically works as Cmd+S on Mac, Ctrl+S on Windows/Linux
```

## Complete Example: Adding Shortcuts to a New Page

Let's say you're creating a new "Dashboard" page and want to add shortcuts for it.
Create your page file `@/pages/Dashboard.vue`:

```vue
<template>
    <v-container>
        <h1>Dashboard</h1>
        <!-- Your component code -->
    </v-container>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    
    const viewMode = ref('grid');
    // ... component logic
</script>

<script lang="ts">
    import type { PageShortcutDefinitions } from '@/composables/Shortcuts/useRouteShortcuts';

    export const shortcuts: PageShortcutDefinitions = () => [
        {
            id: 'refresh-dashboard',
            title: 'Refresh Dashboard',
            description: 'Reload dashboard data',
            prependIcon: 'mdi-refresh',
            category: 'Dashboard Shortcuts',
            keys: 'cmd+r',  // Automatically Cmd+R on Mac, Ctrl+R on Windows/Linux
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                window.location.reload();
            }
        },
        {
            id: 'toggle-view',
            title: 'Toggle View',
            description: 'Switch between grid and list view',
            prependIcon: 'mdi-view-dashboard',
            category: 'Dashboard Shortcuts',
            keys: 'cmd+shift+v',  // Automatically adapts to platform
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                // Toggle view logic
                console.log('Toggling view...');
            }
        }
    ];
</script>
```

### 2. Define the route in `router.ts`

```typescript
{
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue')
}
```

### 3. Test your shortcuts

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
