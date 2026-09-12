/*
 * Type test: verify the ./pdfresurrect_full.js subpath's declaration file
 * resolves for real consumers. Packs the current tree with `npm pack`,
 * installs the tarball into a scratch consumer, and type-checks a small
 * probe file against it under both `bundler` and `nodenext` module
 * resolution — the two settings real consumers use.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tsc = join(repoRoot, 'node_modules', '.bin', 'tsc');

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

console.log('Type test: pdfresurrect_full.js subpath under bundler and nodenext resolution\n');

const scratch = mkdtempSync(join(tmpdir(), 'pdfresurrect-wasm-types-'));

try {
    const packOut = execFileSync(
        'npm',
        ['pack', '--pack-destination', scratch, '--json'],
        { cwd: repoRoot, encoding: 'utf8' }
    );
    const [{ filename }] = JSON.parse(packOut);
    const tarball = join(scratch, filename);

    const consumer = join(scratch, 'consumer');
    mkdirSync(join(consumer, 'src'), { recursive: true });
    writeFileSync(
        join(consumer, 'package.json'),
        JSON.stringify({ name: 'pdfresurrect-wasm-types-check', private: true, type: 'module' })
    );
    execFileSync('npm', ['install', tarball, '--no-save', '--no-audit', '--no-fund'], {
        cwd: consumer,
        stdio: 'pipe',
    });

    writeFileSync(
        join(consumer, 'src', 'check.ts'),
        `import createModule from '@clearsignalworks/pdfresurrect-wasm/pdfresurrect_full.js';

async function run(): Promise<void> {
  const wasm = await createModule({
    locateFile: (path: string, scriptDirectory: string) => scriptDirectory + path,
    print: () => {},
    printErr: () => {},
  });

  wasm.FS.writeFile('/input.pdf', new Uint8Array(0));
  const files: string[] = wasm.FS.readdir('/');
  const exitCode: number = wasm.callMain(['/input.pdf', '-w']);
  const bytes: Uint8Array = wasm.FS.readFile('/input.pdf');
  const heap: Uint8Array = wasm.HEAPU8;

  console.log(files, exitCode, bytes.length, heap.length);
}

run();
`
    );

    for (const moduleResolution of ['bundler', 'nodenext']) {
        const tsconfigPath = join(consumer, `tsconfig.${moduleResolution}.json`);
        writeFileSync(
            tsconfigPath,
            JSON.stringify({
                compilerOptions: {
                    target: 'ES2022',
                    module: moduleResolution === 'bundler' ? 'ESNext' : 'NodeNext',
                    moduleResolution: moduleResolution === 'bundler' ? 'bundler' : 'nodenext',
                    strict: true,
                    noEmit: true,
                },
                include: ['src/check.ts'],
            })
        );

        try {
            execFileSync(tsc, ['-p', tsconfigPath], { cwd: consumer, encoding: 'utf8', stdio: 'pipe' });
            console.log(`PASS: subpath import type-checks under moduleResolution: ${moduleResolution}`);
        } catch (err) {
            console.error(err.stdout ?? '');
            console.error(err.stderr ?? '');
            assert(false, `subpath import failed to type-check under moduleResolution: ${moduleResolution}`);
        }
    }
} finally {
    rmSync(scratch, { recursive: true, force: true });
}

console.log('\nTYPE TEST PASSED');
