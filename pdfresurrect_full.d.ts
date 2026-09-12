/**
 * pdfresurrect-wasm - raw Emscripten module factory
 *
 * The default export of pdfresurrect_full.js. Most callers should use the
 * wrapped API in the package's main entry instead; use this subpath directly
 * only when you need control over module options such as locateFile (for
 * example, serving the .wasm binary from a custom path in a browser build).
 */

/** The subset of Emscripten's virtual filesystem the compiled tool uses. */
export interface PdfresurrectFS {
  readdir(path: string): string[];
  unlink(path: string): void;
  rmdir(path: string): void;
  writeFile(path: string, data: Uint8Array): void;
  readFile(path: string): Uint8Array;
}

/** The initialized module instance passed to onRuntimeInitialized and returned by the factory. */
export interface PdfresurrectModule {
  FS: PdfresurrectFS;
  HEAPU8: Uint8Array;
  /** Runs the compiled tool's main() with the given argv; returns its exit code. */
  callMain(args: string[]): number;
}

export interface PdfresurrectModuleOptions {
  /** Skip the automatic main() call at load time (it would otherwise print the CLI usage banner). */
  noInitialRun?: boolean;
  print?: (text: string) => void;
  printErr?: (text: string) => void;
  /** Overrides how the glue resolves the .wasm binary's URL/path. */
  locateFile?: (path: string, scriptDirectory: string) => string;
  onRuntimeInitialized?: (this: PdfresurrectModule) => void;
}

declare function createPdfresurrectModule(
  options?: PdfresurrectModuleOptions
): Promise<PdfresurrectModule>;

export default createPdfresurrectModule;
