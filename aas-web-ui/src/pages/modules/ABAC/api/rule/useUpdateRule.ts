import type { RuleUpdate } from '../../types/rules'
import { useMutation } from '@tanstack/vue-query'
import { detectRuleUpdate } from '../../utils/update'
import { useAbacContext } from '../useAbacContext'

export function useUpdateRule () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: async ({ versionId, ruleIndex, currentRule, payload: updatedRule, inputMode, mergeBase }: RuleUpdate) => {
      const { mode, payload } = detectRuleUpdate(currentRule, updatedRule, { inputMode, mergeBase })
      if (mode === 'unchanged') {
        return
      }
      // Schema warnings do not block submission; the backend decides whether to accept the rule.
      return mode === 'replace'
        ? client.replaceRule({ versionId, ruleIndex, payload })
        : client.patchRule({ versionId, ruleIndex, payload })
    },
    onSuccess: (result, { versionId }) => {
      if (result) {
        invalidate(keys.rules(versionId), keys.policies())
      }
    },
  })
}
