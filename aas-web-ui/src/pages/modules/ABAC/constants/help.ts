/**
 * Documentation topics use verified anchors in IDTA-01004 v3.2, matching the pinned schema version.
 * Review these links when updating the schema snapshot.
 */
const ACCESS_RULE_MODEL = 'https://industrialdigitaltwin.io/aas-specifications/IDTA-01004/v3.2/access-rule-model.html'

export const HELP_LINKS = {
  details: `${ACCESS_RULE_MODEL}#reusable-definitions`,
  attributes: `${ACCESS_RULE_MODEL}#attributes`,
  acls: `${ACCESS_RULE_MODEL}#acl`,
  objects: `${ACCESS_RULE_MODEL}#objects`,
  formulas: `${ACCESS_RULE_MODEL}#formulas`,
  rules: `${ACCESS_RULE_MODEL}#access-permission-rules`,
  access: `${ACCESS_RULE_MODEL}#acl`,
  resources: `${ACCESS_RULE_MODEL}#objects`,
  conditions: `${ACCESS_RULE_MODEL}#formulas`,
  filter: `${ACCESS_RULE_MODEL}#access-permission-rules`,
} as const

export type HelpTopic = keyof typeof HELP_LINKS
