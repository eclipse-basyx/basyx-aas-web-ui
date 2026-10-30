import type { RuleUpdate } from '../../types/rules'
import { useMutation } from '@tanstack/vue-query'
import { detectRuleUpdate } from '../../utils/update'
import { useAbacContext } from '../useAbacContext'

export function useUpdateRule () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: async ({ versionId, ruleIndex, currentRule, rule }: RuleUpdate) => {
      const { mode, payload } = detectRuleUpdate(currentRule, rule)
      if (mode === 'unchanged') {
        return
      }
      // Schema warnings do not block submission; the backend decides whether to accept the rule.
      return mode === 'replace'
        ? client.replaceRule({ versionId, ruleIndex, rule: payload })
        : client.patchRule({ versionId, ruleIndex, patch: payload })
    },
    onSuccess: (result, { versionId }) => {
      if (result) {
        invalidate(keys.rules(versionId), keys.policies())
      }
    },
  })
}
