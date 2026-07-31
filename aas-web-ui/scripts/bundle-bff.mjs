// Bundles the compiled Catena-X EDC BFF server into a single, self-contained
// JavaScript file using esbuild's JS API (instead of the esbuild CLI binary).
//
// This avoids shipping node_modules to the Docker runtime stages: the bundle
// embeds all of its runtime dependencies.
import { build } from 'esbuild'

await build({
  entryPoints: ['dist-bff/edc-bff/start.js'],
  outfile: 'dist-bff/edc-bff/server.bundle.cjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  packages: 'bundle',
  logLevel: 'info',
  // server.js contains an `import.meta.url` self-start guard used only when
  // running it directly under ESM (e.g. via `pnpm bff:start`). It is dead
  // code in this CJS bundle (start.ts calls startEdcBffServer() explicitly),
  // so esbuild's related warning can be safely ignored.
  logOverride: { 'empty-import-meta': 'silent' },
})
