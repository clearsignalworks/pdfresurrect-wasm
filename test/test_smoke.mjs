/*
 * Smoke test: verify pdfresurrect_full WASM module loads and exposes expected API.
 * Does NOT require any PDF fixture file.
 */

import { extractVersions, getVersionCount, hasMultipleVersions } from '../pdfresurrect-wasm.mjs';

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

console.log('Smoke test: pdfresurrect-wasm module load\n');

// Verify the public API exports exist
assert(typeof extractVersions === 'function', 'extractVersions must be a function');
assert(typeof getVersionCount === 'function', 'getVersionCount must be a function');
assert(typeof hasMultipleVersions === 'function', 'hasMultipleVersions must be a function');
console.log('PASS: public API exports present');

// Verify the WASM module itself loads and exposes expected internals.
// Import pdfresurrect_full.js directly to bypass the wrapper's input-size guard.
try {
    const createModule = (await import('../pdfresurrect_full.js')).default;
    const wasm = await createModule();

    assert(typeof wasm.FS === 'object', 'wasm.FS must be an object');
    assert(typeof wasm.callMain === 'function', 'wasm.callMain must be a function');
    assert(wasm.HEAPU8 instanceof Uint8Array, 'wasm.HEAPU8 must be a Uint8Array');
    console.log('PASS: WASM module loaded, FS / callMain / HEAPU8 present');
} catch (e) {
    console.error(`FAIL: WASM module failed to load: ${e.message}`);
    process.exit(1);
}

console.log('\nSMOKE TEST PASSED');
