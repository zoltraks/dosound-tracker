# Record the Window Close-Out Procedure

**Type:** Documentation

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Record the discard path and ad-hoc trigger for closing a window |
| Key decisions | Landed records verify-and-close; unimplemented records may be   |
|               | discarded with recorded rationale                               |
| Open risks    | None                                                            |

## Description

The Version Window SDLC catalogued every change record as in scope but
recorded no path for records describing already-landed work or work that
should not proceed, and no trigger for closing an ad-hoc window
("continue SDLC autonomously"). Both are now recorded in `WORKFLOW.md`.

## Outcome

- Intake covers verify-and-close, discard-with-rationale, and the ad-hoc
  close-out trigger.
