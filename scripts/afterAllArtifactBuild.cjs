const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { basename, join } = require('node:path');

module.exports = async function afterAllArtifactBuild(context) {
  const lines = context.artifactPaths.map((artifactPath) => {
    const hash = createHash('sha256').update(readFileSync(artifactPath)).digest('hex');
    return `${hash}  ${basename(artifactPath)}`;
  });
  const platformName = [...context.platformToTargets.keys()].map((p) => p.name).join('-');
  const checksumPath = join(context.outDir, `SHA256SUMS-${platformName}.txt`);
  writeFileSync(checksumPath, lines.join('\n') + '\n');
  return [...context.artifactPaths, checksumPath];
};
