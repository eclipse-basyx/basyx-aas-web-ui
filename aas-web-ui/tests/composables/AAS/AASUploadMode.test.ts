import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AAS_UPLOAD_MODE,
  isServerAasUploadSupported,
  resolveAasUploadMode,
} from '@/composables/AAS/AASUploadMode'

describe('AASUploadMode.ts', () => {
  it('defaults to server upload before files are selected', () => {
    expect(DEFAULT_AAS_UPLOAD_MODE).toBe('server')
    expect(resolveAasUploadMode([])).toBe('server')
  })

  it('uses server upload by default for AASX files', () => {
    expect(isServerAasUploadSupported(['first.aasx', 'SECOND.AASX'])).toBe(true)
    expect(resolveAasUploadMode(['first.aasx', 'SECOND.AASX'])).toBe('server')
  })

  it('enforces client-side import when any selected file is not AASX', () => {
    expect(isServerAasUploadSupported(['shell.aasx', 'environment.json'])).toBe(false)
    expect(resolveAasUploadMode(['shell.aasx', 'environment.json'], 'server')).toBe('client')
    expect(resolveAasUploadMode(['environment.xml'], 'server')).toBe('client')
    expect(resolveAasUploadMode(['unsupported.txt'], 'server')).toBe('client')
  })

  it('preserves and restores a supported user preference', () => {
    expect(resolveAasUploadMode(['shell.aasx'], 'client')).toBe('client')
    expect(resolveAasUploadMode(['environment.json'], 'server')).toBe('client')
    expect(resolveAasUploadMode(['shell.aasx'], 'server')).toBe('server')
  })
})
