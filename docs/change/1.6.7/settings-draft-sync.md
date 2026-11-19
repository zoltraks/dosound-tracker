# Sync the settings draft with externally changed settings

**Type:** Fix

## Summary

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Intent        | Make the settings modal show current committed values after settings change outside the modal |
| Key decisions | Refresh the persisted session draft from committed storage while the modal is closed          |
| Open risks    | `none`                                                                                        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The settings modal keeps its working draft in the persisted `settingsView`
session snapshot. The snapshot survives modal close, so every reopen restores
the draft stored at the last close instead of the current committed settings.

Settings changed by actions outside the modal never reach that stored draft.
The track background rainbow button, the header theme toggle, and the
paste-track mode dialog all mutate committed settings directly. After any of
them runs, reopening the settings modal shows the values from before the
change - for example the Track background checkbox stays checked while the
track panels are already untinted.

Every option in the settings modal must reflect the current committed values
when the modal opens, regardless of which action changed them. While the
modal is open the draft stays authoritative - uncommitted edits are never
overwritten by outside changes, and reload restore of an open session's
uncommitted draft keeps working.

## Use Cases

- When the user toggles track backgrounds with the rainbow button and then opens settings, the Track background option shows the new state.
- When the user switches theme with the header toggle and then opens settings, the theme option shows the new theme.
- When the user picks a paste mode in the paste-track dialog and then opens settings, the editor option shows the new mode.
- When the user edits settings without committing and reloads, the uncommitted draft is still restored.

## Hints

The persisted draft is written on close and on every edit, and read once when
the modal opens. Several committed keys are written by effect-driven
persistence, so a render-time storage read can lag one commit behind - the
refresh belongs where the writes have already flushed.

## Out of Scope

- Changing draft, commit, or cancel semantics inside the settings session.
- Syncing other persisted view state such as cursor or modal position.
- Preventing outside actions while the settings modal is open.
