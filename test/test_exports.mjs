/*
 * Check what functions are exported from pdfresurrect WASM
 */

const createModule = (await import('./pdfresurrect_full.js')).default;
const wasm = await createModule();

console.log('Exported functions:');
for (const key of Object.keys(wasm)) {
    if (key.startsWith('_') || typeof wasm[key] === 'function') {
        console.log(`  ${key}: ${typeof wasm[key]}`);
    }
}

console.log('\nFS methods:');
if (wasm.FS) {
    console.log('  FS.writeFile: ' + typeof wasm.FS.writeFile);
    console.log('  FS.readFile: ' + typeof wasm.FS.readFile);
    console.log('  FS.mkdir: ' + typeof wasm.FS.mkdir);
}
