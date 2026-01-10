/*
 * Test the pdfresurrect-wasm JavaScript API
 * Full API wrapper validation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractVersions, getVersionCount, hasMultipleVersions } from './pdfresurrect-wasm.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Full API wrapper test\n');
console.log('='.repeat(70) + '\n');

// Test with single-version PDF
console.log('[Test 1/3] Single-version PDF (dummy.pdf)');
console.log('-'.repeat(70));

try {
    const pdfPath = join(__dirname, 'test_real.pdf');
    const pdfBytes = readFileSync(pdfPath);

    console.log(`  Loaded ${pdfBytes.length} bytes from ${pdfPath}`);

    // Test version count
    console.log('  Testing getVersionCount()...');
    const count = await getVersionCount(pdfBytes);
    console.log(`  ✅ Version count: ${count}`);

    if (count !== 1) {
        console.log(`  ❌ FAIL: Expected 1 version, got ${count}`);
        process.exit(1);
    }

    // Test hasMultipleVersions
    console.log('  Testing hasMultipleVersions()...');
    const hasMultiple = await hasMultipleVersions(pdfBytes);
    console.log(`  ✅ Has multiple versions: ${hasMultiple}`);

    if (hasMultiple !== false) {
        console.log(`  ❌ FAIL: Expected false, got ${hasMultiple}`);
        process.exit(1);
    }

    // Test extractVersions
    console.log('  Testing extractVersions()...');
    const versions = await extractVersions(pdfBytes);
    console.log(`  ✅ Extracted ${versions.length} version(s)`);

    if (versions.length !== 1) {
        console.log(`  ❌ FAIL: Expected 1 version, got ${versions.length}`);
        process.exit(1);
    }

    const v1 = versions[0];
    console.log(`  Version ${v1.number}:`);
    console.log(`    - Size: ${v1.size} bytes`);
    console.log(`    - PDF bytes type: ${v1.pdfBytes.constructor.name}`);
    console.log(`    - Starts with: ${String.fromCharCode(...v1.pdfBytes.slice(0, 8))}`);

    // Validate PDF header
    const pdfHeader = String.fromCharCode(...v1.pdfBytes.slice(0, 4));
    if (pdfHeader !== '%PDF') {
        console.log(`  ❌ FAIL: Invalid PDF header: ${pdfHeader}`);
        process.exit(1);
    }

    console.log(`  ✅ Valid PDF header detected`);
    console.log('  ✅ Test 1 PASS\n');

} catch (e) {
    console.log(`  ❌ Test 1 FAIL: ${e.message}`);
    console.log(`  Stack: ${e.stack}`);
    process.exit(1);
}

// Test error handling
console.log('[Test 2/3] Error handling');
console.log('-'.repeat(70));

try {
    console.log('  Testing invalid input (not Uint8Array)...');
    try {
        await extractVersions("not an array");
        console.log('  ❌ FAIL: Should have thrown TypeError');
        process.exit(1);
    } catch (e) {
        if (e instanceof TypeError) {
            console.log(`  ✅ Correctly threw TypeError: ${e.message}`);
        } else {
            throw e;
        }
    }

    console.log('  Testing file too small...');
    try {
        await extractVersions(new Uint8Array(100)); // Too small
        console.log('  ❌ FAIL: Should have thrown Error');
        process.exit(1);
    } catch (e) {
        if (e.message.includes('too small')) {
            console.log(`  ✅ Correctly threw Error: ${e.message}`);
        } else {
            throw e;
        }
    }

    console.log('  Testing corrupt PDF data...');
    try {
        const garbage = new Uint8Array(2000).fill(65); // 'A' repeated
        await extractVersions(garbage);
        console.log('  ❌ FAIL: Should have thrown Error');
        process.exit(1);
    } catch (e) {
        if (e.message.includes('failed')) {
            console.log(`  ✅ Correctly threw Error: ${e.message}`);
        } else {
            console.log(`  ⚠️  Unexpected error: ${e.message}`);
        }
    }

    console.log('  ✅ Test 2 PASS\n');

} catch (e) {
    console.log(`  ❌ Test 2 FAIL: ${e.message}`);
    console.log(`  Stack: ${e.stack}`);
    process.exit(1);
}

// Test API contract
console.log('[Test 3/3] API contract validation');
console.log('-'.repeat(70));

try {
    const pdfPath = join(__dirname, 'test_real.pdf');
    const pdfBytes = readFileSync(pdfPath);
    const versions = await extractVersions(pdfBytes);

    console.log('  Checking Version object structure...');

    const v = versions[0];

    // Check all required properties exist
    if (typeof v.number !== 'number') {
        console.log('  ❌ FAIL: version.number is not a number');
        process.exit(1);
    }
    console.log(`  ✅ version.number is number: ${v.number}`);

    if (!(v.pdfBytes instanceof Uint8Array)) {
        console.log('  ❌ FAIL: version.pdfBytes is not Uint8Array');
        process.exit(1);
    }
    console.log(`  ✅ version.pdfBytes is Uint8Array`);

    if (typeof v.size !== 'number') {
        console.log('  ❌ FAIL: version.size is not a number');
        process.exit(1);
    }
    console.log(`  ✅ version.size is number: ${v.size}`);

    // Check size matches pdfBytes.length
    if (v.size !== v.pdfBytes.length) {
        console.log(`  ❌ FAIL: size ${v.size} !== pdfBytes.length ${v.pdfBytes.length}`);
        process.exit(1);
    }
    console.log(`  ✅ version.size matches pdfBytes.length`);

    // Check version numbering starts at 1
    if (v.number !== 1) {
        console.log(`  ❌ FAIL: First version number should be 1, got ${v.number}`);
        process.exit(1);
    }
    console.log(`  ✅ Version numbering starts at 1`);

    console.log('  ✅ Test 3 PASS\n');

} catch (e) {
    console.log(`  ❌ Test 3 FAIL: ${e.message}`);
    console.log(`  Stack: ${e.stack}`);
    process.exit(1);
}

// Success summary
console.log('='.repeat(70));
console.log('API wrapper tests: ALL PASS ✅\n');
console.log('API Functions Validated:');
console.log('  ✅ extractVersions(pdfBytes)');
console.log('  ✅ getVersionCount(pdfBytes)');
console.log('  ✅ hasMultipleVersions(pdfBytes)');
console.log('\nAPI Contract Validated:');
console.log('  ✅ Returns Version[] array');
console.log('  ✅ Version has {number, pdfBytes, size}');
console.log('  ✅ pdfBytes is Uint8Array');
console.log('  ✅ Valid PDF header in extracted bytes');
console.log('  ✅ Error handling for invalid inputs');
console.log('\n✅ PASS');
console.log('='.repeat(70));
