export const RESOURCE_ACCESS_PROFILE = 'https://basyx.org/aas/API/3/2/ResourceBoundAccessControl/1.0'

export function hasResourceAccessProfile (description: unknown): boolean {
  if (!description || typeof description !== 'object' || !('profiles' in description)) {
    return false
  }
  return Array.isArray(description.profiles) && description.profiles.includes(RESOURCE_ACCESS_PROFILE)
}
