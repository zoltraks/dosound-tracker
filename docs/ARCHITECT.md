# DOSOUND Tracker - Refactoring Process

## Overview

For each version release, maintain a structured refactoring process to ensure systematic code quality improvements.

## Process

1. **After each release**: Create a refactoring proposal file `REFACTORING.md` inside `docs/refactoring/[version]/` subdirectory (e.g., `docs/refactoring/1.1.1/REFACTORING.md`)

2. **After refactorings are implemented**: Create an assessment file `ASSESSMENT.md` in the same directory, comparing the original proposals against what was actually accomplished

## Directory Structure

```
docs/
├── refactoring/
│   ├── 1.0.21/
│   │   ├── REFACTORING.md
│   │   └── ASSESSMENT.md
│   ├── 1.1.1/
│   │   ├── REFACTORING.md
│   │   └── ASSESSMENT.md
│   └── [future versions]/
```

## Guidelines

- **File naming**: Always use `REFACTORING.md` (not `REFACTORING PROPOSAL.md`) for consistency
- Use the existing `REFACTORING.md` and `ASSESSMENT.md` files as templates for structure and content

## Code Generation Guidelines

⚠️ **IMPORTANT**: This is a real-time audio application where performance is critical. Before making any code changes, especially linting fixes or React optimizations, see:

- [GUIDELINES.md](GUIDELINES.md) - Audio-critical development principles and linting trade-offs

The GUIDELINES.md document contains crucial information about which linting fixes are safe to apply and which will break audio timing.
- Focus on measurable improvements in type safety, testing, performance, and maintainability
- Document both completed work and remaining gaps
- Update version numbers and dates appropriately