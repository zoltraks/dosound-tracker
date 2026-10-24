# Performance Budgets Engineering Standards

<!-- Version: 0.1.3 | Date: 2026-10-24 -->

## Purpose

This document defines performance budgets for all engineering standards.

It covers frontend (Core Web Vitals, bundle size), backend (latency, throughput, memory),
and CLI (startup, command latency).

It is referenced by all engineering standards and does not stack - it is a cross-cutting
requirement.

It is written to be executed directly by an AI coding agent and to be read without effort by a human
reviewer.

## Scope

This standard applies to every project that delivers user-facing software:

- **Frontend**: Web applications (React, Vue, Svelte, vanilla, Electron, Tauri)
- **Backend**: HTTP APIs, gRPC services, GraphQL, WebSocket servers
- **CLI**: Command-line tools invoked by humans or scripts
- **Database**: Query latency, connection pool utilization

This standard does not apply to:

- Headless build tools, compilers, transpilers (unless they have user-facing CLI)
- Internal libraries with no direct user interface

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading anything else in this document.

### Order Of Operations

Follow these steps in order at the start of every task that affects performance.

1. Read the project rules file and the referring engineering standard.
2. Identify the project category (frontend, backend, CLI, database).
3. Apply the relevant budget table for the category.
4. Add performance test/assertion to CI for the changed code path.
5. Run every applicable row of the Verification section.
6. Check the result against the Definition of Done before reporting the task complete.

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                | Example                                      |
| ---- | ------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user | "This API must be p99 < 50ms"                |
| 2    | The project rules file                | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The referring engineering standard    | the referring frontend or API standard       |
| 4    | This standard                         | Default budgets below                        |
| 5    | General performance best practice     | Anything the four sources above do not cover |

Never silently reformat existing code to match this standard.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **Budgets are enforced in CI.** Every PR runs performance assertions,
  a regression fails the build.
- **Budgets are measured in production-like conditions.** Synthetic benchmarks on dev machines are
  not sufficient.
- **p95/p99 percentiles are used.** Averages hide tail latency, mean/median are not acceptable.
- **Budgets include cold start.** First-request latency counts for serverless and CLI.
- **Memory budgets include RSS + heap.** No leaks over 24h soak test.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the performance posture.

| Signal Found In The Repository        | Inferred Decision            | Confidence |
| ------------------------------------- | ---------------------------- | ---------- |
| `lighthouse` or `lighthouse-ci` in CI | Frontend budgets enforced    | High       |
| `k6`, `artillery`, `wrk` in CI        | Backend load testing         | High       |
| `hyperfine` in CI                     | CLI benchmarking             | High       |
| `bundle-analyzer` in build            | Bundle size tracking         | High       |
| No performance tooling                | New project / not configured | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation.

Example: "I see Lighthouse CI for frontend, k6 for backend, hyperfine for CLI.

I will enforce the default budgets plus any project-specific overrides.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new project,
configure performance tooling per category:

- **Frontend**: Lighthouse CI + bundle analyzer (webpack-bundle-analyzer / rollup-plugin-visualizer
  / Vite bundle analysis)
- **Backend**: k6 load test script + Prometheus/Grafana or CI assertions
- **CLI**: hyperfine benchmark in CI
- **Database**: Query latency assertions in integration tests

## Documentation

The following are the authoritative sources for performance budgets.

- [Core Web Vitals](https://web.dev/vitals/) - Google's user-centric metrics
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - automated auditing
- [k6](https://k6.io/docs/) - load testing
- [hyperfine](https://github.com/sharkdp/hyperfine) - CLI benchmarking
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) - bundle
  visualization
- [Vite Bundle Analysis](https://github.com/btd/rollup-plugin-visualizer) - Vite bundle analysis
- [Prometheus](https://prometheus.io/) - metrics collection
- [OpenTelemetry](https://opentelemetry.io/) - distributed tracing

## Language Version

This standard defines budgets as version-agnostic thresholds.

Tooling versions are pinned per project:

- **Lighthouse CI**: 11.x
- **k6**: 0.50+
- **hyperfine**: 1.18+
- **webpack-bundle-analyzer**: 4.10+ / **rollup-plugin-visualizer**: 5.12+
- **Prometheus**: 2.48+ / **OpenTelemetry**: 1.25+

On tooling upgrade, re-validate budget measurements against release notes before writing code.

## Project Structure

Performance budgets are integrated into the referring project's CI and test structure:

```
.github/workflows/
  lighthouse.yml          Lighthouse CI (frontend)
  load-test.yml           k6 load tests (backend)
  cli-benchmark.yml       hyperfine benchmarks (CLI)
tests/
  load/                   k6 load test scripts
    api-load-test.js      API endpoint load tests
  performance/            Performance test suites
    *.perf.test.ts        Component/unit performance tests
scripts/
  benchmark.sh            CLI benchmark runner
lighthouse-budget.json    Lighthouse budget thresholds
k6-thresholds.js          k6 threshold configuration
```

## Naming Conventions

| Element                | Convention        | Example                  |
| ---------------------- | ----------------- | ------------------------ |
| Budget config files    | `kebab-case.json` | `lighthouse-budget.json` |
| Load test scripts      | `kebab-case.js`   | `api-load-test.js`       |
| Performance test files | `*.perf.test.ts`  | `api.perf.test.ts`       |
| Benchmark runners      | `benchmark.sh`    | `benchmark.sh`           |
| CI workflows           | `kebab-case.yml`  | `cli-benchmark.yml`      |

## Code Conventions

### Frontend Budgets (Core Web Vitals)

| Metric                              | Budget    | Measurement       | Tool                          |
| ----------------------------------- | --------- | ----------------- | ----------------------------- |
| **LCP** (Largest Contentful Paint)  | <= 2.5 s  | p75 (field) / lab | Lighthouse, Web Vitals        |
| **INP** (Interaction to Next Paint) | <= 200 ms | p75 (field) / lab | Lighthouse, Web Vitals        |
| **CLS** (Cumulative Layout Shift)   | <= 0.1    | p75 (field) / lab | Lighthouse, Web Vitals        |
| **TTFB** (Time to First Byte)       | <= 800 ms | p75               | Lighthouse, Navigation Timing |
| **FCP** (First Contentful Paint)    | <= 1.8 s  | p75               | Lighthouse                    |
| **TBT** (Total Blocking Time)       | <= 200 ms | lab               | Lighthouse                    |
| **JS Bundle (gzipped)**             | <= 200 KB | initial load      | Bundle analyzer               |
| **CSS Bundle (gzipped)**            | <= 50 KB  | initial load      | Bundle analyzer               |
| **Total Transfer (gzipped)**        | <= 500 KB | initial load      | Lighthouse                    |
| **Third-party requests**            | <= 10     | initial load      | Lighthouse                    |

### Backend Budgets (HTTP APIs)

| Metric                          | Budget        | Conditions               |
| ------------------------------- | ------------- | ------------------------ |
| **p99 Latency (simple GET)**    | <= 100 ms     | No DB, cached            |
| **p99 Latency (complex GET)**   | <= 300 ms     | DB query, auth           |
| **p99 Latency (POST/PUT)**      | <= 500 ms     | Write + validation       |
| **Cold Start (serverless)**     | <= 1 s        | First request            |
| **Throughput**                  | >= 1000 req/s | Per instance, simple GET |
| **Error Rate**                  | <= 0.1%       | 5xx errors               |
| **RSS Memory (idle)**           | <= 100 MB     | Per instance             |
| **Connection Pool Utilization** | <= 80%        | DB connections           |

### CLI Budgets

| Metric                     | Budget                                     |
| -------------------------- | ------------------------------------------ |
| **Cold Start (no cache)**  | <= 500 ms                                  |
| **Warm Start (cached)**    | <= 100 ms                                  |
| **Simple Command p99**     | <= 2 s                                     |
| **Complex Command p99**    | <= 30 s                                    |
| **RSS Memory**             | <= 100 MB                                  |
| **Binary Size (stripped)** | <= 20 MB (Linux), <= 30 MB (macOS/Windows) |

### Database Budgets

| Metric                          | Budget    |
| ------------------------------- | --------- |
| **p99 Simple Query**            | <= 10 ms  |
| **p99 Complex Query**           | <= 100 ms |
| **p99 Write (single row)**      | <= 20 ms  |
| **Connection Pool Utilization** | <= 80%    |
| **Connection Acquire Time**     | <= 5 ms   |

### Budget Enforcement Configurations

Lighthouse CI asserts the budgets in `lighthouserc.json`:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interaction-to-next-paint": ["error", { "maxNumericValue": 200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

Bundlesize gates the emitted artifacts in `package.json`:

```json
{
  "bundlesize": [
    {
      "path": "./dist/assets/index-*.js",
      "maxSize": "170 kB",
      "compression": "brotli"
    },
    {
      "path": "./dist/assets/index-*.css",
      "maxSize": "50 kB",
      "compression": "brotli"
    }
  ]
}
```

Raising a budget to bypass a regression, or merging a change with regressed
p99 latencies, is forbidden without an architecture review.

## Formatting and Linting

### Tooling Versions

| Tool                     | Version | Purpose              |
| ------------------------ | ------- | -------------------- |
| Lighthouse CI            | 11.x    | Frontend auditing    |
| k6                       | 0.50+   | Backend load testing |
| hyperfine                | 1.18+   | CLI benchmarking     |
| webpack-bundle-analyzer  | 4.10+   | Bundle visualization |
| rollup-plugin-visualizer | 5.12+   | Vite bundle analysis |
| Prometheus               | 2.48+   | Metrics collection   |
| OpenTelemetry            | 1.25+   | Distributed tracing  |

### CI Configuration

**Lighthouse CI Budget:**

```json
// lighthouse-budget.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.8 }]
      }
    }
  }
}
```

**k6 Thresholds:**

```javascript
// k6-thresholds.js
export const options = {
  thresholds: {
    'http_req_duration{type:simple}': ['p(99)<100'],
    'http_req_duration{type:complex}': ['p(99)<300'],
    http_req_failed: ['rate<0.001'],
  },
};
```

## Testing

### Performance Test Types

| Test Type        | Tool                  | Frequency   | Scope         |
| ---------------- | --------------------- | ----------- | ------------- |
| Frontend audit   | Lighthouse CI         | Every PR    | All pages     |
| Bundle size      | Bundle analyzer       | Every build | All bundles   |
| Backend load     | k6                    | Every PR    | Critical APIs |
| CLI benchmark    | hyperfine             | Every PR    | CLI commands  |
| Database queries | Integration tests     | Every PR    | All queries   |
| Soak test        | Production monitoring | Continuous  | Long-running  |

### Requirements

- All budget assertions pass in CI for the changed code path.
- No performance regression > 10% vs main branch (for CLI/Backend).
- Lighthouse CI score >= 0.9 for Performance category.
- Bundle size within budget for frontend.

## Build

### CI Integration

**Frontend (Lighthouse CI):**

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: http://localhost:3000
          budgetPath: ./lighthouse-budget.json
```

**Backend (k6):**

```yaml
# .github/workflows/load-test.yml
name: Load Test
on: [pull_request]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker run --rm -i grafana/k6 run - < tests/load/api-load-test.js
```

**CLI (hyperfine):**

```yaml
# .github/workflows/cli-benchmark.yml
name: CLI Benchmark
on: [pull_request]
jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Benchmark current
        run: hyperfine --warmup 3 --runs 10 './bin/my-cli simple-command' --export-json current.json
      - name: Benchmark main
        run: |
          git fetch origin main
          git stash
          git checkout origin/main -- .
          npm ci && npm run build
          hyperfine --warmup 3 --runs 10 './bin/my-cli simple-command' --export-json main.json
          git stash pop
      - name: Compare
        run: |
          python3 -c "
import json
with open('main.json') as f: main = json.load(f)
with open('current.json') as f: curr = json.load(f)
ratio = curr[0]['mean'] / main[0]['mean']
print(f'Ratio: {ratio:.2f}')
if ratio > 1.1: exit(1)
"
```

## Dependencies

| Category             | Library                                                   | Purpose             |
| -------------------- | --------------------------------------------------------- | ------------------- |
| Frontend auditing    | `lighthouse`, `lighthouse-ci`                             | Core Web Vitals     |
| Bundle analysis      | `webpack-bundle-analyzer`, `rollup-plugin-visualizer`     | Bundle size         |
| Backend load testing | `k6`                                                      | Load testing        |
| CLI benchmarking     | `hyperfine`                                               | CLI performance     |
| Metrics              | `prometheus`, `@opentelemetry/api`                        | Observability       |
| Tracing              | `@opentelemetry/sdk-node`, `@opentelemetry/exporter-otlp` | Distributed tracing |

## Verification

| Check                        | Command Or Method                                               | Applies To             |
| ---------------------------- | --------------------------------------------------------------- | ---------------------- |
| Frontend LCP <= 2.5s         | `npx lighthouse-ci --config=lighthouse-budget.json`             | All pages              |
| Frontend INP <= 200ms        | `npx lighthouse-ci --config=lighthouse-budget.json`             | All pages              |
| Frontend CLS <= 0.1          | `npx lighthouse-ci --config=lighthouse-budget.json`             | All pages              |
| Frontend JS bundle <= 200KB  | `npm run build && npx webpack-bundle-analyzer`                  | Build output           |
| Backend p99 simple <= 100ms  | `k6 run tests/load/api-load-test.js`                            | API endpoints          |
| Backend p99 complex <= 300ms | `k6 run tests/load/api-load-test.js`                            | API endpoints          |
| Backend error rate <= 0.1%   | `k6 run tests/load/api-load-test.js`                            | API endpoints          |
| CLI cold start <= 500ms      | `hyperfine --warmup 3 './bin/cli simple'`                       | CLI tools              |
| CLI binary size <= 20MB      | `ls -lh bin/cli`                                                | CLI tools              |
| DB p99 simple <= 10ms        | Integration test assertions                                     | Database queries       |
| Memory no leaks (24h)        | Profiling / soak test                                           | Long-running processes |
| Lighthouse CI autorun        | `npx lhci autorun`                                              | Web frontend           |
| Bundle size gate             | `npx bundlesize`                                                | Production build       |
| API p95 latency probe        | `npx autocannon -c 50 -d 10 -p 95 http://localhost:8080/health` | Backend API            |

## Definition of Done

### Correctness

- All budget assertions pass in CI for the changed code path.
- No performance regression > 10% vs main branch (for CLI/Backend).
- Lighthouse CI score >= 0.9 for Performance category.
- Bundle size within budget for frontend.

### Structure

- Performance test scripts committed (`tests/load/`, `tests/performance/`).
- Budget configuration committed (`lighthouse-budget.json`, k6 thresholds).
- CI workflows for performance run on every PR.

### Quality

- Performance budgets documented in project README.
- Alerting configured for production metrics (p99 latency, error rate, memory).
- Profiling data available for production debugging.

### Hygiene

- Performance test artifacts (reports, profiles) gitignored.
- No hardcoded performance thresholds in source code - use config.
- Documentation updated when budget changes.

## General Principles

**Measure What Users Experience.** Lab metrics (Lighthouse), field metrics (Web Vitals), and load
test (k6).

**Percentiles Over Averages.** p95/p99 reveal tail latency, mean/median hide it.

**Budgets Are Contracts.** A budget violation is a failed build - not a warning.

**Cold Start Counts.** First request, first CLI invocation, first DB connection - all measured.

**Memory Is a Budget.** RSS + heap, no leaks over 24h soak.

**Performance Is a Feature.** Every PR either improves or maintains - never degrades without
explicit approval.

**Tooling Over Intuition.** Automated CI assertions > manual "feels fast" checks.

## Fed Patterns

Patterns proven in projects that adopted this standard and evolved their own conventions.

**Tick budget as a hard bound.** A real-time path running at a fixed cadence (for example a 50 Hz
audio tick, 20 ms per step) treats the interval as a hard budget: no framework re-render, no
per-event allocation, and no allocation of arrays or closures inside the tick path. Cadence state
that must stay latest lives outside the render cycle (refs, worker-local state) rather than in
re-rendered component state.

**Dedicated timing worker.** Long-running or metronome-critical timing runs in a dedicated
Worker so main-thread rendering work cannot jitter the schedule. The worker is constructed via
`new Worker(new URL('<path>', import.meta.url))` and the URL specifier is treated as an import
specifier during any move refactoring.

**Byte-identical output contract.** Pure export or encoding modules that serialize persisted data
produce byte-identical output for identical input - refactoring preserves the bytes exactly, and
round-trip tests assert equality on the full buffer, not on sampled fields.

## Sources

- [Core Web Vitals](https://web.dev/vitals/) - Google's user-centric metrics
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - automated auditing
- [k6 Documentation](https://k6.io/docs/) - load testing
- [hyperfine](https://github.com/sharkdp/hyperfine) - CLI benchmarking
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) - bundle viz
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) - Vite bundle analysis
- [OpenTelemetry](https://opentelemetry.io/) - distributed tracing and metrics
- [Prometheus](https://prometheus.io/) - metrics collection and alerting
- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals) - field measurement

## Project Conventions

Project-specific values for the DOSOUND Tracker codebase.

- The audio tick runs at 50 Hz (20 ms per step) through `src/workers/sequencerWorker.ts`;
  no React re-render may occur inside the tick path.
