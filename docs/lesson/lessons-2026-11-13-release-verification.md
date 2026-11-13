# Release Verification Findings

### Coverage inventory

The previous aggregate passed while omitting executable modules that the
suite did not import. Adding the source inventory exposed gaps across all
four metrics. See Coverage Targets in `TESTING.md` for the inventory and
exclusion rule established in this window.

### WebKit smoke retry

The WebKit song save/load check timed out in the five-worker suite.
It passed in isolation and again in the full two-worker suite. The
cause of the initial timeout remains undetermined. See Post-Change
Workflow in `TESTING.md` for the requirement to investigate failures
and rerun verification.
