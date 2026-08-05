export function formatJSON (json: string): string {
  try {
    // Check if input is valid
    if (!json || typeof json !== 'string') {
      return ''
    }

    const trimmedJson = json.trim()
    if (!trimmedJson) {
      return ''
    }

    try {
      const obj = JSON.parse(trimmedJson)
      return JSON.stringify(obj, null, 2)
    } catch (parseError) {
      console.warn('JSON parsing warning:', parseError)
      return trimmedJson
    }
  } catch (error_) {
    console.error('Error formatting JSON:', error_)
    return json
  }
}
