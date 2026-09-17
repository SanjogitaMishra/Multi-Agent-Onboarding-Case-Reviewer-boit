# Banking Onboarding Case Reviewer — Minimal Fullstack Scaffold

This workspace contains a minimal TypeScript fullstack scaffold for a banking onboarding case reviewer.

Structure:
- `client` — React + Vite + TypeScript frontend
- `server` — Node + Express + TypeScript backend using Prisma + SQLite
- `shared` — TypeScript contracts shared between client and server

Quick start (macOS / zsh):

1. Install dependencies for all workspaces:

```bash
npm run install-all
```

2. Generate Prisma client and push schema, then seed DB (server):

```bash
cd server
npm run prisma:generate
npm run prisma:push
npm run seed
```

3. In the workspace root, run both services locally:

```bash
npm run dev
```

Notes:
- Uses `prisma` with SQLite. See `server/prisma/schema.prisma`.
- Keep the scaffold minimal and assessment-focused; adjust as needed.
