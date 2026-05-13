import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GlobalAssetQrCode from '@/components/UIComponents/GlobalAssetQrCode.vue'

const { toDataURLMock } = vi.hoisted(() => ({
  toDataURLMock: vi.fn(),
}))

vi.mock('qrcode', () => ({
  default: {
    toDataURL: toDataURLMock,
  },
}))

async function flushAsync (): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

describe('GlobalAssetQrCode.vue', () => {
  beforeEach(() => {
    toDataURLMock.mockReset()
    toDataURLMock.mockResolvedValue('data:image/png;base64,qr')
  })

  it.each([
    ['url', 'https://example.com/asset/123'],
    ['urn', 'urn:uuid:550e8400-e29b-41d4-a716-446655440000'],
    ['iri', 'https://example.com/ids/aas/1000_2000_3000_4000'],
    ['irdi', '0173-1#02-BAF016#008'],
    ['generic', 'asset-id-plain-string'],
  ])('renders QR for %s global asset ID', async (_label, content) => {
    const wrapper = mount(GlobalAssetQrCode, {
      props: {
        content,
      },
    })

    await flushAsync()

    expect(toDataURLMock).toHaveBeenCalledWith(content, {
      errorCorrectionLevel: 'Q',
      margin: 3,
      scale: 4,
    })
    expect(wrapper.find('img.qr-61406-1').exists()).toBe(true)
  })

  it('does not render QR for whitespace-only global asset ID', async () => {
    const wrapper = mount(GlobalAssetQrCode, {
      props: {
        content: '   ',
      },
    })

    await flushAsync()

    expect(toDataURLMock).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="global-asset-qr-code"]').exists()).toBe(false)
  })

  it('falls back to empty output when QR generation fails', async () => {
    toDataURLMock.mockRejectedValueOnce(new Error('QR generation error'))

    const wrapper = mount(GlobalAssetQrCode, {
      props: {
        content: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000',
      },
    })

    await flushAsync()

    expect(toDataURLMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="global-asset-qr-code"]').exists()).toBe(false)
  })

  it('uses the 61406-2 corner variant automatically when content contains ?.', async () => {
    const wrapper = mount(GlobalAssetQrCode, {
      props: {
        content: 'https://example.com/asset?.instance',
      },
    })

    await flushAsync()

    expect(wrapper.find('.qr-61406-2-container').exists()).toBe(true)
  })
})
