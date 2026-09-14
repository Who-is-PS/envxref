# Contributing to envxref

Thanks for your interest in improving envxref! This project is intentionally
small and easy to understand, and the best contributions keep it that way.

## Ground rules

- **Keep it focused.** envxref is a light source-code scanner that compares
  `process.env` usage with `.env.example`. Out of scope: AI, telemetry,
  accounts, cloud services, secret scanning, frameworks, web UI, and
  auto-fixing.
- **Every change ships with tests.** We use [Vitest](https://vitest.dev/).
- **No new runtime dependencies** without discussion first — the zero-dependency
  runtime is a feature.

## Development setup

Requires **Node.js >= 20**.

```bash
git clone https://github.com/Who-is-PS/envxref
cd envxref
npm install
```

Common tasks:

```bash
npm run typecheck   # type-check with tsc
npm test            # run the Vitest suite once
npm run test:watch  # watch mode
npm run build       # compile to dist/
```

Before opening a pull request, make sure all three pass:

```bash
npm run typecheck && npm test && npm run build
```

## Architecture

envxref keeps its concerns separated so new syntaxes are easy to add:

| Module            | Responsibility                                  |
| ----------------- | ----------------------------------------------- |
| `src/detectors/`  | Language-specific reference detection           |
| `src/scanner.ts`  | Recursive file walk + ignore rules              |
| `src/envfile.ts`  | Parse `.env.example` (names only, never values) |
| `src/compare.ts`  | Pure comparison of usage vs. documentation      |
| `src/report.ts`   | Output formatting and exit-code logic           |
| `src/cli.ts`      | Argument parsing and orchestration              |

### Adding a new detector

A detector is the main extension point. To support a new syntax (e.g. a new
runtime or language):

1. Create `src/detectors/<name>.ts` exporting a `Detector`:

   ```ts
   import type { Detector, EnvUsage } from "../types.js";

   export const myDetector: Detector = {
     name: "my-language",
     extensions: [".ext"],
     detect(content, file): EnvUsage[] {
       // return every { name, file, line } reference found
     },
   };
   ```

2. Register it in `src/detectors/index.ts`.
3. Add tests in `tests/`.

No other module needs to change — the scanner dispatches by file extension.

## Never print secret values

envxref must never read or print values from a real `.env` file. It only parses
variable **names** from `.env.example`. Please preserve this invariant; there is
a test that guards it.

## Pull requests

- Keep PRs small and focused on a single change.
- Reference the issue you're addressing.
- Describe user-facing changes in the PR body.

## Good first issues

Look for the [`good first issue`](https://github.com/Who-is-PS/envxref/labels/good%20first%20issue)
label. New detectors (Python, Deno, Bun) and documentation examples are great
entry points.

By contributing, you agree that your contributions will be licensed under the
project's [MIT License](./LICENSE).
