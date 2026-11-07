import type { WritableComputedRef } from 'vue'
import type { LocationQuery } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'

const dialogParameter = 'dialog'

/**
 * Keeps the open dialog and parts of its state in the route query, e.g.
 * `?dialog=create-asset-from-infrastructure&dialogInfrastructure=<id>`.
 * A reload or the return from an OAuth2 login reopens the dialog in the same state.
 */
export function useEdcDialogRoute () {
  const route = useRoute()
  const router = useRouter()

  /**
   * Whether the dialog with the given name is open.
   * Opening adds a history entry, closing removes the state of the dialog as well.
   */
  function dialogOpen (dialog: string): WritableComputedRef<boolean> {
    return computed({
      get: () => route.query[dialogParameter] === dialog,
      set: open => {
        if (open === (route.query[dialogParameter] === dialog)) {
          return
        }

        const query = withoutDialog(route.query)
        if (open) {
          void router.push({ query: { ...query, [dialogParameter]: dialog } })
        } else {
          void router.replace({ query })
        }
      },
    })
  }

  /**
   * State of the open dialog, e.g. `dialogState('infrastructure')` is kept as `dialogInfrastructure`.
   * Changes are ignored while no dialog is open.
   */
  function dialogState (key: string): WritableComputedRef<string | null> {
    const parameter = dialogParameter + key.charAt(0).toUpperCase() + key.slice(1)

    return computed({
      get: () => {
        const value = route.query[parameter]
        return typeof value === 'string' && value !== '' ? value : null
      },
      set: value => {
        if (!route.query[dialogParameter] || (route.query[parameter] ?? null) === value) {
          return
        }

        const query = { ...route.query }
        if (value) {
          query[parameter] = value
        } else {
          delete query[parameter]
        }
        void router.replace({ query })
      },
    })
  }

  return { dialogOpen, dialogState }
}

function withoutDialog (query: LocationQuery): LocationQuery {
  return Object.fromEntries(Object.entries(query).filter(([key]) => !key.startsWith(dialogParameter)))
}
