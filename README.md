# envxref

**Env**ironment variable **cross-ref**erence: detect the environment variables
your JavaScript/TypeScript or Python code actually uses, and compare them
against your `.env.example`.

envxref is a light, dependency-light source-code scanner — not a schema or
validation framework. It reads your code and your `.env.example`, and tells you
where they disagree.

## The problem

`.env.example` is supposed to be the contract for your app's configuration — but
it drifts. Someone adds `process.env.REDIS_URL` in code and forgets to document
it, or an old variable lingers in `.env.example` long after the code that used it
was deleted. New contributors then clone the repo, copy `.env.example`, and hit
runtime errors for variables that were never listed.

`envxref` closes that gap. It statically scans your source for `process.env`
references and tells you exactly which variables are documented, which are used
but **missing** from `.env.example`, and which are documented but **unused**.

It never reads or prints values from a real `.env` file — it only needs
`.env.example`.

## Installation

Requires **Node.js >= 20**.

```bash
# one-off, no install
npx envxref

# or install as a dev dependency
npm install --save-dev envxref

# or globally
npm install --global envxref
```

## Quick start

Run it in your project root (where `.env.example` lives):

```bash
envxref
```

Or point it at a specific directory:

```bash
envxref ./services/api
```

`envxref` scans `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, and `.py` files
recursively, skipping `node_modules`, `dist`, `build`, `coverage`, and `.git`.
Python files are checked for `os.getenv("VAR")` / `os.getenv('VAR')`.

## Example output

```
✓ DATABASE_URL  src/db.ts:10
✗ REDIS_URL     src/cache.ts:17  missing from .env.example
⚠ OLD_API_URL   unused

1 documented, 1 missing, 1 unused
```

| Symbol | Meaning                                              |
| ------ | ---------------------------------------------------- |
| `✓`    | Used in source **and** present in `.env.example`     |
| `✗`    | Used in source but **missing** from `.env.example`   |
| `⚠`    | Present in `.env.example` but **unused** in source   |

### Exit codes

| Code | Meaning                                                        |
| ---- | ------------------------------------------------------------- |
| `0`  | Every used variable is documented (unused ones only warn)     |
| `1`  | One or more used variables are missing from `.env.example`    |
| `2`  | Internal / runtime error                                      |

Unused variables are warnings only — they never fail the run.

## CI examples

Add `envxref` to your pipeline to fail builds when an undocumented variable
sneaks in:

### GitHub Actions

```yaml
name: envxref

on: [push, pull_request]

jobs:
  envxref:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx envxref
```

### GitLab CI

```yaml
envxref:
  image: node:20
  script:
    - npx envxref
```

## Use as a library

The pieces are exported so you can build your own tooling:

```ts
import { scanDirectory, readEnvExample, compare } from "envxref";

const usages = await scanDirectory("./src");
const documented = (await readEnvExample("./.env.example")) ?? [];
const result = compare(usages, documented);

console.log(result.missing); // string[]
```

## Design

`envxref` keeps scanning, parsing, comparison, and output in separate modules so
new environment-variable syntaxes are easy to add:

| Module              | Responsibility                                      |
| ------------------- | --------------------------------------------------- |
| `src/detectors/`    | Language-specific reference detection               |
| `src/scanner.ts`    | Recursive file walk + ignore rules                  |
| `src/envfile.ts`    | Parse `.env.example` (names only, never values)     |
| `src/compare.ts`    | Pure comparison of usage vs. documentation          |
| `src/report.ts`     | Output formatting and exit-code logic               |
| `src/cli.ts`        | Argument parsing and orchestration                  |

Adding a new language (Python, Go, ...) is a matter of implementing the
`Detector` interface and registering it in `src/detectors/index.ts` — no other
module changes.

## Contributing

Contributions are welcome, especially new detectors.

```bash
git clone https://github.com/Who-is-PS/envxref
cd envxref
npm install

npm run typecheck   # type-check
npm test            # run the Vitest suite
npm run build       # compile to dist/
```

Good first contributions:

- A `python` detector (`os.environ["X"]`, `os.getenv("X")`)
- A `go` detector (`os.Getenv("X")`)
- Detecting env vars in GitHub Actions workflow files

Please keep additions small and well-tested — the goal of v0.1 is a focused,
easy-to-understand tool. Out of scope for now: AI, telemetry, accounts, cloud
services, secret scanning, web UI, and auto-fixing.

## License

[MIT](./LICENSE)
