# Banking Onboarding Case Reviewer — Minimal Fullstack Scaffold

This repository provides a minimal, assessment-focused TypeScript fullstack scaffold for evaluating onboarding cases in a banking context. It is intentionally small and designed for experimentation and review.

**Structure**
- `client` — React + Vite + TypeScript frontend
- `server` — Node + Express + TypeScript backend using Prisma + SQLite
- `shared` — TypeScript contracts shared between client and server

**Quick start**
1. Install workspace dependencies:

```bash
npm run install-all
```

2. Initialize database and seed sample cases:

```bash
cd server
npx prisma generate
npx prisma db push
npm run seed
```

3. Run both services from workspace root:

```bash
npm run dev
```

Frontend: http://localhost:5173/  
Backend API: http://localhost:4000/

**Architecture**
- Client: minimal UI to list cases, select a case, choose autonomy mode, run reviews, and display findings, execution trace, and recommendations.
- Server: Express API exposing case CRUD, orchestration endpoints, and persistence of `AgentRun` and `Recommendation` in SQLite via Prisma.
- Shared: typed TypeScript contracts for domain models and agent inputs/outputs.

**Agents**
- DocumentCompleteness: checks presence of identity and address documents.
- IdentityConsistency: compares applicant name against identity fields.
- RiskIndicator: surfaces case risk indicators (e.g., `SANCTIONS_MATCH`, `PEP_EXCEPTION`).
- Recommendation: consumes all agent findings and applies deterministic rules.

Agents are pure TypeScript functions returning typed findings; they do not perform external network calls in this scaffold.

**Workflow & Orchestrator**
- The orchestrator runs the first three agents sequentially (DocumentCompleteness, IdentityConsistency, RiskIndicator), records an execution trace, aggregates findings, then calls the Recommendation agent.
- Agents are retried once on failure; failures degrade safely (an `agent_error` finding is recorded and processing continues).

Recommendation rules (deterministic):
- `SANCTIONS_MATCH` → `REJECT`
- `PEP_EXCEPTION` or `HIGH_RISK` → `REFER`
- Missing documents or identity mismatch → `REFER`
- Otherwise → `APPROVE`

The orchestrator persists an `AgentRun` (input, findings, trace) and a linked `Recommendation`.

**Autonomy modes supported**
- `AUTONOMOUS` — agents decide automatically according to rules.
- `ASSISTIVE` — agents provide findings; UI may require a human step (not fully implemented here).
- `MANUAL` — UI-driven manual review (Approve / Reject buttons present).

The orchestrator accepts options: `humanApprovalRequired` and `exceptionOnly` to influence recommendation behavior.

**Security & Operational notes**
- This scaffold uses SQLite for ease of development — do not use in production for sensitive data.
- Environment secrets (e.g., `DATABASE_URL`) must be stored out-of-repo; `.env.example` is provided.
- No authentication or encryption is implemented; add TLS, authentication, RBAC, and audit logging before production use.
- Sanitize and validate inputs when integrating real upstream data sources.

**Limitations & Known Gaps**
- Agents are simplistic and deterministic for assessment purposes. They do not call external screening or sanctions/PEP services.
- No rate limiting, auth, or multi-tenant support.
- Data is stored in SQLite and JSON-serialized strings for simplicity.

**Productionization checklist**
- Replace SQLite with a managed relational DB (Postgres, etc.) and migrate Prisma schema types (use native `Json` where supported).
- Add authentication, authorization, and strong encryption for stored PII.
- Implement robust observability (metrics, traces, structured logs).
- Implement input validation, retry policies, and circuit breakers for external services.
- Add end-to-end tests and CI pipeline.

**AI disclosure**
This project contains agent-like components that process structured case data and return deterministic findings and recommendations. The agents in this scaffold are simple programmatic functions — they are not machine-learning models. If you later integrate generative or ML-based components, disclose their use, record inputs/outputs for auditing, and implement human-in-the-loop safeguards where required by policy or regulation.

**Files of interest**
- `server/prisma/schema.prisma` — data model
- `server/prisma/seed.ts` — synthetic seed data (CLEAN, PEP_EXCEPTION, SANCTIONS_MATCH)
- `server/src/orchestrator.ts` — orchestration logic
- `server/src/agents.ts` — agent implementations
- `client/src/App.tsx` — minimal UI for running reviews and viewing results

**Run tests**
From `server` run:

```bash
npm run test
```

This runs a simple TypeScript test that executes the orchestrator on the seeded CLEAN case and asserts an `APPROVE` recommendation.

---
Keep changes small and focused; open an issue if you want me to expand agents to call external screening services or to add authentication and audit logging.
