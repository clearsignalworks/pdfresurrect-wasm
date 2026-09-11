# pdfresurrect-wasm

WebAssembly port of [pdfresurrect](https://github.com/enferex/pdfresurrect) - Extract hidden versions from PDF incremental updates.

## Installation

```bash
npm install @clearsignalworks/pdfresurrect-wasm
# or
bun add @clearsignalworks/pdfresurrect-wasm
```

## What It Does

Many PDF editors create "incremental updates" when modifying files - appending changes instead of rewriting the entire document. This preserves previous versions in the file's internal structure. Tools like Adobe Acrobat can inadvertently leak sensitive data this way.

pdfresurrect-wasm extracts these hidden versions, revealing the document's full edit history.

## Quick Start

```javascript
import { extractVersions } from '@clearsignalworks/pdfresurrect-wasm';

const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
const versions = await extractVersions(new Uint8Array(pdfBytes));

console.log(`Found ${versions.length} versions`);
versions.forEach(v => {
  console.log(`Version ${v.number}: ${v.size} bytes`);
  // v.pdfBytes is a Uint8Array - save or display
});
```

### Browser Usage

Requires BigInt support (Chrome 67+, Firefox 68+, Safari 14+, Node 16+). Emscripten 4.x enables wasm-bigint by default, requiring BigInt support in the JS engine.

You'll need to configure your bundler to handle the `.wasm` file:

```javascript
// Vite / Astro
export default {
  optimizeDeps: {
    exclude: ['@clearsignalworks/pdfresurrect-wasm']
  }
}

// webpack 5
module.exports = {
  experiments: { asyncWebAssembly: true }
}
```

**Note:** This is an ESM-only package (`"type": "module"`). For CommonJS projects, use dynamic `import()`.

## API

**`extractVersions(pdfBytes: Uint8Array): Promise<PDFVersion[]>`**
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
- ✅ Performance: 21ms for 134KB PDF
- ✅ Binary size: 99KB total (37KB WASM + 60KB glue JS)

## Package Contents

```
pdfresurrect-wasm/
├── pdfresurrect-wasm.mjs      # Main API (ESM)
├── pdfresurrect-wasm.d.ts     # TypeScript definitions
├── pdfresurrect_full.js       # Emscripten glue code
├── pdfresurrect_full.wasm     # Compiled binary (38KB)
├── ChangeLog
├── README.md
└── LICENSE                    # BSD-3-Clause
```

## Performance

Extraction time scales superlinearly (~O(n²)) because pdfresurrect copies the full file for each version: extracting version N requires writing the first N × EOF-offset bytes into WASM's in-memory filesystem. File I/O is negligible (~6ms for a 19MB read); the cost is entirely in `callMain()`.

| PDF Size | Versions | Avg Extraction Time |
|----------|----------|---------------------|
| 134 KB   | 2        | 21 ms               |
| 978 KB   | 10       | 174 ms              |
| 4.8 MB   | 50       | 2.5 s               |
| 19 MB    | 100      | 19.9 s              |

**`extractVersions()` runs synchronously on the calling thread.** For PDFs larger than ~5 MB or with more than ~20 versions, run extraction in a Web Worker to avoid freezing the UI:

```js
// worker.js
import { extractVersions } from '@clearsignalworks/pdfresurrect-wasm';
self.onmessage = async ({ data }) => {
  const versions = await extractVersions(data);
  self.postMessage(versions);
};
```

## Maintaining

`main` carries the WebAssembly port and is what npm publishes. `master` tracks upstream pdfresurrect with no local changes. [MAINTAINING.md](./MAINTAINING.md) has the runbook: remote setup, pulling upstream, rebuilding, testing and publishing.

## Credits

- Original C tool: [pdfresurrect by Matt Davis](https://github.com/enferex/pdfresurrect)
- Validation: [libroot.org Snowden documents analysis](https://libroot.org/posts/going-through-snowden-documents-part-4/)

## License

BSD-3-Clause (matching upstream pdfresurrect)
