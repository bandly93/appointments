# Server

Express + Prisma API, organized by **feature** instead of by technical layer (MVC).

## Why feature-based, not MVC

A classic MVC layout groups files by *type*:

```
controllers/
  authController.ts
  appointmentController.ts
routes/
  authRoutes.ts
  appointmentRoutes.ts
```

Working on one feature means jumping between folders. As the app grows, each
folder becomes a flat list of files from every feature, and it's hard to tell
what belongs together or what's safe to delete.

Instead, this project groups files by *feature* — everything a feature needs
(routes, controller, service, repository, helpers) lives in one folder. Shared,
cross-feature code lives separately in `config/` and `lib/`.

## Folder structure

```
src/
  auth/                   # feature module
    auth.routes.ts        # Express Router — defines endpoints, wires them to controller functions
    auth.controller.ts    # HTTP layer — reads req/res, calls service/repository, shapes the response
    auth.service.ts        # business logic — validation, orchestration (e.g. registerUser)
    auth.repository.ts     # data access — the only place that talks to Prisma for this feature
    password.ts            # feature-local helper (hashing/verifying passwords)
  config/
    env.ts                 # validated environment variables, read once at startup
  lib/
    prisma.ts               # shared PrismaClient singleton, used by every feature's repository
  generated/                # Prisma client output (generated, not hand-edited)
  server.ts                 # app entrypoint — creates the Express app, mounts feature routers

prisma/
  schema.prisma             # database schema
  migrations/                # migration history
```

## Conventions

- **One folder per feature** (`auth/`, and future ones like `appointments/`,
  `users/`), named after the domain concept it owns.
- **File naming**: `<feature>.<layer>.ts` (e.g. `auth.routes.ts`,
  `auth.controller.ts`). Makes it obvious what a file belongs to when editors
  show only the filename.
- **Layering within a feature** (routes → controller → service → repository)
  is still followed, but scoped to the feature instead of spread across the
  whole app:
  - `*.routes.ts` — maps HTTP verbs/paths to controller functions.
  - `*.controller.ts` — talks to `req`/`res`; no direct Prisma calls.
  - `*.service.ts` — business rules that don't belong in the controller
    (e.g. "reject registration if the email is already in use").
  - `*.repository.ts` — the only files that import `prisma` for that
    feature; all queries for the feature live here.
  - Simple features (like `auth`'s `login`) may skip the service layer and
    call the repository/Prisma directly from the controller if there's no
    real business logic to isolate yet.
- **Shared code only** goes in `config/` (env/config loading) or `lib/`
  (shared clients/utilities, like the Prisma singleton). If it's only used by
  one feature, it belongs inside that feature's folder, not in `lib/`.
- **`src/generated/`** is Prisma-generated output — never edit by hand,
  regenerate with `npx prisma generate`.

## Adding a new feature

1. Create `src/<feature>/`.
2. Add `<feature>.routes.ts`, `<feature>.controller.ts`, and (as needed)
   `<feature>.service.ts` / `<feature>.repository.ts`.
3. Mount the router in `server.ts`:
   ```ts
   import <feature>Router from './<feature>/<feature>.routes.js'
   app.use('/api/<feature>', <feature>Router)
   ```
