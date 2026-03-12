#!/usr/bin/env bash
set -euo pipefail

# Check emcc is available
if ! command -v emcc &>/dev/null; then
  echo "ERROR: emcc not found. Install Emscripten: https://emscripten.org/docs/getting_started/downloads.html" >&2
  exit 1
fi

# Check emcc version (known-good: 4.0.22)
EMCC_VERSION=$(emcc --version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
EMCC_MAJOR=$(echo "$EMCC_VERSION" | cut -d. -f1)
EMCC_MINOR=$(echo "$EMCC_VERSION" | cut -d. -f2)

if [[ "$EMCC_MAJOR" != "4" || "$EMCC_MINOR" != "0" ]]; then
  echo "WARNING: emcc version $EMCC_VERSION is not 4.0.x (known-good: 4.0.22). Build may fail or produce unexpected results." >&2
fi

echo "Building pdfresurrect-wasm with emcc $EMCC_VERSION..."

emcc -O2 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORTED_FUNCTIONS='["_main","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["FS","HEAPU8","callMain"]' \
  -s FORCE_FILESYSTEM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXIT_RUNTIME=0 \
  -o pdfresurrect_full.js \
  main.c pdf.c

# Check binary size
WASM_SIZE=$(wc -c < pdfresurrect_full.wasm)
WASM_SIZE_KB=$((WASM_SIZE / 1024))

if [[ $WASM_SIZE -lt 30720 || $WASM_SIZE -gt 102400 ]]; then
  echo "WARNING: pdfresurrect_full.wasm is ${WASM_SIZE_KB}KB, outside expected range 30KB–100KB." >&2
fi

JS_SIZE=$(wc -c < pdfresurrect_full.js)
JS_SIZE_KB=$((JS_SIZE / 1024))

echo ""
echo "Build successful!"
echo "  pdfresurrect_full.wasm: ${WASM_SIZE_KB}KB"
echo "  pdfresurrect_full.js:   ${JS_SIZE_KB}KB"
echo "  Total: $((WASM_SIZE_KB + JS_SIZE_KB))KB"
