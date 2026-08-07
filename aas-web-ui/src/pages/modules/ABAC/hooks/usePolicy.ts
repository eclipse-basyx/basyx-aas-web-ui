import { useGetPolicy } from '@/composables/Client/ABAC/queries/policy/useGetPolicy'
import { useAbacNavigation } from './useAbacNavigation'

export function usePolicy () {
  const { selectedPolicyVersion } = useAbacNavigation()

  const queryValues = useGetPolicy(selectedPolicyVersion)

  return { selectedPolicyVersion, policy: queryValues.data, ...queryValues }
}
