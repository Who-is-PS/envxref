# AGENTS.md

Guidance for AI coding agents (and humans in a hurry) working in this
repository.

## What this project is

`envxref` is a small TypeScript CLI that scans a JS/TS codebase for `process.env`
usage and compares it against `.env.example`, reporting documented / missing /
unused variables. It is a **light, dependency-light source-code scanner** — not
a schema or validation framework.

## Hard constraints

- **Node >= 20**, ESM (`"type": "module"`), TypeScript strict mode.
- **Zero runtime dependencies.** Do not add packages to `dependencies`. Dev
  dependencies are limited to TypeScript and Vitest.
- **Never print or read values from real `.env` files.** Only variable *names*
  from `.env.example` are ever parsed. A test enforces this — keep it green.
- **Out of scope** (do not add): AI, telemetry, accounts, cloud services, secret
  scanning, frameworks, web UI, auto-fixing.

## Layout

```
src/
  types.ts        Shared types (EnvUsage, Detector, ComparisonResult)
  detectors/      Language-specific detection (extension -> Detector)
  scanner.ts      Recursive file walk + ignore rules
  envfile.ts      Parse .env.example (names only)
  compare.ts      Pure usage-vs-documentation comparison
  report.ts       Formatting + exit-code logic
  cli.ts          Arg parsing + orchestration
  index.ts        Public library API
tests/            Vitest unit tests, one file per module
```

## Extension point

New syntaxes are added as **detectors**. Implement the `Detector` interface in
`src/detectors/<name>.ts`, register it in `src/detectors/index.ts`, and add
tests. Nothing else should need to change.

## Exit codes (do not change semantics)

- `0` — every used variable is documented (unused ones warn only)
- `1` — one or more used variables are missing from `.env.example`
- `2` — internal/runtime error

## Definition of done

Before finishing any change, run and confirm all pass:

```bash
npm run typecheck
npm test
npm run build
```

Keep changes small, well-tested, and easy to read. Match the surrounding code
style.
