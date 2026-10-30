import type { PendingInvitation } from '@/utils/ShareLinks'
import { parseInvitation } from '@/utils/ShareLinks'

// Tab-scoped and short-lived so sign-in redirects can resume the invitation.
// Never put invitation tokens in localStorage, route queries or application logs.
const storageKey = 'pending-share-invitation'
const lifetime = 15 * 60 * 1000
export const pendingInvitation = shallowRef<PendingInvitation>()

export function clearInvitation (): void {
  pendingInvitation.value = undefined
  try {
    sessionStorage.removeItem(storageKey)
  } catch { /* Storage may be disabled. */ }
}

export function captureInvitation (): boolean {
  const fragment = window.location.hash
  if (!fragment.startsWith('#/share-access')) {
    return false
  }
  clearInvitation()
  const invitation = parseInvitation(fragment)
  const path = new URL(import.meta.env.BASE_URL, window.location.origin).pathname.replace(/\/$/, '') + '/share-access'
  window.history.replaceState(window.history.state, '', path)
  if (invitation) {
    pendingInvitation.value = invitation
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(invitation))
    } catch { /* In-memory use still works. */ }
  }
  return true
}

export function restoreInvitation (): void {
  if (captureInvitation()) {
    return
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as PendingInvitation | null
    if (!saved || !Number.isFinite(saved.receivedAt) || Date.now() - saved.receivedAt > lifetime || saved.receivedAt > Date.now()) {
      clearInvitation()
      return
    }
    const validated = parseInvitation('#/share-access?' + new URLSearchParams({
      token: saved.token, service: saved.service, component: saved.component,
    }))
    if (validated) {
      pendingInvitation.value = { ...validated, receivedAt: saved.receivedAt }
    } else {
      clearInvitation()
    }
  } catch {
    clearInvitation()
  }
}
