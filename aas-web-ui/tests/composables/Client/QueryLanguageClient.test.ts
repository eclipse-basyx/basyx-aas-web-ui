import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQueryLanguageClient } from '@/composables/Client/QueryLanguageClient'

const mocks = vi.hoisted(() => ({
  postRequest: vi.fn(),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({ postRequest: mocks.postRequest }),
}))

describe('QueryLanguageClient', () => {
  beforeEach(() => {
    mocks.postRequest.mockReset()
  })

  it('posts a paginated query and normalizes its cursor', async () => {
    mocks.postRequest.mockResolvedValue({
      success: true,
      data: {
        result: [{ id: 'shell-one' }],
        paging_metadata: { cursor: 'next-page' },
      },
    })

    const query = { $condition: { $boolean: true } }
    const page = await useQueryLanguageClient().queryPage(
      'https://example.com/shells',
      'aas-repository',
      query,
      { limit: 25, cursor: 'current-page' },
    )

    expect(page).toEqual({
      items: [{ id: 'shell-one' }],
      nextCursor: 'next-page',
      hasMore: true,
      success: true,
    })
    expect(mocks.postRequest).toHaveBeenCalledWith(
      'https://example.com/query/shells?limit=25&cursor=current-page',
      JSON.stringify(query),
      expect.any(Headers),
      'executing Query Language search',
      false,
    )
  })

  it('normalizes a failed protocol response', async () => {
    mocks.postRequest.mockResolvedValue({ success: false })

    const page = await useQueryLanguageClient().queryPage(
      'https://example.com/submodels',
      'submodel-repository',
      { $condition: { $boolean: true } },
    )

    expect(page).toEqual({ items: [], hasMore: false, success: false })
  })
})
