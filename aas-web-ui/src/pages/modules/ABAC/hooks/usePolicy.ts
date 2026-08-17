import { useGetPolicy } from '@/pages/modules/ABAC/api/queries/policy/useGetPolicy'
import { useAbacNavigation } from './useAbacNavigation'

export function usePolicy () {
  const { selectedPolicyVersion } = useAbacNavigation()

  const { data: policy, ...rest } = useGetPolicy(selectedPolicyVersion)

  return { selectedPolicyVersion, policy, ...rest }
}
