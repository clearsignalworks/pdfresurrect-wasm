# pdfresurrect-wasm

## Purpose

WebAssembly port of pdfresurrect for extracting hidden versions from PDF incremental updates. Enables browser-based PDF forensics without server-side processing.

## Users

- **JavaScript developers**: NPM package for PDF version extraction
- **Security researchers**: Browser-based document analysis

## Capabilities

### Version Extraction
- Extract all versions from PDF incremental updates
- Get version count without full extraction
- Quick check for incremental updates

### API
- `extractVersions(pdfBytes)` - Extract all versions
- `getVersionCount(pdfBytes)` - Count versions
- `hasMultipleVersions(pdfBytes)` - Quick boolean check

### Distribution
- NPM package (pdfresurrect-wasm)
- Browser-compatible WASM
- TypeScript definitions

## Non-Goals

- PDF modification/editing
- Version merging
