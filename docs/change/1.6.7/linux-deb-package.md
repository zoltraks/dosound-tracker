# Package a Debian installer for Linux

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | `npm run electron:build` emits a `.deb` that installs through `apt`/`dpkg` on Debian-based distributions such as Linux Mint, with menu entry, icons, and window association.                                                        |
| Key decisions | Add `deb` to the Linux target list; override `deb.depends` for the t64 package rename plus ALSA; set `desktopName` + `linux.syncDesktopName`; ship a multi-size hicolor icon set from `build/icons/`; document install and removal. |
| Open risks    | None blocking - dependency names verified against the Mint 22.3 target host; real install remains a user-side check.                                                                                                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Linux Mint and other Debian-based distributions install desktop
applications through the system package manager. Today the Linux
electron-builder output produces only an AppImage and a `.tar.gz`, so Mint
users must download, mark executable, and run an unpackaged binary instead
of installing through `apt`.

Adding the `deb` target makes electron-builder emit a Debian package
alongside the existing artifacts. The package carries the application
payload, a `.desktop` entry, hicolor icons at multiple sizes, and Debian
control metadata (package name, section, maintainer, synopsis) sufficient
for `apt`/`dpkg` installation, menu integration, and clean removal through
the package manager.

The default dependency list electron-builder generates for `deb` does not
match current Debian-based releases. It names `libgtk-3-0` and
`libatspi2.0-0`, which no longer exist as package names on Ubuntu 24.04
and Linux Mint 22.x - the repositories carry the `t64` variants
(`libgtk-3-0t64`, `libatspi2.0-0t64`) instead, verified with `apt-cache
policy` on the target host. The list also omits `libasound2`, which the
Electron binary links at runtime. The package therefore declares its own
`depends` list using alternation (`libgtk-3-0t64 | libgtk-3-0`) so the same
package resolves on both the t64 and pre-t64 naming schemes.

Two related packaging defects are resolved in the same change. The Linux
build warns that `desktopName` is unset, so an installed window may not
associate with its `.desktop` entry; setting `desktopName` and
`linux.syncDesktopName` gives the window a stable `app_id`/`WM_CLASS`
matching the `dosound-tracker` executable. And Linux packaging currently
uses a single 512 px PNG, which leaves menu and panel entries without
correctly sized images; a `build/icons/` directory holding the existing
artwork at hicolor sizes provides proper integration.

## Use Cases

- On Linux Mint, `sudo apt install ./dosound-tracker-<version>-linux-amd64.deb`
  installs the application, registers the menu entry and icons, and
  resolves dependencies from the distribution repositories.
- `sudo apt remove dosound-tracker` removes the application and its
  desktop integration cleanly.
- Running the app from the installed package shows the launcher icon on
  the window rather than a generic or mismatched icon.
- `npm run electron:build` continues to produce the AppImage and `.tar.gz`
  unchanged alongside the new `.deb`.

## Hints

- `DebOptions` in the electron-builder schema covers `packageName`,
  `packageCategory`, `maintainer`, `synopsis`, `depends`, `recommends`,
  and `priority`; only metadata fields need explicit values beyond
  `depends`.
- `desktopName` is a top-level `package.json` field, not a `build.*`
  option; `linux.syncDesktopName` derives the installed `.desktop`
  filename from it.
- The hicolor icon set requires filenames of the form `<size>x<size>.png`;
  the existing `public/media/icon/icon-<size>.png` artwork is copied into
  `build/icons/` under the convention names.
- `lintian` and `dpkg-deb` are available on the build host for
  Debian-policy checks and payload inspection of the produced `.deb`.

## Out of Scope

- Publishing to an apt repository, PPA, or software store.
- Code signing or repository authentication of the package.
- Windows or macOS packaging changes.
- Runtime application changes.
- Support for architectures other than the host's x86_64.
