/*
 * Read the summary file to understand what pdfresurrect detected
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const createModule = (await import('./pdfresurrect_full.js')).default;
const wasm = await createModule();

const pdfPath = join(__dirname, 'Menwith-satellite-classification-guide.pdf');
const pdfBytes = readFileSync(pdfPath);

wasm.FS.writeFile('/input.pdf', pdfBytes);

wasm.print = () => {};
wasm.printErr = () => {};

wasm.callMain(['/input.pdf', '-w']);

// Read the summary
const summary = wasm.FS.readFile('/input-versions/input-versions.summary', { encoding: 'utf8' });
console.log('pdfresurrect summary output:\n');
console.log(summary);
