import { describe, expect, it } from 'vitest'
import { sectionDiagnosticMessages } from './diagnostics'

describe('section diagnostic messages', () => {
  it('keeps paths paired with messages and scopes nested policy sections', () => {
    const advisory = { title: 'Warning', issues: [
      { path: ['AllAccessPermissionRules', 'rules', '0', 'FILTER', 'FRAGMENT'], message: 'Invalid fragment' },
      { path: ['AllAccessPermissionRules', 'rules', '1', 'FILTER', 'FRAGMENT'], message: 'Another rule' },
      { path: ['AllAccessPermissionRules', 'rules', '0', 'ACL'], message: 'Invalid ACL' },
    ] }
    const error = { title: 'Save failed', paths: [['AllAccessPermissionRules', 'rules', '0', 'FILTER']], messages: ['Rejected filter'] }
    expect(sectionDiagnosticMessages(error, advisory, ['AllAccessPermissionRules', 'rules', '0'], ['FILTER'])).toEqual(['Rejected filter', 'Invalid fragment'])
  })

  it('includes root content issues, excludes name issues, and leaves unlocated failures in the summary', () => {
    const advisory = { title: 'Warning', issues: [{ path: [], message: 'Choose an alternative' }, { path: ['name'], message: 'Invalid name' }] }
    expect(sectionDiagnosticMessages({ title: 'Unknown failure' }, advisory, [], undefined, ['name', 'kind'])).toEqual(['Choose an alternative'])
  })
})
