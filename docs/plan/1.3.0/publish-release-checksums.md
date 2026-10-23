# Publish release checksums and evaluate signing Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.0/publish-release-checksums.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`. The hook uses only Node.js built-ins - no new dependency is needed for SHA-256.

## Documentation Updates

Update the named documentation before any source code modifications.

- `DEPLOYMENT.md` — record the checksum artifact produced by the desktop build and the code-signing evaluation outcome.

## Step by Step Implementation

**Add the checksum build hook**

Create `scripts/afterAllArtifactBuild.cjs`, an electron-builder `afterAllArtifactBuild` hook. It hashes every produced artifact with SHA-256 and writes one `SHA256SUMS-<platform>.txt` into `release/` using `sha256sum`-compatible `<hash>  <filename>` lines, then returns the checksum file appended to the artifact list so it is published beside the artifacts. The platform suffix keeps per-platform build invocations from overwriting each other's checksum file when all targets upload to one release.

```javascript
module.exports = async function (context) {
  const lines = context.artifactPaths.map((artifactPath) => {
    const hash = createHash('sha256').update(readFileSync(artifactPath)).digest('hex');
    return `${hash}  ${basename(artifactPath)}`;
  });
  const checksumPath = join(context.outDir, `SHA256SUMS-${context.packager.platform.name}.txt`);
  writeFileSync(checksumPath, lines.join('\n') + '\n');
  return [...context.artifactPaths, checksumPath];
};
```

**Register the hook**

File to modify: `package.json`. Add `"afterAllArtifactBuild": "scripts/afterAllArtifactBuild.cjs"` to the `build` (electron-builder) section.

**Evaluate code signing**

Record the evaluation in `DEPLOYMENT.md`: macOS builds are unsigned today with the documented quarantine workaround; signing requires a paid Apple Developer Program membership with notarization, and Windows requires a purchased OV or EV certificate. Signing stays a procurement decision outside this change - the checksums deliver verifiable integrity now, which is the record's stated scope.

## Implementation Order

1. Update documentation
2. Create `scripts/afterAllArtifactBuild.cjs`
3. Register the hook in `package.json`
4. Run verification loop

## Testing Strategy

**Unit tests**

No new utility functions exported to the app. The hook is exercised for real by `npm run electron:build`, which requires the desktop packaging toolchain; the verification loop confirms nothing regresses, and the hook logic is plain Node built-ins.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Confirm the hook file is picked up by electron-builder configuration (`electron-builder` effective config lists `afterAllArtifactBuild`)
