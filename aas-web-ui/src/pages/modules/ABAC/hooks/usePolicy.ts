import { useGetPolicy } from '@/pages/modules/ABAC/api/policy/useGetPolicy'
import { useAbacNavigation } from '@/pages/modules/ABAC/hooks/useAbacNavigation'

export function usePolicy () {
  const { selectedPolicyVersion } = useAbacNavigation()

  const { data: policy, ...rest } = useGetPolicy(selectedPolicyVersion)

  return { selectedPolicyVersion, policy, ...rest }
}
