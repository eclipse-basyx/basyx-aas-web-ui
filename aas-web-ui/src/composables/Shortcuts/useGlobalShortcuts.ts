import { ref, watch } from 'vue'
import { useHotkey } from 'vuetify'
import { useRouteShortcuts } from '@/composables/Shortcuts/useRouteShortcuts'
import { useShortcutDefinitions } from '@/composables/Shortcuts/useShortcutDefinitions'

export function useGlobalShortcuts (onCommandPalette?: () => void): void {
  const { shortcuts: globalShortcuts } = useShortcutDefinitions(onCommandPalette)
  const { shortcuts: routeShortcuts } = useRouteShortcuts()
  const routeCleanupFunctions = ref<Array<() => void>>([])

  // Register global shortcuts once (automatically cleaned up on component unmount)
  for (const shortcut of globalShortcuts.value) {
    useHotkey(
      shortcut.keys,
      (event: KeyboardEvent) => {
        // Blur active element when opening command palette
        if (shortcut.id === 'command-palette' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        shortcut.handler(event)
      },
      {
        preventDefault: true,
        inputs: shortcut.id === 'command-palette', // Only command palette works in inputs
      },
    )
  }

  // Watch for route shortcut changes and re-register them
  watch(
    routeShortcuts,
    newShortcuts => {
      // Cleanup previous route shortcuts
      for (const cleanup of routeCleanupFunctions.value) {
        cleanup()
      }
      routeCleanupFunctions.value = []

      // Register new route shortcuts
      for (const shortcut of newShortcuts) {
        const cleanup = useHotkey(
          shortcut.keys,
          (event: KeyboardEvent) => {
            shortcut.handler(event)
          },
          {
            preventDefault: true,
            inputs: false,
          },
        )
        routeCleanupFunctions.value.push(cleanup)
      }
    },
    { immediate: true },
  )
}
