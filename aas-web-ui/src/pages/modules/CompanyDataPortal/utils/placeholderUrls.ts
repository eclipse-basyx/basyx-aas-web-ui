// URL placeholders live here instead of inline in templates: vue-tsc 3.3.14 generates
// broken code for `//` inside template attributes (vuejs/language-tools#6322).
export const placeholderUrls = {
  website: 'https://example.com',
  customerSubmodel: 'https://aas.example.com/submodels/customer-xyz',
  codeOfConduct: 'https://example.com/code-of-conduct',
  terms: 'https://example.com/terms',
  qualityAgreement: 'https://example.com/quality-agreement',
  erpSubmodel: 'https://aas.example.com/submodels/erp-xyz',
  emailSubmodel: 'https://aas.example.com/submodels/email-outlook-001',
} as const
