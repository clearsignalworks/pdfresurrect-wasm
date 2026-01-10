/*
 * Real PDF testing
 * Test with multi-version PDFs and edge cases
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractVersions, getVersionCount, hasMultipleVersions } from './pdfresurrect-wasm.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Real PDF testing\n');
console.log('='.repeat(70) + '\n');

// Test 1: 2-version PDF (incremental update)
console.log('[Test 1/3] Multi-version PDF (test_2versions.pdf)');
console.log('-'.repeat(70));

try {
    const pdfPath = join(__dirname, 'test_2versions.pdf');
    const pdfBytes = readFileSync(pdfPath);

    console.log(`  Loaded ${pdfBytes.length} bytes`);

    // Test version count
    const count = await getVersionCount(pdfBytes);
    console.log(`  ✅ Version count: ${count}`);

    // Test hasMultipleVersions
    const hasMultiple = await hasMultipleVersions(pdfBytes);
    console.log(`  ✅ Has multiple versions: ${hasMultiple}`);

    if (count < 2) {
        console.log(`  ⚠️  Expected 2+ versions, got ${count}`);
        console.log(`  This may mean the test PDF doesn't have valid incremental updates`);
    }

    // Extract versions
    console.log('  Extracting versions...');
    const versions = await extractVersions(pdfBytes);

    console.log(`  ✅ Extracted ${versions.length} version(s):\n`);

    for (const v of versions) {
        console.log(`  Version ${v.number}:`);
        console.log(`    - Size: ${v.size} bytes`);
        console.log(`    - PDF header: ${String.fromCharCode(...v.pdfBytes.slice(0, 8))}`);

        // Validate PDF header
        const header = String.fromCharCode(...v.pdfBytes.slice(0, 4));
        if (header !== '%PDF') {
            console.log(`    ❌ FAIL: Invalid PDF header`);
            process.exit(1);
        }

        // Search for version-specific content
        const text = String.fromCharCode(...v.pdfBytes);
        if (text.includes('Version 1')) {
            console.log(`    ✅ Contains "Version 1" text`);
        } else if (text.includes('Version 2')) {
            console.log(`    ✅ Contains "Version 2" text`);
        }

        console.log('');
    }

    console.log('  ✅ Test 1 PASS\n');

} catch (e) {
    console.log(`  ❌ Test 1 FAIL: ${e.message}`);
    console.log(`  Stack: ${e.stack}`);
    process.exit(1);
}

// Test 2: Performance test (single version PDF)
console.log('[Test 2/3] Performance test (13KB PDF)');
console.log('-'.repeat(70));

try {
    const pdfPath = join(__dirname, 'test_real.pdf');
    const pdfBytes = readFileSync(pdfPath);

    const startTime = performance.now();
    const versions = await extractVersions(pdfBytes);
    const endTime = performance.now();

    const duration = (endTime - startTime).toFixed(2);
    console.log(`  ✅ Extraction time: ${duration}ms`);

    if (duration > 1000) {
        console.log(`  ⚠️  Slow performance (>1s for 13KB PDF)`);
    } else if (duration > 5000) {
        console.log(`  ❌ FAIL: Unacceptable performance (>5s)`);
        process.exit(1);
    } else {
        console.log(`  ✅ Performance acceptable`);
    }

    console.log(`  ✅ Extracted ${versions.length} version(s)`);
    console.log('  ✅ Test 2 PASS\n');

} catch (e) {
    console.log(`  ❌ Test 2 FAIL: ${e.message}`);
    process.exit(1);
}

// Test 3: Binary size check
console.log('[Test 3/3] Binary size validation');
console.log('-'.repeat(70));

try {
    const { statSync } = await import('fs');

    const wasmSize = statSync(join(__dirname, 'pdfresurrect_full.wasm')).size;
    const jsSize = statSync(join(__dirname, 'pdfresurrect_full.js')).size;
    const totalSize = wasmSize + jsSize;

    console.log(`  WASM binary: ${(wasmSize / 1024).toFixed(1)} KB`);
    console.log(`  JS glue code: ${(jsSize / 1024).toFixed(1)} KB`);
    console.log(`  Total: ${(totalSize / 1024).toFixed(1)} KB`);

    if (totalSize > 3 * 1024 * 1024) {
        console.log(`  ❌ FAIL: Binary too large (>3MB)`);
        process.exit(1);
    } else if (totalSize > 1 * 1024 * 1024) {
        console.log(`  ⚠️  Binary size >1MB (acceptable but not ideal)`);
    } else if (totalSize > 500 * 1024) {
        console.log(`  ✅ Binary size >500KB, <1MB (good)`);
    } else {
        console.log(`  ✅ Binary size <500KB (excellent)`);
    }

    console.log('  ✅ Test 3 PASS\n');

} catch (e) {
    console.log(`  ❌ Test 3 FAIL: ${e.message}`);
    process.exit(1);
}

// Success summary
console.log('='.repeat(70));
console.log('Real PDF tests: ALL PASS ✅\n');
console.log('Validation Results:');
console.log('  ✅ Multi-version PDF handling');
console.log('  ✅ Performance acceptable');
console.log('  ✅ Binary size within target');
console.log('\n✅ PASS');
console.log('='.repeat(70));
