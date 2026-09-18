# pnpm CI example

Install dependencies with a frozen lockfile so the CI result matches local
development:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: pnpm
- run: pnpm install --frozen-lockfile
- run: pnpm test
```

Run the detector against the same workspace paths used by the build. This
prevents an environment-variable check from passing against a different
package root than the one CI actually publishes.
