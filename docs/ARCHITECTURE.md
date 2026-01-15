# Architecture

## Overview

WASM compilation of pdfresurrect C library with JavaScript bindings for browser and Node.js environments.

## Components

### Core
- `main.c` / `main.h` - Original pdfresurrect C code
- `configure.ac` - Autoconf configuration

### Build
- Emscripten toolchain for WASM compilation
- npm packaging for distribution

### Examples
- `examples/` - Usage examples

## Data Flow

```
PDF Bytes → WASM Module → Version Objects → JavaScript
```

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Emscripten | Standard WASM toolchain | 2024 |
| Uint8Array API | Browser-native binary handling | 2024 |

## Dependencies

- Emscripten (build)
- Original pdfresurrect

## Development

### Setup
```bash
# Requires Emscripten installed
emconfigure ./configure
emmake make
```

### Testing
```bash
bun test
```
