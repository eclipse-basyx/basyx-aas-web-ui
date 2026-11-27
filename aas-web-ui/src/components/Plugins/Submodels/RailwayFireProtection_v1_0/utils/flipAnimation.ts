/**
 * Flip-and-zoom effect between a requirement set tile and its details dialog.
 *
 * Tile and dialog are animated as the front and back face of one card: a copy of the tile ("ghost") and the
 * dialog follow the same path from the tile's box to the dialog's box while the card turns by 180°. Both faces
 * hide their back side, so the tile is visible during the first half of the turn and the dialog during the second.
 * Closing runs the same motion backwards.
 *
 * Only `transform` is animated, so the browser can run the animation off the main thread.
 * Users who prefer reduced motion get a short fade instead.
 */

const PERSPECTIVE = 'perspective(2000px)'
const STANDARD = 'cubic-bezier(0.4, 0, 0.2, 1)'

const OPEN_MS = 520
const CLOSE_MS = 420

function prefersReducedMotion (): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function canAnimate (element: Element | null | undefined): element is HTMLElement {
  return !!element && typeof (element as HTMLElement).animate === 'function'
}

interface BoxMapping { x: number, y: number, sx: number, sy: number }

const IDENTITY: BoxMapping = { x: 0, y: 0, sx: 1, sy: 1 }

/** Translation and scale that map box `from` onto box `to` (both measured without transforms) */
function mapBox (from: DOMRect, to: DOMRect): BoxMapping {
  return {
    x: to.left + to.width / 2 - (from.left + from.width / 2),
    y: to.top + to.height / 2 - (from.top + from.height / 2),
    sx: from.width > 0 ? to.width / from.width : 1,
    sy: from.height > 0 ? to.height / from.height : 1,
  }
}

/**
 * Transform for one face of the card. The function list is the same in every keyframe, so the browser interpolates
 * translation, rotation and scale separately and both faces stay on the same path. The perspective comes after the
 * translation, so both faces are projected around the card's current centre and meet exactly at 90°.
 */
function faceTransform (mapping: BoxMapping, degrees: number): string {
  return `translate(${mapping.x}px, ${mapping.y}px) ${PERSPECTIVE} rotateY(${degrees}deg) scale(${mapping.sx}, ${mapping.sy})`
}

/** Fixed-position copy of the tile, placed exactly over it inside the dialog's overlay (above the scrim) */
function createGhost (tile: HTMLElement, host: Element, box: DOMRect): HTMLElement {
  const ghost = tile.cloneNode(true) as HTMLElement
  ghost.removeAttribute('id')
  ghost.setAttribute('aria-hidden', 'true')
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    margin: '0',
    boxSizing: 'border-box',
    // The tile itself is hidden while the dialog is open; its copy must not inherit that
    visibility: 'visible',
    pointerEvents: 'none',
    backfaceVisibility: 'hidden',
    transformOrigin: 'center center',
    zIndex: '1',
  })
  host.append(ghost)
  return ghost
}

function fade (dialog: HTMLElement, show: boolean): Animation {
  return dialog.animate(
    show ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
    { duration: show ? 150 : 100, easing: STANDARD, fill: 'forwards' },
  )
}

interface FlipRun {
  /** Resolves when the motion has finished */
  finished: Promise<void>
  /** Removes the ghost and the dialog's end state; call once the dialog is shown or gone */
  cleanup: () => void
}

function run (dialog: HTMLElement, tile: HTMLElement, opening: boolean): FlipRun {
  const tileBox = tile.getBoundingClientRect()
  const dialogBox = dialog.getBoundingClientRect()
  const ghost = createGhost(tile, dialog.parentElement ?? document.body, tileBox)

  const tileFace = [faceTransform(IDENTITY, 0), faceTransform(mapBox(tileBox, dialogBox), 180)]
  const dialogFace = [faceTransform(mapBox(dialogBox, tileBox), -180), faceTransform(IDENTITY, 0)]
  if (!opening) {
    tileFace.reverse()
    dialogFace.reverse()
  }

  const timing: KeyframeAnimationOptions = { duration: opening ? OPEN_MS : CLOSE_MS, easing: STANDARD, fill: 'forwards' }
  dialog.style.backfaceVisibility = 'hidden'
  const animations = [
    ghost.animate(tileFace.map(transform => ({ transform })), timing),
    dialog.animate(dialogFace.map(transform => ({ transform, transformOrigin: 'center center' })), timing),
  ]

  return {
    finished: Promise.all(animations.map(animation => animation.finished)).then(() => undefined, () => undefined),
    cleanup: () => {
      for (const animation of animations) {
        animation.cancel()
      }
      ghost.remove()
      dialog.style.removeProperty('backface-visibility')
    },
  }
}

/**
 * Opens the dialog out of the tile. The tile is hidden while the dialog is open; `showTile` makes it visible again.
 * Falls back to a fade without a tile or with reduced motion.
 */
export async function flipOpen (dialog: Element, tile: Element | null | undefined): Promise<void> {
  if (!canAnimate(dialog)) {
    return
  }
  if (!canAnimate(tile) || !tile.isConnected || prefersReducedMotion()) {
    const animation = fade(dialog, true)
    await animation.finished.catch(() => undefined)
    animation.cancel()
    return
  }
  const flip = run(dialog, tile, true)
  tile.style.visibility = 'hidden'
  await flip.finished
  flip.cleanup()
}

/**
 * Turns the dialog back into the tile. The dialog keeps its end state (hidden) until `cleanup` is called,
 * which has to happen after the dialog has been removed, otherwise it flashes up for one frame.
 */
export async function flipClose (dialog: Element, tile: Element | null | undefined): Promise<() => void> {
  if (!canAnimate(dialog)) {
    return () => undefined
  }
  if (!canAnimate(tile) || !tile.isConnected || prefersReducedMotion()) {
    const animation = fade(dialog, false)
    await animation.finished.catch(() => undefined)
    return () => animation.cancel()
  }
  const flip = run(dialog, tile, false)
  await flip.finished
  return flip.cleanup
}

export function showTile (tile: Element | null | undefined): void {
  ;(tile as HTMLElement | null | undefined)?.style.removeProperty('visibility')
}
