

# Client-Proofing Strategy for Remixed AEO Sites

## The Problem

When you remix this site and hand it to a client on their own Lovable account, they have full access to the codebase. A well-meaning prompt like "change the homepage layout" could accidentally break the AEO engine, JSON-LD schema, sitemap generation, or admin tools.

## What Lovable Already Provides

- **Version History**: Every AI edit creates a restore point in the chat history. Clients can revert to any previous message.
- **Visual Edits**: Clients can change text, colors, and fonts directly on the page without touching code -- and it's free (no credits consumed for direct edits).

## What We Can Build (Layered Defense)

### Layer 1: "Client Mode" Landing Page in Admin

Add a simplified client-facing dashboard (separate from your full `/admin`) that gives them safe editing capabilities:

- Edit agent name, phone, email, social links, headshot photo
- Edit static page content (About, Contact page text)
- Swap cover images
- All changes go through controlled forms that only update localStorage/database values -- never touch component code

This gives clients a "CMS-like" experience without needing to prompt the AI at all.

### Layer 2: Knowledge File Guard Rails

Add a **project knowledge file** (Settings -> Manage Knowledge) to every remixed site with instructions like:

> "IMPORTANT: This site uses a custom AEO framework. The following files and directories must NEVER be modified: `src/lib/aeo-types.ts`, `src/components/AeoPageTemplate.tsx`, `src/components/admin/`, `src/lib/sitemap.ts`, `src/lib/fair-housing.ts`, `supabase/functions/`. When the user asks for changes, only modify content in page components (Index, About, Contact, Blog, Neighborhoods) and styling. Never alter the routing structure in App.tsx, the JSON-LD generation, or the admin tools."

This acts as a soft guardrail -- the AI will respect these instructions in most cases.

### Layer 3: Automated Database Backups

Build a scheduled backup system using a backend cron job:

- Every 24 hours, snapshot all AEO page data and entity config from localStorage into a `site_backups` database table
- Store the last 7-14 snapshots
- Add a "Restore from Backup" button in the admin panel
- This protects the **data** (pages, config) even if a client's prompt accidentally wipes localStorage

### Layer 4: Read-Only Core Files Documentation

Add a `README-CLIENT.md` to the project root that clearly documents:
- What clients CAN safely change (page content, images, colors, text)
- What they should NOT touch (admin tools, AEO engine, edge functions)
- How to use Visual Edits for safe changes
- How to revert if something goes wrong

## Recommended Implementation Order

1. **Knowledge file guard rails** -- immediate, zero code, highest impact
2. **Client Mode dashboard** -- gives clients a safe editing UI
3. **Database backups** -- protects page data with scheduled snapshots
4. **Client README** -- documentation for onboarding

## Technical Details

### Client Dashboard (Layer 2)
- New route: `/client` or `/dashboard`
- Forms for: agent identity, social links, static page content
- All edits write to localStorage or a new `site_config` database table
- No access to Page Generator, Cannibalization Scanner, or other admin tools

### Database Backup System (Layer 3)
- New database table: `site_backups` with columns for `id`, `backup_data` (JSONB), `created_at`
- New edge function: `create-backup` -- serializes current page data and config into a JSON snapshot
- Cron job: runs `create-backup` every 24 hours via `pg_cron`
- Admin UI: "Backups" tab showing available snapshots with a "Restore" button
- Keeps last 14 backups, auto-deletes older ones

### Knowledge File Content (Layer 1)
This is the fastest win -- no code changes needed. You add it through Lovable's Settings for each remixed project. It instructs the AI to protect critical files.

## Important Caveat

No system can 100% prevent a determined user from breaking things via AI prompts -- they own the project. But these layers make accidental damage very unlikely and recoverable when it happens. The combination of guard rails + backups + a safe editing UI covers the vast majority of real-world scenarios.
