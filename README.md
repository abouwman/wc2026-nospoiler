# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/World Cup No Spoiler.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `World Cup No Spoiler` project files (HTML prototypes, assets, components)

## Auto-updating highlights

Played matches and their highlight clips live in `src/data/matches.generated.json`.
That file is maintained automatically by `scripts/update-highlights.mjs`, run hourly
by the **Update highlights** GitHub Action (`.github/workflows/update-highlights.yml`).
When a match's highlight appears on YouTube it parses the FIFA / FOX Sports titles
into a new card (EN short + extended, US-only) and finds the NOS Sport Dutch
summary (NL-only), then commits the change — Vercel redeploys automatically.

It also resolves each match's official **fifa.com/watch** link (used by the
"International" button) via the Bing Web Search API — fifa.com itself is
JS-rendered and bot-blocks CI runners, so a search API is the reliable route.

Setup: add a **`YOUTUBE_API_KEY`** repository secret (YouTube Data API v3 key)
and a **`BING_SEARCH_KEY`** repository secret (Azure "Bing Search v7" resource;
the free F1 tier is enough). Without `BING_SEARCH_KEY` the International button
simply doesn't appear for matches whose fifa.com link isn't curated yet.
Optional repo *variables* `FIFA_HANDLE` / `FOX_HANDLE` / `NOS_HANDLE` override the
channel handles (defaults: `fifa`, `foxsports`, `nossport`). Run it on demand from
the Actions tab ("Run workflow"). Without the secret the Action no-ops with an error.
