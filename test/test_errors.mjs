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

// 3. Random bytes (valid size, not a PDF)
const randomBytes = new Uint8Array(2048);
for (let i = 0; i < randomBytes.length; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
}

try {
    const result = await extractVersions(randomBytes);
    // If it returns, it should be a single-version fallback
    assert(Array.isArray(result), 'random bytes result should be an array');
    assert(result.length === 1, 'random bytes should return single version fallback');
    assert(result[0].size === randomBytes.length, 'fallback size should match input length');
    console.log('PASS: random bytes returns single-version fallback');
} catch (e) {
    // Throwing is also acceptable for non-PDF content
    assert(e instanceof Error, 'random bytes error should be an Error');
    console.log(`PASS: random bytes throws Error ("${e.message}")`);
}

// Reset process.exitCode — Emscripten's callMain can set it when the C code
// returns a non-zero exit status, even though the JS wrapper handles it.
process.exitCode = 0;

console.log('\nERROR PATH TESTS PASSED');
