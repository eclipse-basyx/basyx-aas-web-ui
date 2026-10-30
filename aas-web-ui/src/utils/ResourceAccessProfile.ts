/** Profile announced in `/description` by BaSyx services with ReBAC enabled. */
export const RESOURCE_ACCESS_PROFILE = 'https://basyx.org/aas/API/3/2/RelationshipBasedAccessControl/1.0'

export function hasResourceAccessProfile (description: unknown): boolean {
  if (!description || typeof description !== 'object' || !('profiles' in description)) {
    return false
  }
  return Array.isArray(description.profiles) && description.profiles.includes(RESOURCE_ACCESS_PROFILE)
}
