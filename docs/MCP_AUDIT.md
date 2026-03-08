# MCP Security and Governance Audit

Audit of all MCP servers configured for the mini-rv project. Performed after adding Supabase, Stripe, and GitHub MCPs to `.cursor/mcp.json`.

## Known issue: Cursor and dynamic client registration

Cursor uses OAuth with **dynamic client registration** for remote MCP URLs. The auth servers for Supabase, Stripe, and GitHub **do not support** this, so Cursor fails with:

`Incompatible auth server: does not support dynamic client registration`

**Mitigation:** We re-added all three using auth that avoids DCR: **Stripe** and **GitHub** run locally (stdio: Stripe via `npx @stripe/mcp`, GitHub via Docker) and use env vars for secrets; **Supabase** uses the remote URL with a Bearer PAT in the `Authorization` header. If Supabase still triggers DCR, add it in Cursor Settings with the header set there. See [.cursor/README.md](../.cursor/README.md).

## 2.1 Discovery

**Config scanned:** Project-level `.cursor/mcp.json` only. User-level `~/.cursor/mcp.json` is not committed; if present, Cursor merges it with project config.

**Current project config:** shadcn, Stripe (stdio), Supabase (remote + headers), GitHub (stdio via Docker).

| Server   | Type   | Transport     | Auth in config |
|----------|--------|---------------|----------------|
| shadcn   | stdio  | command       | No             |
| stripe   | stdio  | npx           | Env (STRIPE_SECRET_KEY) |
| supabase | http   | url + headers | Bearer placeholder (replace with PAT) |
| github   | stdio  | docker        | Env (GITHUB_PERSONAL_ACCESS_TOKEN) |

No literal secrets in committed config; Supabase uses a placeholder token (replace locally or in Cursor Settings). Stripe and GitHub use env vars.

## 2.2 Classification

Per MCP security-audit skill: all configured servers are **shadow MCPs** (not Runlayer-managed). Vendor/official remotes are acceptable with explicit project approval.

| Server   | Classification   | Criteria |
|----------|------------------|----------|
| shadcn   | Shadow (stdio)   | Local `npx shadcn@latest mcp`; not Runlayer |
| stripe   | Shadow (stdio)   | Local `npx @stripe/mcp`; not Runlayer |
| supabase | Shadow (remote) | `https://mcp.supabase.com/mcp` + Bearer header; not Runlayer |
| github   | Shadow (stdio)   | Local Docker `ghcr.io/github/github-mcp-server`; not Runlayer |

**Note:** cursor-ide-browser may appear in Cursor’s MCP list from a different config (e.g. user-level). If present, classify as Shadow (stdio or remote) and apply the same risk checks.

## 2.3 Risk checklist (per server)

- **shadcn:** No auth (registry read-only). No destructive tools. Low risk; approved as tooling MCP.
- **supabase:** Auth via browser OAuth on first use. Config uses `read_only=true` and `project_ref` (user must replace placeholder). Destructive tools exist on the server (e.g. `apply_migration`) but read_only limits DB to read-only Postgres user. **Remediation:** Ensure `YOUR_SUPABASE_PROJECT_REF` is replaced; keep read_only for daily use.
- **stripe:** Auth via OAuth on first use. Destructive tools (create_customer, create_refund, etc.). **Remediation:** Use remote URL only (no secret key in config); keep “confirm before run” enabled in Cursor.
- **github:** Auth via Cursor prompt (PAT) or OAuth depending on client. Can create issues, list PRs, etc. **Remediation:** Store PAT in Cursor secret inputs or env only; document Copilot requirement if using Copilot-specific features.

**Secrets in repo:** None found. `.env.local` is gitignored; `.cursor/README.md` instructs keeping secrets out of `mcp.json`.

## 2.4 Summary table and remediations

| Server   | Type  | Classification   | Auth        | Destructive tools | Remediation |
|----------|-------|------------------|-------------|-------------------|-------------|
| shadcn   | stdio | Shadow (stdio)  | None        | No                | None; approved tooling. |
| supabase | http  | Shadow (remote)  | OAuth       | Yes (read_only mitigates) | Replace project_ref; keep read_only. |
| stripe  | http  | Shadow (remote)  | OAuth       | Yes               | Use remote only; confirm before run. |
| github   | http  | Shadow (remote)  | PAT/OAuth   | Yes               | PAT in Cursor/env only; document Copilot if needed. |

**Governance:** These MCPs are explicitly approved for mini-rv as vendor/official or trusted tooling. Runlayer is preferred where an equivalent exists; none were in use at audit time.

## References

- [Supabase MCP security](https://supabase.com/docs/guides/getting-started/mcp#security-risks)
- [Stripe MCP](https://docs.stripe.com/mcp)
- [.cursor/README.md](../.cursor/README.md) — setup and placeholder replacement
