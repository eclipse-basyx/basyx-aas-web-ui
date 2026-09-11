import { useGetPolicy } from '../api/policy/useGetPolicy'
import { useAbacNavigation } from './useAbacNavigation'

export function usePolicy () {
  const { selectedPolicyVersion } = useAbacNavigation()

  const { data: policy, ...rest } = useGetPolicy(selectedPolicyVersion)

  return { selectedPolicyVersion, policy, ...rest }
}
