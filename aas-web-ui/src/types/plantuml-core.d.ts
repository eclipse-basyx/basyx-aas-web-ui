declare module '@plantuml/core' {
  export function render (
    lines: string[],
    targetId: string,
    options?: { dark?: boolean },
  ): void

  export function renderToString (
    lines: string[],
    onSuccess: (svg: string) => void,
    onError: (message: string) => void,
  ): void
}

declare module '@plantuml/core/viz-global.js'
