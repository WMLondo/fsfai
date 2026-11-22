---
name: typescript-frontend
description: Use ALWAYS when reading, writing or reviewing frontend or mobile code (Next.js, Expo, React): components, hooks, types, forms, data fetching or tests.
---

# TypeScript frontend/mobile — style guide

Apps: {{frontendAppPaths}}. Package manager: **{{packageManager}}**.

Adapted from mkosir's [TypeScript Style Guide](https://mkosir.github.io/typescript-style-guide/).
Lint with **Oxlint** and format with **Oxfmt** from the root (`{{packageManager}} run lint`, `{{packageManager}} run format`).
Do not add ESLint or Prettier.

## TLDR

- Use `as const` for constants: stronger type safety and immutability.
- Prefer immutable data: `Readonly`, `ReadonlyArray`.
- Most properties should be required. Use optional ones sparingly.
- Use discriminated unions to model states and variants.
- Avoid type assertions (`as`, `!`). Define the types properly.
- Pure, stateless functions with a single responsibility.
- Consistent, readable names across the codebase.
- Named exports only. No `export default` (except route and config files that require it).
- Organize code by feature and colocate related modules.
- `type` instead of `interface` and `Array<T>` instead of `T[]`.

## Which reference to load

Read only the reference the task needs:

| Task | Reference |
| --- | --- |
| Defining or reviewing types, `any`/`unknown`, assertions, `type` vs `interface`, arrays, type imports | `references/types.md` |
| Modeling states, variants, API responses or mutually exclusive props | `references/discriminated-unions.md` |
| Writing functions: arguments, optionals, return types, purity | `references/functions.md` |
| Constants, `as const`, enums, `null`/`undefined` | `references/variables.md` |
| Naming variables, functions, types, generics, components, hooks, props, handlers; comments | `references/naming.md` |
| Where to put a file, folder structure, imports | `references/source-organization.md` |
| Components, props, hooks and state in React / React Native | `references/react.md` |
| Writing or reviewing tests | `references/tests.md` |
