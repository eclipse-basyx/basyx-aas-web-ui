/**
 * Keeps the FCIL template the user selected in this browser (IndexedDB), so that it is asked for only once.
 * The template is not part of the application: UNIFE's terms of use do not allow redistributing it.
 * Storage may be unavailable (e.g. in a private window); the template is then asked for again.
 */

/** Web page of the template, where users download it */
export const FCIL_TEMPLATE_PAGE = 'https://www.unife.org/activities/standards-and-regulation/firesafetylist/'

const DATABASE = 'railway-fire-protection'
const STORE = 'templates'
const FCIL_TEMPLATE = 'fcil'

/** The remembered template, or null if there is none or the storage is unavailable */
export async function loadFcilTemplate (): Promise<Uint8Array | null> {
  try {
    const value = await request('readonly', store => store.get(FCIL_TEMPLATE))
    return value instanceof ArrayBuffer ? new Uint8Array(value) : null
  } catch {
    return null
  }
}

/** Remembers the template; returns false if the storage is unavailable */
export async function saveFcilTemplate (template: Uint8Array): Promise<boolean> {
  try {
    await request('readwrite', store => store.put(template.slice().buffer, FCIL_TEMPLATE))
    return true
  } catch {
    return false
  }
}

function openDatabase (): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(DATABASE, 1)
    opening.addEventListener('upgradeneeded', () => opening.result.createObjectStore(STORE))
    opening.addEventListener('success', () => resolve(opening.result))
    opening.addEventListener('error', () => reject(opening.error))
  })
}

async function request<T> (mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const pending = action(database.transaction(STORE, mode).objectStore(STORE))
      pending.addEventListener('success', () => resolve(pending.result))
      pending.addEventListener('error', () => reject(pending.error))
    })
  } finally {
    database.close()
  }
}
