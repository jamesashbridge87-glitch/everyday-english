# Session Notes

Handoff document — last updated **2026-05-06**.

Resume from the **Pending** section below.

---

## Done & shipped to production

### PR #1 — Hero spacing + analytics install (merged 2026-05-02)
https://github.com/jamesashbridge87-glitch/everyday-english/pull/1

- **Hero spacing** (`style.css`): logo `200px → 120px`, avatar `120px → 80px`, tightened brand padding, headline/subheadline margins, social-proof banner padding. Changed `.landing-content` to `justify-content: flex-start` so the email capture lands above the fold.
- **Meta Pixel** `1414360586898639`: base snippet + `<noscript>` in `<head>`. `PageView` on load. `Lead` fires only inside `response.ok && data.success` with `currency: AUD, value: 5.00, content_name: 'Small Talk Survival Guide', content_category: 'Lead Generation'`.
- **GA4** `G-JPPBPVVNYN`: gtag.js in `<head>`. `page_view` auto, `generate_lead` in success branch with `currency`, `value`, `content_name`.
- **Microsoft Clarity** `w44i7isac0`: standard async snippet in `<head>`.
- All event calls guarded with `typeof === 'function'` so blockers can't break form submit.

**Verified live**: Pixel Helper showed `Lead` with currency/value ✅; Clarity Live showed test session ✅; GA4 Realtime showed `page_view` with correct page title ✅.

### PR #6 — Tracked redirect for PDF soft-pitch (merged 2026-05-06)
https://github.com/jamesashbridge87-glitch/everyday-english/pull/6

- New file `go/90sa/index.html` served at `https://guide.youraussieuncle.com.au/go/90sa`
- Fires Meta Pixel `ViewContent` (`content_name: '90 Second Aussie'`, `content_category: 'PDF Soft Pitch'`, `content_ids: ['90-second-aussie']`) and GA4 `select_content` (`content_type: 'pdf_softpitch'`, `item_id: '90-second-aussie'`)
- 400ms delay (spinner + "On ya way, mate…" copy) ensures events flush before redirect
- Hardcoded destination: `https://youraussieuncle.com.au/90-second-aussie?utm_source=lm_smalltalk_pdf&utm_medium=pdf_softpitch&utm_campaign=90sa_ups`
- `90sa_ups` (not `90sa_upsell`) is intentional — keeps the campaign value stealth if the user inspects the URL bar
- `<noscript>` meta-refresh fallback keeps the redirect working with JS disabled (no tracking in that case)
- **Action required after this PR**: re-export the guide PDF with the soft-pitch link changed from the destination URL to `https://guide.youraussieuncle.com.au/go/90sa`. Re-upload to Drive. If the file ID changes, update `index.html` `pdf-download-btn` href.

### PR #5 — Spam folder hint on success card (merged 2026-05-06)
https://github.com/jamesashbridge87-glitch/everyday-english/pull/5

Minor copy tweak: appended "check your inbox (and spam folder, just in case)" to the email backup line.

### PR #4 — Success card copy update (merged 2026-05-06)
https://github.com/jamesashbridge87-glitch/everyday-english/pull/4

- Headline: "Your guide is ready" → "You're in, mate."
- Added sub-headline: "Your Small Talk Survival Guide is ready below."
- Bridge copy seeds the "step two" upsell concept ("Reading the guide is step one. Using it next Monday morning when someone says 'how was your weekend?' at the kettle, that's step two.")
- Removed celebration emoji — new headline carries the moment

### PR #3 — Download button on success card (merged 2026-05-06)
https://github.com/jamesashbridge87-glitch/everyday-english/pull/3

- Replaced "Check your email" success message with a primary `Open Your Guide Now` button linking to the Drive PDF (https://drive.google.com/file/d/1fxfFPcZNE8eWDHkOhC2XfYfMb2SoGp9L/view)
- `target="_blank" rel="noopener noreferrer"` so success card stays open as a CTA surface for future video/soft-pitch
- Email messaging kept as helper text below
- Click fires Meta Pixel `ViewContent` (with UTMs) and GA4 `file_download` — used `ViewContent`, not a second `Lead`, to avoid inflating Lead count / corrupting CPL math

### PR #2 — UTM capture and forwarding (merged 2026-05-06)
https://github.com/jamesashbridge87-glitch/everyday-english/pull/2

- **`index.html`**: captures `utm_source/medium/campaign/term/content` from URL on load, sessionStorage fallback for internal nav. Forwards to `/api/subscribe` body and includes in `Lead` + `generate_lead` event params.
- **`api/subscribe.js`**: accepts `utm` + `referrer`, whitelists allowed keys, caps length, forwards to ConvertKit via `fields` parameter.
- **Dashboard setup completed by user**:
  - ConvertKit custom fields created: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`
  - GA4 custom dimensions registered for the same keys

**Verified live**: `curl` confirmed `captureUtmParams` and `utm:` are in the served HTML ✅. End-to-end UTM flow not yet tested in dashboards (see Pending A).

### Production verification commands
```bash
# Confirm analytics snippets are deployed
curl -s "https://guide.youraussieuncle.com.au/?cb=$(date +%s)" \
  | grep -E "fbq\('init'|gtag\('config'|clarity\.ms"

# Confirm UTM code is deployed
curl -s "https://guide.youraussieuncle.com.au/?cb=$(date +%s)" \
  | grep -E "captureUtmParams|utm:"
```

---

## Pending — pick up here

### A. UTM end-to-end flow — verification status
Tested with `https://guide.youraussieuncle.com.au/?utm_source=test&utm_medium=manual&utm_campaign=verify`:
1. ✅ **Pixel Helper** showed `Lead` with UTM params
2. ⚠️ **GA4 Realtime** — `generate_lead` not visible. **Debug parked 2026-05-06.** `page_view` works (so GA4 base is loading), but `generate_lead` doesn't appear in Realtime. When resuming:
   - F12 → Network → filter `collect` → submit form → look for second POST with `en=generate_lead`
   - Check `typeof gtag` in Console after page load
   - Try manually firing in Console: `gtag('event', 'generate_lead', { currency: 'AUD', value: 1, content_name: 'manual-test' })`
   - GA4 dashboard lag for first instance of new event names can be several minutes to hours
3. ✅ **ConvertKit** subscriber showed UTMs populated

Net: Meta + ConvertKit attribution working. GA4 event-level attribution unverified, but GA4's built-in Acquisition reports still pick up UTMs via auto-captured `page_view`, so campaign reporting isn't blocked.

### B. Remaining post-launch tasks (priority order)
1. **GA4 Key Event** — Admin → Events → toggle `generate_lead` (and consider `file_download` and `ViewContent` equivalents) as Key Events so they show in conversion reports.
2. **Meta Custom Audiences** — build retargeting audiences now so they populate:
   - Audience 1: fired `Lead` (warm list for upsell)
   - Audience 2: fired `ViewContent` for the guide (downloaded — hottest list for 90SA upsell)
   - Audience 3: page viewers who didn't fire `Lead` (drop-off retargeting)
   - Optional: segment by `utm_campaign` for campaign-level retargeting
3. **PDF soft-pitch to 90SA** — redirect tracker shipped (PR #6). Outstanding step: re-export PDF with link target changed from the destination URL to `https://guide.youraussieuncle.com.au/go/90sa`, then re-upload to Drive. If file ID changes, update `index.html` `pdf-download-btn` href.
4. **Click-to-play video on success card** — parked, no video recorded yet. When recorded, embed (Loom or YouTube unlisted) above the download button. Click-to-play, not autoplay.
5. **ManyChat ↔ Vercel handshake** (Phase 2): track "landed but didn't submit" + "submitted but didn't download" → trigger automated re-engagement DMs. Architecture:
   - ManyChat appends `mc_id={{user_id}}` to URL
   - Page fires server event on load → mark "landed"
   - On submit/download → mark "subscribed"/"downloaded" via webhook to ManyChat API
   - ITP/Brave strip URL params — treat as best-effort signal, not source of truth
   - Email is the durable identifier post-submit; `mc_id` only matters for the "abandoned" cohort
6. **Revisit `value: 5.00` AUD placeholder** — update once real CPL or LTV is known.
7. **Cookie consent banner** — only required if EU/UK traffic. Skip if AU-only.
8. **Copy update** — `urgency-banner` says "March 2026"; today is May 2026. Refresh.

### C. Meta diagnostic warning
Per the original brief, Events Manager "missing currency/value" warning takes up to 24h to clear after first clean events. Should be cleared by now (PR #1 shipped 2026-05-02) — confirm and move on.

---

## Reference

- **Repo**: `jamesashbridge87-glitch/everyday-english`
- **Production**: https://guide.youraussieuncle.com.au
- **Working branch**: `claude/general-session-OYW9L` (reused across sessions, force-reset from main between PRs)
- **Form architecture**: custom `<form>` in `index.html` POSTs to `/api/subscribe` (Vercel function calling ConvertKit v3 API). Form ID `9135329`. NOT a Kit-hosted embed — success branch is in inline JS in `index.html`, which is where all conversion events fire.

### IDs in one place
| Tool | ID |
|---|---|
| Meta Pixel | `1414360586898639` |
| GA4 | `G-JPPBPVVNYN` |
| Clarity | `w44i7isac0` |
| ConvertKit form | `9135329` |

### ConvertKit custom fields (must exist or fields are silently dropped)
`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`

### GA4 custom dimensions (event-scoped)
`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`

### Tracked redirect (PDF soft-pitch link)
- **PDF link should point to**: `https://guide.youraussieuncle.com.au/go/90sa`
- **Redirects to**: `https://youraussieuncle.com.au/90-second-aussie?utm_source=lm_smalltalk_pdf&utm_medium=pdf_softpitch&utm_campaign=90sa_ups`
- `90sa_ups` is stealth shorthand — do not change to `90sa_upsell` (intentional to obscure the upsell intent if user inspects URL)

### Canonical UTM URL (ManyChat auto-DM to new IG followers)
```
https://guide.youraussieuncle.com.au/?utm_source=instagram&utm_medium=auto_dm&utm_campaign=lm_small_talk&utm_content=new_follower_everyday
```

| Param | Value | Purpose |
|---|---|---|
| `utm_source` | `instagram` | platform |
| `utm_medium` | `auto_dm` | delivery mechanism |
| `utm_campaign` | `lm_small_talk` | lead magnet identifier (`lm` prefix = lead magnet) |
| `utm_content` | `new_follower_everyday` | audience segment |

**Convention**: snake_case with underscores (not hyphens). Stick to this — mixing `auto_dm` and `auto-dm` will fragment reports. Channel is single-source for now (ManyChat auto-DM); historical 200+ subscribers were backfilled manually since they all came from this same channel before UTM tracking was wired up.
