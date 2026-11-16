import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(fileURLToPath(new URL('./entry.png', import.meta.url)), join(outDir, 'entry.png'));
console.log(`copied entry.png -> ${join(outDir, 'entry.png')}`);
