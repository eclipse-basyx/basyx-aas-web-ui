import { describe, expect, it, vi } from 'vitest'
import { fetchAndValidateSmeSelection } from '@/router'

describe('Operation fragment routing', () => {
  it('preserves the same valid fragment when navigating to a different owning Operation', async () => {
    const fragment = '/inputVariables/0/value'
    const fetchedNode = {
      modelType: 'Property',
      selectionKey: `/operations/b#${fragment}`,
    }
    const fetchAndDispatchSme = vi.fn().mockResolvedValue(fetchedNode)
    const clearSelectedNode = vi.fn()

    const result = await fetchAndValidateSmeSelection(
      { path: '/aaseditor', query: { path: '/operations/b', fragment } },
      { path: '/aaseditor', query: { path: '/operations/a', fragment } },
      { modelType: 'Property', selectionKey: `/operations/a#${fragment}` },
      fetchAndDispatchSme,
      clearSelectedNode,
    )

    expect(fetchAndDispatchSme).toHaveBeenCalledWith('/operations/b', true, fragment)
    expect(result).toEqual({ fetchedSme: fetchedNode, redirect: null })
    expect(clearSelectedNode).not.toHaveBeenCalled()
  })

  it('removes a carried fragment when it does not resolve on the destination endpoint', async () => {
    const fragment = '/inputVariables/0/value'
    const fetchAndDispatchSme = vi.fn().mockResolvedValue({})

    const result = await fetchAndValidateSmeSelection(
      { path: '/aaseditor', query: { path: '/properties/plain', fragment, view: 'SMEView' } },
      { path: '/aaseditor', query: { path: '/operations/a', fragment, view: 'SMEView' } },
      { modelType: 'Property', selectionKey: `/operations/a#${fragment}` },
      fetchAndDispatchSme,
      vi.fn(),
    )

    expect(fetchAndDispatchSme).toHaveBeenCalledWith('/properties/plain', true, fragment)
    expect(result).toEqual({
      fetchedSme: null,
      redirect: {
        path: '/aaseditor',
        query: { path: '/properties/plain', view: 'SMEView' },
      },
    })
  })
})
