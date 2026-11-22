# fsfai

Interactive CLI that generates a ready-to-use [Turborepo](https://turborepo.com) monorepo with NestJS, Expo and/or Next.js apps already configured, Oxc tooling, a typed API client and AI agent instructions.

Every dependency is installed at its latest version when you create the project.

## Usage & install

Create a project without installing anything globally:

```sh
npm create @alejandrohn/fsfai
# or
pnpm create @alejandrohn/fsfai
```

Or install the CLI globally and run `fsfai`:

```sh
npm i -g @alejandrohn/fsfai
fsfai
```

Options:

| Flag | Description |
| --- | --- |
| `-h`, `--help` | Show usage and exit. |
| `-v`, `--version` | Show the installed version and exit. |

Requirements:

- Node.js >= 20.
- `pnpm` or `npm` installed (you pick one during the wizard).
- An internet connection: the CLI runs `create-turbo`, the official app CLIs and installs packages from npm.

> The wizard prompts are in Spanish.

## What it generates

### Prompt flow

All questions are asked before anything is created:

1. Confirm you want to create a new project.
2. Project name (must be a valid npm package name and a folder that does not exist yet).
3. Package manager: `pnpm` (default) or `npm`.
4. Which apps to create: NestJS, Expo, Next.js (any combination).
5. For each app: its folder name under `apps/` and its options (see below).
6. Which AI agent you use: Claude Code (`CLAUDE.md`) or other (`AGENTS.md`).
7. External skills to install for the agent.

A summary is shown, then the project is created.

### Apps

| App | Default folder | What gets configured |
| --- | --- | --- |
| **NestJS** | `apps/api` | ESM backend on PostgreSQL with **Drizzle** or **TypeORM** (you choose), Better Auth, nestjs-pino, class-validator, Scalar API docs at `/openapi.json`, Vitest, and tables split by schema. |
| **Expo** | `apps/mobile` | Packages installed with `expo install` (SDK-compatible versions): HeroUI Native, Uniwind, Better Auth client, Expo Vector Icons, React Hook Form, TanStack Query, Zod, FlashList. Providers are wired up. |
| **Next.js** | `apps/web` | Better Auth, React Hook Form, Zod, Lucide React, shadcn/ui, nuqs, Sonner and a `cn` helper (clsx + tailwind-merge), already connected. |

You pick which packages each front-end app gets; all are selected by default.

### Shared packages and tooling

- **`packages/api-client`** (created whenever NestJS is selected): types and resources generated from the NestJS OpenAPI document, used as `api.user.find({ name: 'user' })`. Regenerate with `<pm> run api:generate`. Front-end apps get it as a workspace dependency.
- **Oxc:** ESLint and Prettier are replaced by Oxlint and Oxfmt across the monorepo (`lint`, `format`, `format:check` scripts).
- **AI agent files:** `CLAUDE.md` or `AGENTS.md` with project instructions, plus convention skills for the selected apps (`nestjs-backend`, `typescript-frontend`) in `.claude/skills/` or `.agents/skills/`.
- **External skills:** optional skills installed with `skills add` (currently `Klerith/fernando-skills`: `/spec` and `/spec-impl`). If the network fails, the CLI prints the command to retry and keeps going.

### Example result

With all three apps and Claude Code:

```
my-app/
├── apps/
│   ├── api/                 # NestJS
│   ├── mobile/              # Expo
│   └── web/                 # Next.js
├── packages/
│   ├── api-client/          # @repo/api-client
│   └── typescript-config/
├── .claude/skills/
│   ├── nestjs-backend/
│   ├── typescript-frontend/
│   ├── spec/
│   └── spec-impl/
├── CLAUDE.md
├── .oxlintrc.json
├── .oxfmtrc.json
├── turbo.json
└── package.json
```

Then:

```sh
cd my-app
pnpm run dev
```

## License

[MIT](./LICENSE)
