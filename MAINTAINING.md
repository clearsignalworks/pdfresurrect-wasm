# Maintaining pdfresurrect-wasm

This document explains how to maintain this repository and incorporate upstream changes from the original pdfresurrect project.

## Branch Structure

This repository uses a **two-branch workflow** to separate upstream tracking from our WASM work:

- **`main`** - Our WASM port (published to npm)
  - Contains: Upstream C code + WASM compilation layer + npm packaging
  - This is the default branch and what gets published

- **`master`** - Clean upstream tracking branch
  - Mirrors the upstream pdfresurrect repository (https://github.com/enferex/pdfresurrect)
  - Contains ONLY upstream C code, no local modifications
  - Used to pull in updates from upstream

## Upstream Sync Workflow

When upstream releases a new version of pdfresurrect, follow these steps:

### 1. Fetch Upstream Changes

```bash
cd pdfresurrect-wasm
git fetch upstream
```

### 2. Update Master Branch

```bash
git checkout master
git merge upstream/master
git push origin master
```

This keeps `master` in sync with upstream.

### 3. Merge Into Main

```bash
git checkout main
git merge master
```

This brings upstream changes into your WASM work.

### 4. Resolve Conflicts (if any)

If upstream modified files that we've changed for WASM (like `main.c`):

1. Review conflicts carefully
2. Keep WASM-specific changes
3. Integrate upstream bug fixes or improvements
4. Test thoroughly

### 5. Test WASM Build

```bash
# Test that WASM compilation still works
# Test that npm package exports work correctly
# Run any existing tests
```

### 6. Update Version and Publish

```bash
# Update version in package.json (follow semantic versioning)
npm version patch  # or minor/major as appropriate
git push origin main --tags
npm publish
```

## Why This Structure?

**Keeps upstream clean:** The `master` branch remains a pure mirror of upstream, making it easy to see what changed upstream vs what we added.

**Simplifies merging:** When merging `master` into `main`, git can clearly see which changes are ours vs theirs.

**Preserves attribution:** Upstream commit history is preserved in `master`, our WASM work is layered on top in `main`.

## Remote Configuration

```bash
# Upstream (original pdfresurrect)
upstream  https://github.com/enferex/pdfresurrect.git

# Origin (our fork)
origin    git@github.com:clearsignalworks/pdfresurrect-wasm.git
```

Verify with: `git remote -v`

## Quick Reference

| Task | Command |
|------|---------|
| Check for upstream updates | `git fetch upstream && git log master..upstream/master` |
| Pull upstream to master | `git checkout master && git merge upstream/master` |
| Merge upstream into main | `git checkout main && git merge master` |
| Publish new version | `npm version patch && git push --tags && npm publish` |

## Notes

- **Never commit WASM work to master** - Keep it clean for upstream tracking
- **Always merge master → main** - Never the other way around
- **Test thoroughly after merging** - Upstream changes might break WASM compilation
- **Document breaking changes** - Note in CHANGELOG if upstream update requires API changes
