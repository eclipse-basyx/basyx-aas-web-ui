/**
 * Base layer above mobile navigation (through 9993). Vuetify may inherit a
 * lower active-menu stack level, so the ABAC module also hides mobile navigation
 * while an ABAC dialog is active.
 */
export const ABAC_DIALOG_Z_INDEX = 10_000
