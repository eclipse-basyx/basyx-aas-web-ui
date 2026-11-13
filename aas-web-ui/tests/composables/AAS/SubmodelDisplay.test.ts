import { describe, expect, it, vi } from 'vitest'
import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (referable: any) => referable?.displayName?.[0]?.text ?? referable?.idShort ?? '',
  }),
}))

describe('SubmodelDisplay.ts', () => {
  const { smTitleToDisplay, smVersionToDisplay, smIdToDisplay, sortSmsForDisplay } = useSubmodelDisplay()
  const nameplateSemanticId = { keys: [{ type: 'GlobalReference', value: 'https://admin-shell.io/idta/nameplate/3/0/Nameplate' }] }

  it('prefers the displayName, then the SMT name, then the idShort as title', () => {
    expect(smTitleToDisplay({ idShort: 'NP', displayName: [{ language: 'en', text: 'My Nameplate' }], semanticId: nameplateSemanticId }))
      .toBe('My Nameplate')
    expect(smTitleToDisplay({ idShort: 'NP', semanticId: nameplateSemanticId })).toBe('Digital Nameplate for industrial equipment')
    expect(smTitleToDisplay({ idShort: 'Custom' })).toBe('Custom')
  })

  it('prefers the administrative version, then the SMT version, then the semanticId version', () => {
    expect(smVersionToDisplay({ administration: { version: '1', revision: '2' }, semanticId: nameplateSemanticId })).toBe('1.2')
    expect(smVersionToDisplay({ semanticId: nameplateSemanticId })).toBe('3.0')
    expect(smVersionToDisplay({ idShort: 'Custom' })).toBe('')
  })

  it('shortens the part of the SM ID repeating the AAS ID', () => {
    expect(smIdToDisplay('https://example.com/ids/aas/1/sm/nameplate', 'https://example.com/ids/aas/1')).toBe('.../sm/nameplate')
    expect(smIdToDisplay('urn:sm:urn:aas:1:nameplate', 'urn:aas:1')).toBe('urn:sm:...:nameplate')
    expect(smIdToDisplay('urn:aas:1', 'urn:aas:1')).toBe('urn:aas:1')
    expect(smIdToDisplay('urn:sm:other', 'urn:aas:1')).toBe('urn:sm:other')
    expect(smIdToDisplay('urn:sm:other')).toBe('urn:sm:other')
  })

  it('sorts SMs by displayed title and version', () => {
    const sorted = sortSmsForDisplay([{ idShort: 'B' }, { idShort: 'A', administration: { version: '2' } }, { idShort: 'A', administration: { version: '1' } }])
    expect(sorted.map(sm => sm.idShort + (sm.administration?.version ?? ''))).toEqual(['A1', 'A2', 'B'])
  })
})
