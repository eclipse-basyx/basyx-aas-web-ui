export const ABAC_ENDPOINT_PATHS = {
  SECURITY: '/security/abac',
} as const

export const ABAC_ROUTE_PATHS = {
  ACTIVE_POLICY: 'active-policy',
  ACTIVE_POLICY_RULES: 'active-policy/rules',
  POLICY_VERSIONS: 'policy-versions',
  RULES: 'rules',
} as const

export const CONTEXT = {
  GET_ACTIVE_POLICY: 'retrieving active ABAC policy',
  GET_ACTIVE_POLICY_RULES: 'retrieving active ABAC policy rules',
  GET_POLICY_VERSIONS: 'retrieving ABAC policy versions',
  GET_POLICY_VERSION: 'retrieving ABAC policy version',
  GET_RULES: 'retrieving ABAC rules',
  GET_RULE: 'retrieving ABAC rule',
  GET_DEFINITIONS: 'retrieving ABAC definitions',
  GET_DEFINITION: 'retrieving ABAC definition',
  CREATE_RULE: 'creating ABAC rule',
  REPLACE_RULE: 'replacing ABAC rule',
  PATCH_RULE: 'patching ABAC rule',
  DELETE_RULE: 'deleting ABAC rule',
  DUPLICATE_RULE: 'duplicating ABAC rule',
  MOVE_RULE: 'moving ABAC rule',
  TOGGLE_RULE: 'toggling ABAC rule enabled state',
  CREATE_DEFINITION: 'creating ABAC definition',
  REPLACE_DEFINITION: 'replacing ABAC definition',
  PATCH_DEFINITION: 'patching ABAC definition',
  DELETE_DEFINITION: 'deleting ABAC definition',
  IMPORT_POLICY: 'importing ABAC policy',
  CLONE_VERSION: 'cloning ABAC policy version',
  VALIDATE_VERSION: 'validating ABAC policy version',
  ACTIVATE_VERSION: 'activating ABAC policy version',
  REJECT_VERSION: 'rejecting ABAC policy version',
  TEST_CONNECTION: 'testing ABAC service connection',
} as const

/** Path segments appended after a version_id path parameter. */
export const VERSION_SUB_PATHS = {
  CLONE: 'clone',
  VALIDATE: 'validate',
  ACTIVATE: 'activate',
  REJECT: 'reject',
  RULES: 'rules',
  DEFINITIONS: 'definitions',
} as const

/** Path segments appended after /rules/{index}. */
export const RULE_SUB_PATHS = {
  DUPLICATE: 'duplicate',
  MOVE: 'move',
  ENABLED: 'enabled',
} as const
