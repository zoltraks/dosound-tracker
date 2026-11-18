# Package a Debian Installer for Linux Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Emit an installable `.deb` from `npm run electron:build` with correct Debian metadata, dependencies, desktop integration, and hicolor icons.                                       |
| Key decisions | `deb.depends` overrides the default list with t64/legacy alternation plus ALSA; `desktopName` + `syncDesktopName` fix window association; `build/icons/` supplies the hicolor set. |
| Open risks    | None - dependency names verified on the Mint 22.3 target host; package contents verified with `dpkg-deb` and `lintian` after build.                                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.7/linux-deb-package.md`.

## Best Practices

Packaging configuration only - `package.json` keeps its existing JSON
conventions (two-space indent, key order matching the surrounding `build`
object). New binary assets under `build/icons/` are copies of the existing
`public/media/icon/` artwork renamed to the hicolor `<size>x<size>.png`
convention; no image is regenerated or restyled.

## Documentation Updates

- `DEPLOYMENT.md` - Electron Distribution: add `.deb` to the Linux output
  list and a short Debian package subsection covering the artifact name,
  `apt`/`dpkg` install commands, menu integration, removal, and the
  `build/icons/` convention.
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` - no
  update required; the change affects distribution packaging only.

## Type and State Updates

None.

## Step by Step Implementation

**Update `DEPLOYMENT.md` first**

Per the documentation-first rule, record the new artifact and install
flow before touching `package.json`.

File to modify: `docs/DEPLOYMENT.md`.

**Add the `deb` target, Debian metadata, and corrected dependencies**

`build.linux.target` gains `"deb"`. A new `build.deb` block declares the
package identity and an explicit `depends` list: the electron-builder
defaults `libgtk-3-0` and `libatspi2.0-0` do not exist on Ubuntu 24.04 /
Mint 22.x repositories (the `t64` variants replaced them), and the list
omits `libasound2`, which Electron links at runtime. Each renamed library
uses Debian alternation so one package resolves on both naming schemes.

File to modify: `package.json`, `build` object.

```json
"deb": {
  "packageName": "dosound-tracker",
  "packageCategory": "sound",
  "maintainer": "Filip Golewski <f.golewski@gmail.com>",
  "synopsis": "Chiptune tracker for the YM2149 / DOSOUND sound hardware",
  "depends": [
    "libgtk-3-0t64 | libgtk-3-0",
    "libatspi2.0-0t64 | libatspi2.0-0",
    "libasound2t64 | libasound2",
    "libnotify4",
    "libnss3",
    "libxss1",
    "libxtst6",
    "xdg-utils",
    "libuuid1",
    "libsecret-1-0"
  ]
}
```

**Set `desktopName` and `syncDesktopName`**

`desktopName` is a top-level `package.json` field electron-builder reads
as metadata; `dosound-tracker.desktop` yields `app_id`/`WM_CLASS`
`dosound-tracker`, matching the packaged executable name. Enabling
`linux.syncDesktopName` makes the installed `.desktop` filename derive
from it and emits `StartupWMClass` accordingly, resolving the warning the
last build printed.

File to modify: `package.json` - add `"desktopName": "dosound-tracker.desktop"`
after `"main"`, and `"syncDesktopName": true` inside `build.linux`.

**Ship the hicolor icon set**

Copy the existing artwork into `build/icons/` under the names the icon
resolver expects (`16x16.png` through `512x512.png`), then point
`linux.icon` at the directory so the `set` resolution collects every size
for the hicolor install instead of only the single 512 px file. macOS and
Windows icon configuration is untouched.

Files to create: `build/icons/16x16.png`, `24x24.png`, `32x32.png`,
`48x48.png`, `128x128.png`, `192x192.png`, `256x256.png`, `512x512.png` -
each a byte copy of the matching `public/media/icon/icon-<size>.png`.

File to modify: `package.json`, `build.linux.icon` becomes
`"build/icons"`.

**Run the verification loop and package inspection**

The full loop runs because `package.json` is configuration. Then
`npm run electron:build` produces the `.deb`, verified with `dpkg-deb -I`
(control fields), `dpkg-deb -c` (payload layout: `/usr/bin`,
`/usr/share/applications`, `/usr/share/icons/hicolor`), `lintian`
(Debian-policy findings), and `apt-get install --simulate` against the
produced file to prove the `depends` list resolves on this host.

## Implementation Order

1. Update `DEPLOYMENT.md`.
2. Create `build/icons/` copies.
3. Apply the `package.json` changes (`deb` target + block, `desktopName`,
   `syncDesktopName`, `linux.icon`).
4. Run `npm run typecheck`, `npm run lint`, `npm run format`,
   `npm run build`, `npm test`.
5. Run `npm run electron:build` and inspect the `.deb`.
6. Record any refinements in this plan.

## Testing Strategy

**Unit tests**

None - packaging metadata is not unit-tested in this suite.

**Integration tests**

None required - no DOM structure, class names, or runtime behaviour
change; the existing e2e smoke suite continues to cover the application.

## Verification

Run the verification loop in this order. The implementation is complete
only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run electron:build` and confirm `release/` contains a fresh
  `.deb` alongside the AppImage and `.tar.gz`
- Run `dpkg-deb -I` on the `.deb` and confirm `Package`, `Version`,
  `Architecture`, `Section`, `Maintainer`, `Depends`, and `Description`
  carry the intended values
- Run `dpkg-deb -c` and confirm the payload includes the executable, the
  `.desktop` entry under `/usr/share/applications/`, and icons under
  `/usr/share/icons/hicolor/<size>x<size>/apps/`
- Run `lintian` on the `.deb` and resolve or justify every error; warnings
  are assessed individually
- Run `apt-get install --simulate ./release/<deb>` and confirm dependency
  resolution succeeds on this Mint host
- Manually verify `sudo apt install` / menu launch / `apt remove` on the
  target machine - requires the user's sudo, left as the acceptance step<|end_message|><|message_model|>read<|content_invoke_tool_json|>{

## Refinements

Adjustments made during implementation, recorded per the workflow rule.

- `libc6` was added to `deb.depends` after `lintian` reported
  `missing-dependency-on-libc` on the first built package. The rebuild
  confirmed the tag is resolved.
- The `.deb` artifact name is `dosound-tracker-<version>-linux-amd64.deb`,
  not the `linux-x86_64` form the global `artifactName` template produces
  for AppImage and tar.gz - the deb target applies its own naming.
  `DEPLOYMENT.md` and the change record were corrected to match.
- Remaining lintian findings were assessed and accepted as inherent to
  the electron-builder `/opt` layout and bundled-runtime model:
  `dir-or-file-in-opt`, `embedded-library`, `shared-library-is-executable`,
  `unstripped-binary-or-object`, `no-copyright-file`, and the
  maintainer-script/permission notes. None affect install, launch, or
  removal on the target host; `apt-get install --simulate` resolves the
  package cleanly.
