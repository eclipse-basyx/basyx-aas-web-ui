<template>
  <Transition
    :css="false"
    @after-enter="onAfterEnter"
    @after-leave="onAfterLeave"
    @before-enter="onBeforeEnter"
    @before-leave="onBeforeLeave"
    @enter="onEnter"
    @leave="onLeave"
  >
    <slot />
  </Transition>
</template>

<script lang="ts" setup>
  import { flipClose, flipOpen, showTile } from '../utils/flipAnimation'

  /**
   * Dialog transition for `v-dialog` (`:transition="{ component, origin }"`): the dialog flips out of the
   * `origin` element (the card of the clicked tile) and back into it, see `utils/flipAnimation.ts`.
   */
  defineOptions({
    name: 'RailwayFireProtectionFlipTransition',
  })

  const props = defineProps<{
    origin?: Element | null
    /** Passed by Vuetify's overlay when it has an activator; used if no `origin` is given */
    target?: unknown
  }>()

  type Closing = { tile: Element | null, cleanup: () => void }
  const closing = new WeakMap<Element, Closing>()

  function originElement (): Element | null {
    if (props.origin) {
      return props.origin
    }
    return props.target instanceof Element ? props.target : null
  }

  function nextFrame (): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()))
  }

  function onBeforeEnter (el: Element): void {
    // Hidden until the dialog has its final layout, which is measured in onEnter
    ;(el as HTMLElement).style.visibility = 'hidden'
    ;(el as HTMLElement).style.pointerEvents = 'none'
  }

  async function onEnter (el: Element, done: () => void): Promise<void> {
    await nextFrame()
    await nextFrame()
    ;(el as HTMLElement).style.visibility = ''
    await flipOpen(el, originElement())
    done()
  }

  function onAfterEnter (el: Element): void {
    ;(el as HTMLElement).style.removeProperty('pointer-events')
  }

  function onBeforeLeave (el: Element): void {
    ;(el as HTMLElement).style.pointerEvents = 'none'
  }

  async function onLeave (el: Element, done: () => void): Promise<void> {
    const tile = originElement()
    const cleanup = await flipClose(el, tile)
    closing.set(el, { tile, cleanup })
    done()
  }

  function onAfterLeave (el: Element): void {
    // Show the tile before its moving copy is removed, so there is no frame without either
    const state = closing.get(el)
    showTile(state?.tile ?? originElement())
    state?.cleanup()
    closing.delete(el)
    ;(el as HTMLElement).style.removeProperty('pointer-events')
  }
</script>
