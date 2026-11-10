# Record the Context-Management Rule

**Type:** Documentation

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Record that a near-full context window triggers task delegation |
| Key decisions | Rule lives in `GUIDELINES.md` under Agent Operations            |
| Open risks    | None                                                            |

## Description

When the agent's context window approaches its limit, continuing degraded
produces worse results than delegating. The rule: divide the remaining work
into discrete tasks and spawn subagents for them, keeping orchestration,
merge, and final verification local.

## Outcome

- The rule is recorded in the Agent Operations section.
