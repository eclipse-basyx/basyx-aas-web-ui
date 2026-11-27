/**
 * Downloads the UNIFE "Fire Certificate Inventory List" template (TGFS.06, revision 06, English) from unife.org
 * at test time. UNIFE's terms of use do not allow redistributing it, so it is not part of this repository;
 * without network access the dependent tests are skipped.
 */

export const FCIL_TEMPLATE_URL
  = 'https://www.unife.org/wp-content/uploads/2025/05/Fire_Certificate_Inventory_List_Template_TGFS_06_English.xlsx'

let cached: Promise<Uint8Array | null> | undefined

/**
 * The template, or null if it cannot be loaded.
 * Logs a warning on HTTP errors, timeouts and missing network access.
 */
export function downloadFcilTemplate (timeoutMs = 15_000): Promise<Uint8Array | null> {
  cached ??= fetchTemplate(timeoutMs)
  return cached.then(bytes => bytes?.slice() ?? null)
}

async function fetchTemplate (timeoutMs: number): Promise<Uint8Array | null> {
  try {
    const response = await fetch(FCIL_TEMPLATE_URL, { signal: AbortSignal.timeout(timeoutMs) })
    if (!response.ok) {
      console.warn(`UNIFE FCIL template not available (HTTP ${response.status}): ${FCIL_TEMPLATE_URL}`)
      return null
    }
    return new Uint8Array(await response.arrayBuffer())
  } catch (error) {
    console.warn(`UNIFE FCIL template not available (${(error as Error).message}): ${FCIL_TEMPLATE_URL}`)
    return null
  }
}
