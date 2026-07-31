import { spawn } from 'node:child_process'

const signals = ['SIGINT', 'SIGTERM']
const child = spawn(process.execPath, [
  ...process.argv.slice(2),
  'dist-bff/edc-bff/server.js',
], {
  env: {
    ...process.env,
    NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? '1',
  },
  stdio: 'inherit',
})

const signalHandlers = new Map(signals.map(signal => [
  signal,
  () => child.kill(signal),
]))

for (const [signal, handler] of signalHandlers) {
  process.once(signal, handler)
}

function removeSignalHandlers () {
  for (const [signal, handler] of signalHandlers) {
    process.removeListener(signal, handler)
  }
}

child.once('error', error => {
  removeSignalHandlers()
  console.error('Failed to start the Catena-X EDC BFF:', error)
  process.exitCode = 1
})

child.once('exit', code => {
  removeSignalHandlers()
  process.exitCode = code ?? 1
})
