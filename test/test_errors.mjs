/*
 * Error path tests: verify input validation and graceful handling of bad input.
 */

import { extractVersions } from '../pdfresurrect-wasm.mjs';

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

async function assertThrows(fn, expectedType, messagePart, label) {
    try {
        await fn();
        console.error(`FAIL: ${label} - expected to throw but did not`);
        process.exit(1);
    } catch (e) {
        assert(e instanceof expectedType,
            `${label} - expected ${expectedType.name} but got ${e.constructor.name}: ${e.message}`);
        if (messagePart) {
            assert(e.message.includes(messagePart),
                `${label} - expected message to include "${messagePart}" but got: ${e.message}`);
        }
    }
}

console.log('Error path tests: pdfresurrect-wasm\n');

// 1. Non-Uint8Array input
await assertThrows(
    () => extractVersions('not a uint8array'),
    TypeError,
    'Uint8Array',
    'string input throws TypeError'
);
console.log('PASS: string input throws TypeError');

await assertThrows(
    () => extractVersions(new ArrayBuffer(2048)),
    TypeError,
    'Uint8Array',
    'ArrayBuffer input throws TypeError'
);
console.log('PASS: ArrayBuffer input throws TypeError');

await assertThrows(
    () => extractVersions(null),
    TypeError,
    null,
    'null input throws TypeError'
);
console.log('PASS: null input throws TypeError');

// 2. Too-small file
await assertThrows(
    () => extractVersions(new Uint8Array(512)),
    Error,
    'too small',
    'small file throws Error'
);
console.log('PASS: small file (<1024 bytes) throws Error');

// 3. Non-PDF bytes (valid size, no %PDF header). Deterministic pattern so
//    the case is repeatable. The documented contract is: the C tool exits
//    non-zero, the wrapper does NOT throw, it warns once and resolves with
//    a single-version fallback whose bytes are a copy of the input.
const nonPdfBytes = new Uint8Array(2048);
for (let i = 0; i < nonPdfBytes.length; i++) {
    nonPdfBytes[i] = (i * 31 + 7) & 0xff;
}

const warnings = [];
const originalWarn = console.warn;
console.warn = (msg) => { warnings.push(String(msg)); };
let result;
try {
    result = await extractVersions(nonPdfBytes);
} finally {
    console.warn = originalWarn;
}
assert(Array.isArray(result), 'non-PDF bytes result should be an array');
assert(result.length === 1, 'non-PDF bytes should return single-version fallback');
assert(result[0].number === 1, 'fallback version number should be 1');
assert(result[0].size === nonPdfBytes.length, 'fallback size should match input length');
assert(result[0].pdfBytes !== nonPdfBytes, 'fallback pdfBytes should be a copy, not the input');
assert(result[0].pdfBytes.every((b, i) => b === nonPdfBytes[i]), 'fallback pdfBytes should equal the input');
assert(warnings.length === 1 && warnings[0].includes('Falling back to single-version mode'),
    `exactly one fallback warning expected, got ${warnings.length}: ${warnings.join(' | ')}`);
console.log('PASS: non-PDF bytes return single-version fallback with one warning');

// Reset process.exitCode — Emscripten's callMain can set it when the C code
// returns a non-zero exit status, even though the JS wrapper handles it.
process.exitCode = 0;

console.log('\nERROR PATH TESTS PASSED');
