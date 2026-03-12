/**
 * pdfresurrect-wasm - Extract hidden versions from PDF incremental updates
 *
 * WebAssembly port of pdfresurrect (https://github.com/enferex/pdfresurrect)
 */

/**
 * A single version extracted from a PDF's incremental update history
 */
export interface PDFVersion {
  /** 1-indexed version number (1 is the earliest/original version) */
  number: number;
  /** Complete PDF bytes for this version (valid, openable PDF) */
  pdfBytes: Uint8Array;
  /** Size of pdfBytes in bytes */
  size: number;
}

/**
 * Extract all versions from a PDF file's incremental update history.
 *
 * Many PDF editors append changes instead of rewriting files, preserving
 * previous versions. This function extracts each version as a complete,
 * valid PDF.
 *
 * @param pdfBytes - Raw bytes of the PDF file
 * @returns Array of Version objects, ordered from earliest (1) to latest
 * @throws Error if PDF is too small (<1024 bytes) or invalid
 *
 * @example
 * ```typescript
 * const pdfBytes = new Uint8Array(await fetch('doc.pdf').then(r => r.arrayBuffer()));
 * const versions = await extractVersions(pdfBytes);
 *
 * console.log(`Found ${versions.length} versions`);
 * // Save version 1 (original)
 * saveFile(versions[0].pdfBytes, 'original.pdf');
 * ```
 */
export function extractVersions(pdfBytes: Uint8Array): Promise<PDFVersion[]>;

/**
 * Get the number of versions in a PDF without extracting them.
 *
 * @param pdfBytes - Raw bytes of the PDF file
 * @returns Number of versions found
 */
export function getVersionCount(pdfBytes: Uint8Array): Promise<number>;

/**
 * Quick check if a PDF has multiple versions (incremental updates).
 *
 * @param pdfBytes - Raw bytes of the PDF file
 * @returns true if the PDF has more than one version
 */
export function hasMultipleVersions(pdfBytes: Uint8Array): Promise<boolean>;
