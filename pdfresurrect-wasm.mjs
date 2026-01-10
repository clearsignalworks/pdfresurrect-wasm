/**
 * pdfresurrect-wasm - Extract PDF version history in the browser
 *
 * Wraps the pdfresurrect C tool compiled to WebAssembly with a clean
 * TypeScript/JavaScript API for extracting incremental update versions
 * from PDF files.
 */

let wasmModule = null;
let wasmInitPromise = null;

/**
 * Initialize the WASM module (cached, only loads once)
 */
async function getWasmModule() {
    if (wasmModule) {
        return wasmModule;
    }

    if (wasmInitPromise) {
        return wasmInitPromise;
    }

    wasmInitPromise = (async () => {
        const createModule = (await import('./pdfresurrect_full.js')).default;

        // Create module without options - this allows print/printErr to be
        // mutable and overridable by callers
        wasmModule = await createModule();

        return wasmModule;
    })();

    return wasmInitPromise;
}

/**
 * Version information for a single PDF version
 * @typedef {Object} PDFVersion
 * @property {number} number - Version number (1-indexed)
 * @property {Uint8Array} pdfBytes - The PDF file bytes for this version
 * @property {number} size - Size in bytes
 * @property {string} [timestamp] - Timestamp if available from metadata
 */

/**
 * Extract all versions from a PDF with incremental updates
 *
 * @param {Uint8Array} pdfBytes - The PDF file bytes
 * @returns {Promise<PDFVersion[]>} Array of versions, oldest first
 *
 * @example
 * const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
 * const versions = await extractVersions(new Uint8Array(pdfBytes));
 * console.log(`Found ${versions.length} versions`);
 * versions.forEach(v => console.log(`Version ${v.number}: ${v.size} bytes`));
 */
export async function extractVersions(pdfBytes) {
    if (!(pdfBytes instanceof Uint8Array)) {
        throw new TypeError('pdfBytes must be a Uint8Array');
    }

    if (pdfBytes.length < 1024) {
        throw new Error('PDF file too small (must be >1024 bytes)');
    }

    const wasm = await getWasmModule();

    // Clean up any previous runs
    try {
        // Remove old directory and all files in it
        const files = wasm.FS.readdir('/input-versions');
        for (const file of files) {
            if (file !== '.' && file !== '..') {
                try {
                    wasm.FS.unlink(`/input-versions/${file}`);
                } catch (e) {
                    // Ignore errors
                }
            }
        }
        wasm.FS.rmdir('/input-versions');
    } catch (e) {
        // Directory doesn't exist, that's fine
    }

    try {
        wasm.FS.unlink('/input.pdf');
    } catch (e) {
        // File doesn't exist, that's fine
    }

    try {
        wasm.FS.unlink('/input.summary');
    } catch (e) {
        // File doesn't exist, that's fine
    }

    // Write PDF to virtual filesystem
    wasm.FS.writeFile('/input.pdf', pdfBytes);

    try {
        // Extract versions with -w flag (writes to /input-versions/ directory)
        // Suppress output to console
        const originalPrint = wasm.print;
        const originalPrintErr = wasm.printErr;

        wasm.print = () => {};  // Suppress stdout
        wasm.printErr = () => {}; // Suppress stderr

        const extractExitCode = wasm.callMain(['/input.pdf', '-w']);

        // Restore output
        wasm.print = originalPrint;
        wasm.printErr = originalPrintErr;

        if (extractExitCode !== 0) {
            throw new Error(`pdfresurrect failed with exit code ${extractExitCode}`);
        }

        // Read extracted version files from virtual filesystem
        const versions = [];
        const dirName = '/input-versions';

        let files;
        try {
            files = wasm.FS.readdir(dirName);
        } catch (e) {
            // Directory doesn't exist = only 1 version (pdfresurrect exits early)
            return [{
                number: 1,
                pdfBytes: pdfBytes,
                size: pdfBytes.length
            }];
        }

        // Filter for PDF files and sort by version number
        const pdfFiles = files
            .filter(f => f.endsWith('.pdf'))
            .map(f => {
                // Extract version number from filename like "input-version-1.pdf"
                const match = f.match(/version-(\d+)\.pdf$/);
                return match ? { filename: f, version: parseInt(match[1], 10) } : null;
            })
            .filter(x => x !== null)
            .sort((a, b) => a.version - b.version);

        // Read each version file
        for (const { filename, version } of pdfFiles) {
            const filePath = `${dirName}/${filename}`;
            const bytes = wasm.FS.readFile(filePath);

            versions.push({
                number: version,
                pdfBytes: bytes,
                size: bytes.length
            });
        }

        if (versions.length === 0) {
            throw new Error('No version files were extracted');
        }

        return versions;

    } catch (e) {
        // Re-throw with more context if needed
        throw e;
    }
}

/**
 * Get just the count of versions in a PDF
 *
 * @param {Uint8Array} pdfBytes - The PDF file bytes
 * @returns {Promise<number>} Number of versions
 */
export async function getVersionCount(pdfBytes) {
    const versions = await extractVersions(pdfBytes);
    return versions.length;
}

/**
 * Check if a PDF has multiple versions (incremental updates)
 *
 * @param {Uint8Array} pdfBytes - The PDF file bytes
 * @returns {Promise<boolean>} True if PDF has 2+ versions
 */
export async function hasMultipleVersions(pdfBytes) {
    const count = await getVersionCount(pdfBytes);
    return count > 1;
}
