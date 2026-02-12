# Upstream Sync Guide

This repo is a WASM port of [pdfresurrect](https://github.com/enferex/pdfresurrect) by Matt Davis. The full upstream commit history is preserved in our git history.

## Remote Setup

```
origin    → clearsignalworks/pdfresurrect-wasm   (this repo - WASM port)
upstream  → enferex/pdfresurrect                 (original C library)
```

## Incorporating Upstream Changes

When the upstream C library releases fixes or features:

```bash
# 1. Fetch upstream changes
git fetch upstream

# 2. Review what changed
git log master..upstream/master --oneline

# 3. Merge upstream into our branch
git merge upstream/master

# 4. Recompile WASM from updated C source
#    (requires Emscripten SDK - see docs/WASM-FINDINGS.md for build details)
emcc pdf.c main.c -o pdfresurrect_full.js \
  -s EXPORTED_FUNCTIONS='["_main"]' \
  -s EXPORTED_RUNTIME_METHODS='["callMain","FS"]' \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXIT_RUNTIME=0 \
  -O2

# 5. Test with Snowden doc
node test/test_snowden.mjs

# 6. Bump version and publish
npm version patch
npm publish
```

## What Lives Where

| File | Source | Changes on upstream sync |
|------|--------|------------------------|
| `pdf.c`, `pdf.h`, `main.c`, `main.h` | Upstream C source | Replaced by merge |
| `pdfresurrect_full.js` | Emscripten output | Must recompile after merge |
| `pdfresurrect_full.wasm` | Emscripten output | Must recompile after merge |
| `pdfresurrect-wasm.mjs` | Our wrapper | Usually unchanged unless upstream API changes |
| `pdfresurrect-wasm.d.ts` | Our types | Usually unchanged |

## Divergence from Upstream

Our wrapper (`pdfresurrect-wasm.mjs`) adds:
- Browser-compatible ESM API
- ExitStatus recovery (reset WASM singleton on crash)
- Graceful fallback for linearized PDFs
- Uint8Array cloning for detached buffer safety
- `findEofBoundaries()` for accurate version sizes

These are wrapper-level concerns. The C source is kept unmodified from upstream.
