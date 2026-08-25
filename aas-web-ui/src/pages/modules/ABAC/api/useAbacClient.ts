import type { AbacResponse } from '@/pages/modules/ABAC/types/api'
import type { Definition, DefinitionCreate, DefinitionDelete, DefinitionKind, DefinitionPatch, DefinitionReplace, DefinitionsMap } from '@/pages/modules/ABAC/types/definitions'
import type { ActivePolicy, PolicyImport, PolicyValidationResult, PolicyVersion } from '@/pages/modules/ABAC/types/policy'
import type { Rule, RuleCreate, RuleDelete, RuleDuplicate, RuleMove, RulePatch, RuleReplace, RuleToggle } from '@/pages/modules/ABAC/types/rules'
import { computed } from 'vue'
import { useRequestHandling } from '@/composables/RequestHandling'
import { ABAC_ROUTE_PATHS, CONTEXT, RULE_SUB_PATHS, VERSION_SUB_PATHS } from '@/pages/modules/ABAC/constants/api'
import { useAbacConfigStore } from '@/pages/modules/ABAC/stores/useAbacConfigStore'
import { buildRuleActionPath, buildVersionPath, jsonHeaders, toJson } from '@/pages/modules/ABAC/utils/api'
import { hasContent } from '@/utils/StringUtils'

export function useAbacClient (disableMessage = false) {
  const {
    getRequest,
    postRequest,
    putRequest,
    patchRequest,
    deleteRequest,
  } = useRequestHandling()

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  async function withApiUrl<T> (
    fn: (url: string) => Promise<AbacResponse<T>>,
  ): Promise<T> {
    const url = apiUrl.value
    if (!hasContent(url)) {
      throw new Error('ABAC API URL is not configured')
    }
    try {
      const response = await fn(url)

      if (!response.success || !response.data) {
        throw new Error(`ABAC request failed with status ${response.status ?? 'unknown'}`)
      }

      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[AbacClient]', error)
      }
      throw error
    }
  }

  // #region Policy

  async function getActivePolicy (): Promise<ActivePolicy> {
    return withApiUrl(url =>
      getRequest(
        `${url}/${ABAC_ROUTE_PATHS.ACTIVE_POLICY}`,
        CONTEXT.GET_ACTIVE_POLICY,
        disableMessage,
      ),
    )
  }

  async function getActivePolicyRules (): Promise<Rule[]> {
    return withApiUrl(url =>
      getRequest(
        `${url}/${ABAC_ROUTE_PATHS.ACTIVE_POLICY_RULES}`,
        CONTEXT.GET_ACTIVE_POLICY_RULES,
        disableMessage,
      ),
    )
  }

  async function getPolicyVersions (): Promise<PolicyVersion[]> {
    return withApiUrl(url =>
      getRequest(
        `${url}/${ABAC_ROUTE_PATHS.POLICY_VERSIONS}`,
        CONTEXT.GET_POLICY_VERSIONS,
        disableMessage,
      ),
    )
  }

  async function getPolicyVersion (versionId: string): Promise<PolicyVersion> {
    return withApiUrl(url =>
      getRequest(
        buildVersionPath(url, versionId),
        CONTEXT.GET_POLICY_VERSION,
        disableMessage,
      ),
    )
  }

  async function importPolicy (payload: PolicyImport): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        `${url}/${ABAC_ROUTE_PATHS.POLICY_VERSIONS}`,
        toJson(payload),
        jsonHeaders(),
        CONTEXT.IMPORT_POLICY,
        disableMessage,
      ),
    )
  }

  async function cloneVersion (versionId: string): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.CLONE),
        undefined,
        new Headers(),
        CONTEXT.CLONE_VERSION,
        disableMessage,
      ),
    )
  }

  async function validateVersion (versionId: string): Promise<PolicyValidationResult> {
    return withApiUrl(url =>
      postRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.VALIDATE),
        undefined,
        new Headers(),
        CONTEXT.VALIDATE_VERSION,
        disableMessage,
      ),
    )
  }

  async function activateVersion (versionId: string): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.ACTIVATE),
        undefined,
        new Headers(),
        CONTEXT.ACTIVATE_VERSION,
        disableMessage,
      ),
    )
  }

  async function rejectVersion (versionId: string): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.REJECT),
        undefined,
        new Headers(),
        CONTEXT.REJECT_VERSION,
        disableMessage,
      ),
    )
  }

  // #endregion
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // #region Rule

  async function getRules (versionId: string): Promise<Rule[]> {
    return withApiUrl(url =>
      getRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.RULES),
        CONTEXT.GET_RULES,
        disableMessage,
      ),
    )
  }

  async function getRule (versionId: string, ruleIndex: string): Promise<Rule> {
    return withApiUrl(url =>
      getRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.RULES, ruleIndex),
        CONTEXT.GET_RULES,
        disableMessage,
      ),
    )
  }

  async function createRule ({ versionId, payload }: RuleCreate): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.RULES),
        toJson(payload),
        jsonHeaders(),
        CONTEXT.CREATE_RULE,
        disableMessage,
      ),
    )
  }

  async function replaceRule ({ versionId, ruleIndex, rule }: RuleReplace): Promise<PolicyVersion> {
    return withApiUrl(url =>
      putRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.RULES, String(ruleIndex)),
        toJson(rule),
        jsonHeaders(),
        CONTEXT.REPLACE_RULE,
        disableMessage,
      ),
    )
  }

  async function patchRule ({ versionId, ruleIndex, patch }: RulePatch): Promise<PolicyVersion> {
    return withApiUrl(url =>
      patchRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.RULES, String(ruleIndex)),
        toJson(patch),
        jsonHeaders(),
        CONTEXT.PATCH_RULE,
        disableMessage,
      ),
    )
  }

  async function deleteRule ({ versionId, ruleIndex }: RuleDelete): Promise<PolicyVersion> {
    return withApiUrl(url =>
      deleteRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.RULES, String(ruleIndex)),
        new Headers(),
        CONTEXT.DELETE_RULE,
        disableMessage,
      ),
    )
  }

  async function duplicateRule ({ versionId, ruleIndex }: RuleDuplicate): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        buildRuleActionPath(url, versionId, String(ruleIndex), RULE_SUB_PATHS.DUPLICATE),
        undefined,
        new Headers(),
        CONTEXT.DUPLICATE_RULE,
        disableMessage,
      ),
    )
  }

  async function moveRule ({ versionId, ruleIndex, payload }: RuleMove): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        buildRuleActionPath(url, versionId, String(ruleIndex), RULE_SUB_PATHS.MOVE),
        toJson(payload),
        jsonHeaders(),
        CONTEXT.MOVE_RULE,
        disableMessage,
      ),
    )
  }

  async function toggleRule ({ versionId, ruleIndex, payload }: RuleToggle): Promise<PolicyVersion> {
    return withApiUrl(url =>
      putRequest(
        buildRuleActionPath(url, versionId, String(ruleIndex), RULE_SUB_PATHS.ENABLED),
        toJson(payload),
        jsonHeaders(),
        CONTEXT.TOGGLE_RULE,
        disableMessage,
      ),
    )
  }

  // #endregion
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // #region Definition

  async function getDefinitions (versionId: string): Promise<DefinitionsMap> {
    return withApiUrl(url =>
      getRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.DEFINITIONS),
        CONTEXT.GET_DEFINITIONS,
        disableMessage,
      ),
    )
  }

  async function getDefinitionsByKind (versionId: string, kind: DefinitionKind): Promise<Definition[]> {
    return withApiUrl(url =>
      getRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.DEFINITIONS, kind),
        CONTEXT.GET_DEFINITIONS,
        disableMessage,
      ),
    )
  }

  async function getDefinition (versionId: string, kind: DefinitionKind, name: string): Promise<Definition> {
    return withApiUrl(url =>
      getRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.DEFINITIONS, kind, encodeURIComponent(name)),
        CONTEXT.GET_DEFINITIONS,
        disableMessage,
      ),
    )
  }

  async function createDefinition ({ versionId, kind, payload }: DefinitionCreate): Promise<PolicyVersion> {
    return withApiUrl(url =>
      postRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.DEFINITIONS, kind),
        toJson(payload),
        jsonHeaders(),
        CONTEXT.CREATE_DEFINITION,
        disableMessage,
      ),
    )
  }

  async function replaceDefinition ({ versionId, kind, name, payload }: DefinitionReplace): Promise<PolicyVersion> {
    return withApiUrl(url =>
      putRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.DEFINITIONS, kind, encodeURIComponent(name)),
        toJson(payload),
        jsonHeaders(),
        CONTEXT.REPLACE_DEFINITION,
        disableMessage,
      ),
    )
  }

  async function patchDefinition ({ versionId, kind, name, patch }: DefinitionPatch): Promise<PolicyVersion> {
    return withApiUrl(url =>
      patchRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.DEFINITIONS, kind, encodeURIComponent(name)),
        toJson(patch),
        jsonHeaders(),
        CONTEXT.PATCH_DEFINITION,
        disableMessage,
      ),
    )
  }

  async function deleteDefinition ({ versionId, kind, name }: DefinitionDelete): Promise<PolicyVersion> {
    return withApiUrl(url =>
      deleteRequest(
        buildVersionPath(url, versionId, VERSION_SUB_PATHS.DEFINITIONS, kind, encodeURIComponent(name)),
        new Headers(),
        CONTEXT.DELETE_DEFINITION,
        disableMessage,
      ),
    )
  }

  // #endregion
  // -----------------------------------------------------------------------

  return {
    // Policy
    getActivePolicy,
    getActivePolicyRules,
    getPolicyVersions,
    getPolicyVersion,
    importPolicy,
    cloneVersion,
    validateVersion,
    activateVersion,
    rejectVersion,
    // Rule
    getRules,
    getRule,
    createRule,
    replaceRule,
    patchRule,
    deleteRule,
    duplicateRule,
    moveRule,
    toggleRule,
    // Definition
    getDefinitions,
    getDefinitionsByKind,
    getDefinition,
    createDefinition,
    replaceDefinition,
    patchDefinition,
    deleteDefinition,
  }
}
