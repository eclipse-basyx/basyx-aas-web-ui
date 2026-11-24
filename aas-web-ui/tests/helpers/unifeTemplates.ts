/**
 * Loads the UNIFE "Fire Certificate Inventory List" template (TGFS.06, revision 06, English) from unife.org
 * at test time. UNIFE's terms of use do not allow redistributing it, so it is not part of this repository;
 * without network access the dependent tests are skipped.
 */

import { download } from './download'

export const FCIL_TEMPLATE_URL
  = 'https://www.unife.org/wp-content/uploads/2025/05/Fire_Certificate_Inventory_List_Template_TGFS_06_English.xlsx'

let cached: Promise<Uint8Array | null> | undefined

/** The template, or null if it cannot be loaded */
export function loadFcilTemplate (timeoutMs = 15_000): Promise<Uint8Array | null> {
  cached ??= download(
    FCIL_TEMPLATE_URL,
    'UNIFE FCIL template',
    async response => new Uint8Array(await response.arrayBuffer()),
    timeoutMs,
  )
  return cached.then(bytes => bytes?.slice() ?? null)
}
