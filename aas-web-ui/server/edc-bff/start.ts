// Explicit entry point for the bundled Catena-X EDC BFF server.
//
// server.ts also auto-starts itself when run directly, using an
// `import.meta.url` check that only works correctly under ESM. Since the
// production bundle is built as CommonJS, that guard never fires. This file
// starts the server explicitly instead, and is used as the esbuild entry
// point for the bundle (see scripts/bundle-bff.mjs).
import { startEdcBffServer } from './server.js'

startEdcBffServer()
