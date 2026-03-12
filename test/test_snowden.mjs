/*
 * Test with real Snowden PDF known to have multiple versions
 * Menwith Hill satellite classification guide
 * Source: https://libroot.org/posts/going-through-snowden-documents-part-4/
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractVersions, getVersionCount, hasMultipleVersions } from '../pdfresurrect-wasm.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Testing Snowden PDF: Menwith Hill Satellite Classification Guide\n');
console.log('='.repeat(70) + '\n');

const pdfPath = join(__dirname, '..', 'examples', 'Menwith-satellite-classification-guide.pdf');
const pdfBytes = readFileSync(pdfPath);

console.log(`PDF file: ${pdfPath}`);
console.log(`File size: ${pdfBytes.length} bytes (${(pdfBytes.length / 1024).toFixed(1)} KB)\n`);

// Test 1: Check version count
console.log('[1/4] Checking version count...');
try {
    const count = await getVersionCount(pdfBytes);
    console.log(`  ✅ Version count: ${count}`);

    if (count === 1) {
        console.log(`  ❌ CRITICAL: Only 1 version detected!`);
        console.log(`  Expected: Multiple versions (this is known multi-version PDF)`);
        console.log(`  This means multi-version extraction is NOT working.\n`);
        process.exit(1);
    } else {
        console.log(`  ✅ Multiple versions detected!\n`);
    }
} catch (e) {
    console.log(`  ❌ ERROR: ${e.message}\n`);
    process.exit(1);
}

// Test 2: Check hasMultipleVersions
console.log('[2/4] Checking hasMultipleVersions()...');
try {
    const hasMultiple = await hasMultipleVersions(pdfBytes);
    console.log(`  Result: ${hasMultiple}`);

    if (!hasMultiple) {
        console.log(`  ❌ CRITICAL: Returns false, expected true`);
        console.log(`  Multi-version detection is broken.\n`);
        process.exit(1);
    } else {
        console.log(`  ✅ Correctly identified as multi-version PDF\n`);
    }
} catch (e) {
    console.log(`  ❌ ERROR: ${e.message}\n`);
    process.exit(1);
}

// Test 3: Extract all versions
console.log('[3/4] Extracting all versions...');
let cachedVersions;
try {
    const startTime = performance.now();
    cachedVersions = await extractVersions(pdfBytes);
    const endTime = performance.now();

    const duration = (endTime - startTime).toFixed(2);

    console.log(`  ✅ Extracted ${cachedVersions.length} version(s) in ${duration}ms\n`);

    if (cachedVersions.length === 1) {
        console.log(`  ❌ CRITICAL FAILURE: Only extracted 1 version`);
        console.log(`  Expected: 2+ versions from incremental updates`);
        console.log(`  The core feature (version extraction) does NOT work.\n`);
        console.log(`  DO NOT SHIP until this is fixed.\n`);
        process.exit(1);
    }

    // Show details of each version
    for (const v of cachedVersions) {
        console.log(`  Version ${v.number}:`);
        console.log(`    - Size: ${v.size} bytes (${(v.size / 1024).toFixed(1)} KB)`);
        console.log(`    - PDF header: ${String.fromCharCode(...v.pdfBytes.slice(0, 8))}`);

        // Validate PDF header
        const header = String.fromCharCode(...v.pdfBytes.slice(0, 4));
        if (header !== '%PDF') {
            console.log(`    ❌ INVALID PDF HEADER!`);
            process.exit(1);
        }

        // Check for %%EOF marker (use TextDecoder to avoid stack overflow)
        const decoder = new TextDecoder('latin1');
        const text = decoder.decode(v.pdfBytes.slice(0, 10000)); // Check first 10KB
        const eofCount = (text.match(/%%EOF/g) || []).length;
        console.log(`    - Contains ${eofCount} %%EOF marker(s) in header`);
        console.log('');
    }

} catch (e) {
    console.log(`  ❌ ERROR: ${e.message}`);
    console.log(`  Stack: ${e.stack}\n`);
    process.exit(1);
}

// Test 4: Save extracted versions to disk for manual inspection
console.log('[4/4] Saving extracted versions to disk...');
try {
    for (const v of cachedVersions) {
        const filename = join(__dirname, `snowden-version-${v.number}.pdf`);
        writeFileSync(filename, v.pdfBytes);
        console.log(`  ✅ Saved ${filename} (${(v.size / 1024).toFixed(1)} KB)`);
    }

    console.log('\n  Manual verification:');
    console.log('  - Open each version in a PDF viewer');
    console.log('  - Check if content differs between versions');
    console.log('  - Look for redacted or modified text\n');

} catch (e) {
    console.log(`  ❌ ERROR: ${e.message}\n`);
    process.exit(1);
}

// Final verdict
console.log('='.repeat(70));

if (cachedVersions.length > 1) {
    console.log('✅ SUCCESS: Multi-version extraction WORKS!');
    console.log(`✅ Extracted ${cachedVersions.length} versions from Snowden PDF`);
    console.log('✅ pdfresurrect-wasm validated with real multi-version PDF');
    console.log('✅ READY TO SHIP');
} else {
    console.log('❌ FAILURE: Multi-version extraction DOES NOT WORK');
    console.log('❌ Only 1 version extracted from known multi-version PDF');
    console.log('❌ DO NOT SHIP - core feature broken');
    process.exit(1);
}
console.log('='.repeat(70));
