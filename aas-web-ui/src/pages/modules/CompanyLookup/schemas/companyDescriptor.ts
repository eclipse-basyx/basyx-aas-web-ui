import type { CompanyLookupI18NSchema } from '../i18n/setup'
import type { AdministrativeInformation, CompanyDescriptor, Endpoint } from '@/composables/Client/CompanyLookup/types/company'
import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
import type { ZodType } from 'zod'
import { z } from 'zod'
import { validateURL } from '../utils/url'

// Infer the messages type from the i18n schema
export type CompanyDescriptorMessages = CompanyLookupI18NSchema['validation']

export function createCompanyDescriptorSchema (messages: CompanyDescriptorMessages) {
  const langStringTextTypeSchema = z.custom<aasTypes.LangStringTextType>(
    v =>
      v != null
      && typeof (v as any).language === 'string'
      && typeof (v as any).text === 'string',
    { message: messages.invalidLangString },
  )

  const referenceSchema = z.custom<aasTypes.Reference>(v => v != null, {
    message: messages.invalidReference,
  })

  const httpUrlSchema = z
    .string()
    .trim()
    .min(1, messages.urlRequired)
    .refine(v => validateURL(v), messages.invalidUrl)

  const regexPatternSchema = z.string().min(1).refine(v => {
    try {
      new RegExp(v)
      return true
    } catch {
      return false
    }
  }, messages.invalidRegex)

  const endpointSchema = z.object({
    interface: z.string().trim().min(1, messages.interfaceRequired),
    protocolInformation: z.object({
      href: httpUrlSchema,
      endpointProtocol: z.string().optional(),
    }),
  }) satisfies ZodType<Endpoint>

  const administrationSchema = z
    .object({
      version: z.string().trim().optional(),
      revision: z.string().trim().optional(),
      creator: referenceSchema.optional(),
    }) satisfies ZodType<AdministrativeInformation>

  const companyDescriptorSchema = z.object({
    idShort: z.string().trim().min(1, messages.idShortRequired),
    name: z.string().trim().min(1, messages.nameRequired),
    domain: z.string().trim().min(1, messages.domainRequired),
    displayName: z.array(langStringTextTypeSchema).optional(),
    description: z.array(langStringTextTypeSchema).optional(),
    administration: administrationSchema.optional(),
    endpoints: z
      .array(endpointSchema)
      .min(1, messages.atLeastOneEndpoint),
    nameOptions: z.array(z.string().trim().min(1)).optional(),
    assetIdRegexPatterns: z.array(regexPatternSchema).optional(),
  }) satisfies ZodType<CompanyDescriptor>

  return { companyDescriptorSchema, endpointSchema }
}
