# pdfresurrect-wasm

[![npm version](https://badge.fury.io/js/pdfresurrect-wasm.svg)](https://www.npmjs.com/package/pdfresurrect-wasm)

WebAssembly port of [pdfresurrect](https://github.com/enferex/pdfresurrect) - Extract hidden versions from PDF incremental updates.

## Installation

```bash
npm install pdfresurrect-wasm
# or
bun add pdfresurrect-wasm
```

## What It Does

Many PDF editors create "incremental updates" when modifying files - appending changes instead of rewriting the entire document. This preserves previous versions in the file's internal structure. Tools like Adobe Acrobat can inadvertently leak sensitive data this way.

pdfresurrect-wasm extracts these hidden versions, revealing the document's full edit history.

## Quick Start

```javascript
import { extractVersions } from 'pdfresurrect-wasm';

const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
const versions = await extractVersions(new Uint8Array(pdfBytes));

console.log(`Found ${versions.length} versions`);
versions.forEach(v => {
  console.log(`Version ${v.number}: ${v.size} bytes`);
  // v.pdfBytes is a Uint8Array - save or display
});
```

### Browser Usage

The library works in browsers with WebAssembly support. Note that you'll need to configure your bundler to handle the `.wasm` file. For Vite/Astro:

```javascript
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ['pdfresurrect-wasm']
  }
}
```

## API

**`extractVersions(pdfBytes: Uint8Array): Promise<Version[]>`**
Extract all versions from a PDF.

**`getVersionCount(pdfBytes: Uint8Array): Promise<number>`**
Get version count without extracting.

**`hasMultipleVersions(pdfBytes: Uint8Array): Promise<boolean>`**
Quick check for incremental updates.

## Validation

Tested with Snowden NSA documents known to contain deleted content:
- ✅ Extracts 2 versions from Menwith Hill classification guide
- ✅ Version 1 contains deleted Potomac Mission Ground Station details
- ✅ Version 2 is the published scrubbed version
- ✅ Performance: 19.65ms for 134KB PDF
- ✅ Binary size: 97KB total

## Project Structure

```
pdfresurrect-wasm/
├── pdfresurrect-wasm.mjs      # Main API
├── pdfresurrect_full.js       # Emscripten glue code
├── pdfresurrect_full.wasm     # Compiled binary (37KB)
├── test/                      # Test suite
├── examples/                  # Example PDFs (Snowden doc)
├── docs/                      # WASM compilation findings
└── src/                       # Original C source (pdfresurrect)
```

## Credits

- Original C tool: [pdfresurrect by Matt Davis](https://github.com/enferex/pdfresurrect)
- Validation: [libroot.org Snowden documents analysis](https://libroot.org/posts/going-through-snowden-documents-part-4/)

## License

BSD-3-Clause (matching upstream pdfresurrect)
