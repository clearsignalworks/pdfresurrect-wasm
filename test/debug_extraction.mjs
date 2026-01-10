/*
 * Debug: What files does pdfresurrect actually create?
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const createModule = (await import('./pdfresurrect_full.js')).default;
const wasm = await createModule();

console.log('Loading Snowden PDF...\n');
const pdfPath = join(__dirname, 'Menwith-satellite-classification-guide.pdf');
const pdfBytes = readFileSync(pdfPath);

// Write to virtual FS
wasm.FS.writeFile('/input.pdf', pdfBytes);

console.log('Running: pdfresurrect /input.pdf -w\n');

// Suppress output
wasm.print = () => {};
wasm.printErr = () => {};

const exitCode = wasm.callMain(['/input.pdf', '-w']);

console.log(`Exit code: ${exitCode}\n`);

// List what was created
console.log('Files created in /input-versions/:');
try {
    const files = wasm.FS.readdir('/input-versions');
    for (const file of files) {
        if (file !== '.' && file !== '..') {
            const path = `/input-versions/${file}`;
            const stat = wasm.FS.stat(path);
            console.log(`  ${file}: ${stat.size} bytes`);

            // Read and check first few bytes
            const bytes = wasm.FS.readFile(path);
            const header = String.fromCharCode(...bytes.slice(0, 20));
            console.log(`    Header: ${header.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);
        }
    }
} catch (e) {
    console.log(`  Error reading directory: ${e.message}`);
}

console.log('\nChecking root directory for other files:');
const rootFiles = wasm.FS.readdir('/');
for (const file of rootFiles) {
    if (file.startsWith('input')) {
        const stat = wasm.FS.stat(`/${file}`);
        console.log(`  /${file}: ${stat.size} bytes`);
    }
}
