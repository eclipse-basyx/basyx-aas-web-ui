import type { DefinitionKind } from '@/composables/Client/ABAC/types/definitions'

export const EMPTY_POLICY = {
  AllAccessPermissionRules: {
    rules: [
      {
        ACL: {
          ACCESS: 'ALLOW',
          RIGHTS: [
            'READ',
          ],
          ATTRIBUTES: [
            {
              GLOBAL: 'ANONYMOUS',
            },
          ],
        },
        OBJECTS: [
          { ROUTE: '/description',

          },
        ],
        FORMULA: {
          $boolean: true,
        },
      },
    ],
  },
}

export const EMPTY_RULE = {
  ACL: {
    ACCESS: 'ALLOW',
    RIGHTS: [
      'READ',
    ],
    ATTRIBUTES: [
      {
        CLAIM: 'role',
      },
    ],
  },
  OBJECTS: [
    {
      ROUTE: '/shells',
    },
  ],
  FORMULA: {
    $eq: [
      {
        $attribute: {
          CLAIM: 'role',
        },
      },
      {
        $strVal: 'admin',
      },
    ],
  },
}

export const EMPTY_DEFINITION: Record<DefinitionKind, object> = {
  attributes: {
    name: 'adminClaims',
    attributes: [
      {
        CLAIM: 'role',
      },
    ],
  },
  acls: {
    name: 'readAcl',
    acl: {
      ACCESS: 'ALLOW',
      RIGHTS: [
        'READ',
      ],
      USEATTRIBUTES: 'adminClaims',
    },
  },
  objects: {
    name: 'adminRoutes',
    objects: [
      {
        ROUTE: '/security/abac/*',
      },
    ],
  },
  formulas: {
    name: 'isAdmin',
    formula: {
      $eq: [
        {
          $attribute: {
            CLAIM: 'role',
          },
        },
        {
          $strVal: 'admin',
        },
      ],
    },
  },
}
