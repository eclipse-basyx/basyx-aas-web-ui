import vizGlobalUrl from '@plantuml/core/viz-global.js?url'

type PlantUmlRender = (
  lines: string[],
  targetId: string,
  options?: { dark?: boolean },
) => void
type PlantUmlCore = {
  render: PlantUmlRender
}
type GlobalWithViz = typeof globalThis & {
  Viz?: {
    instance?: unknown
  }
}

// SVG namespace identifiers use http by specification; this is not a network URL.
// eslint-disable-next-line unicorn/prefer-https
const SVG_XMLNS = 'http://www.w3.org/2000/svg'
const RENDER_TIMEOUT_MS = 15_000

let plantUmlCorePromise: Promise<PlantUmlCore> | null = null
let vizGlobalScriptPromise: Promise<void> | null = null
let renderTargetCounter = 0

export async function renderPlantUmlToSvg (source: string): Promise<string> {
  const { render } = await loadPlantUmlCore()

  return renderToHiddenTarget(render, source.split(/\r\n|\r|\n/))
}

async function loadPlantUmlCore (): Promise<PlantUmlCore> {
  await loadVizGlobalScript()

  plantUmlCorePromise ??= import('@plantuml/core')

  return plantUmlCorePromise
}

function loadVizGlobalScript (): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.resolve()
  }

  if (hasVizGlobal()) {
    return Promise.resolve()
  }

  vizGlobalScriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')

    script.async = true
    script.dataset.plantumlVizGlobal = 'true'
    script.src = vizGlobalUrl
    script.addEventListener('load', () => {
      if (hasVizGlobal()) {
        resolve()
      } else {
        reject(new Error('PlantUML Graphviz runtime did not initialize.'))
      }
    }, { once: true })
    script.addEventListener('error', () => {
      reject(new Error('PlantUML Graphviz runtime could not be loaded.'))
    }, { once: true })

    document.head.append(script)
  })

  return vizGlobalScriptPromise
}

function hasVizGlobal (): boolean {
  return typeof (globalThis as GlobalWithViz).Viz?.instance === 'function'
}

function renderToHiddenTarget (
  render: PlantUmlRender,
  lines: string[],
): Promise<string> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('PlantUML rendering is only available in the browser.'))
  }

  const target = document.createElement('div')
  target.id = `plantuml-render-${Date.now()}-${renderTargetCounter++}`
  target.hidden = true
  document.body.append(target)

  return new Promise((resolve, reject) => {
    let settled = false

    const cleanup = (): void => {
      settled = true
      window.clearTimeout(timeoutId)
      observer.disconnect()
      window.removeEventListener('error', onRuntimeError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      target.remove()
    }

    const settleWithSvg = (svg: string): void => {
      if (settled) {
        return
      }

      cleanup()
      resolve(svg)
    }

    const settleWithError = (error: unknown): void => {
      if (settled) {
        return
      }

      cleanup()
      reject(error instanceof Error ? error : new Error(String(error)))
    }

    const readRenderedSvg = (): void => {
      const svg = target.querySelector('svg')

      if (!svg) {
        return
      }

      if (!svg.getAttribute('xmlns')) {
        svg.setAttribute('xmlns', SVG_XMLNS)
      }

      settleWithSvg(new XMLSerializer().serializeToString(svg))
    }

    const onRuntimeError = (event: ErrorEvent): void => {
      if (!isPlantUmlRuntimeIssue(event.error, event.filename, event.message)) {
        return
      }

      event.preventDefault()
      settleWithError(new Error(event.message || 'PlantUML rendering failed.'))
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
      if (!isPlantUmlRuntimeIssue(event.reason)) {
        return
      }

      event.preventDefault()
      settleWithError(event.reason)
    }

    const observer = new MutationObserver(readRenderedSvg)
    const timeoutId = window.setTimeout(() => {
      settleWithError(new Error('PlantUML rendering timed out. The PlantUML source is still available for export.'))
    }, RENDER_TIMEOUT_MS)

    observer.observe(target, {
      childList: true,
      subtree: true,
    })
    window.addEventListener('error', onRuntimeError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    try {
      render(lines, target.id)
      readRenderedSvg()
    } catch (error) {
      settleWithError(error)
    }
  })
}

function isPlantUmlRuntimeIssue (
  error: unknown,
  fileName = '',
  message = '',
): boolean {
  const errorText = [
    message,
    fileName,
    error instanceof Error ? error.message : '',
    error instanceof Error ? error.stack : '',
    typeof error === 'string' ? error : '',
  ].join('\n')

  return /plantuml|viz-global|\$jsException/i.test(errorText)
}
