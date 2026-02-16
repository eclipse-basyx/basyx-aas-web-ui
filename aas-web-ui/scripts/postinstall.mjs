import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, '..');

const workerSource = join(projectRoot, 'node_modules', '@thatopen', 'fragments', 'dist', 'Worker', 'worker.mjs');
const workerTarget = join(projectRoot, 'public', 'worker.mjs');

const wasmSourceDir = join(projectRoot, 'node_modules', 'web-ifc');
const wasmTargetDir = join(projectRoot, 'public', 'wasm');

await mkdir(wasmTargetDir, { recursive: true });

await copyFile(workerSource, workerTarget);

const sourceEntries = await readdir(wasmSourceDir);
const wasmFiles = sourceEntries.filter((fileName) => fileName.endsWith('.wasm'));

await Promise.all(wasmFiles.map((fileName) => copyFile(join(wasmSourceDir, fileName), join(wasmTargetDir, fileName))));
