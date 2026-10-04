import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'

/** Loads the content of a File submodel element as text (internal attachment or external http(s) URL). */
export function useFileText () {
  const { valueUrl } = useSMEFile()
  const { fetchAttachmentFile } = useSMRepositoryClient()

  async function fetchFileText (file: any): Promise<string> {
    const { url, isExternal } = valueUrl(file)
    if (!url) {
      throw new Error('The File element has no value')
    }

    if (isExternal) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      return await response.text()
    }

    const blob = await fetchAttachmentFile(file.path, 'blob')
    if (!(blob instanceof Blob)) {
      throw new TypeError('The file could not be loaded')
    }
    return await blob.text()
  }

  return { fetchFileText }
}
