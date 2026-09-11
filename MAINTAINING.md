# pdfresurrect-wasm Maintenance Runbook

## Prerequisites

- **Emscripten 4.0.x** — known-good version: **4.0.22**
- Install: https://emscripten.org/docs/getting_started/downloads.html
- Verify: `emcc --version`
- Node.js >= 16
- An `upstream` remote pointing at the original C project. A fresh clone has only `origin`; add it once:

```bash
git remote add upstream https://github.com/enferex/pdfresurrect.git
git remote set-url --push upstream no_push
```

## 1. Check for Upstream Updates

```bash
git fetch upstream
git log master..upstream/master --oneline
```

If there are commits listed, proceed to step 2. Otherwise skip to step 4.

## 2. Merge Upstream Changes

```bash
git checkout master
git merge upstream/master
git push origin master

git checkout main
git merge master
```

The C sources on `main` are identical to upstream; only the JavaScript wrapper, build script, tests and docs are ours. A conflict in a `.c` or `.h` file means take upstream's side. Test after merging.

## 3. Build

```bash
./build.sh
```

The script checks that `emcc` is present and warns if the version is not 4.0.x. On success it prints file sizes for `pdfresurrect_full.wasm` and `pdfresurrect_full.js`.

## 4. Validate

**Full test suite** (requires Snowden fixture — see below):
```bash
npm test
```

**Smoke test** (no Snowden fixture needed):
```bash
npm run test:quick
```

`test:quick` runs `test/test_smoke.mjs` — verifies WASM module loads and public API exports are present. No fixture file required.

`npm test` additionally runs `test/test_snowden.mjs` against the real Menwith Hill PDF. This test requires the fixture file described below.

### Snowden Fixture

File: `examples/Menwith-satellite-classification-guide.pdf`

This file is **tracked in git** and present in the repository. It is required for `npm test` but not for `npm run test:quick`.

## 5. Publish

The GitHub repository must be public. package.json's repository, homepage and bugs
links point at it, and npm renders them on the package page for anonymous visitors.

```bash
npm version patch   # or minor / major per semver rules
npm publish --access public
```

`npm version` tags the commit automatically. The post-commit hook pushes to origin.

## Remote Configuration

```
upstream  https://github.com/enferex/pdfresurrect.git
origin    git@github.com:clearsignalworks/pdfresurrect-wasm.git
```

Verify: `git remote -v`

## Quick Reference

| Task | Command |
|------|---------|
| Check for upstream updates | `git fetch upstream && git log master..upstream/master` |
| Merge upstream | `git checkout master && git merge upstream/master && git checkout main && git merge master` |
| Build | `./build.sh` |
| Smoke test | `npm run test:quick` |
| Full test | `npm test` |
| Publish patch | `npm version patch && npm publish --access public` |
