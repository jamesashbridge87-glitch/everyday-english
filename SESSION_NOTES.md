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

### A. Confirm full UTM end-to-end flow
Visit a UTM URL in Incognito, submit a test email, and verify:
```
https://guide.youraussieuncle.com.au/?utm_source=test&utm_medium=manual&utm_campaign=verify
```
Then check:
1. **Pixel Helper** shows `Lead` event params include `utm_source: test`, `utm_medium: manual`, `utm_campaign: verify`
2. **GA4 Realtime** shows `generate_lead` (this is also the still-outstanding GA4 generate_lead verification from last session — kill two birds)
3. **ConvertKit** subscriber record shows `utm_source`, `utm_medium`, `utm_campaign`, `referrer` populated

If GA4 `generate_lead` still doesn't appear in Realtime: F12 → Network → filter `collect` → look for second POST with `en=generate_lead` in payload after submit. If POST appears but Realtime doesn't show, it's GA4 dashboard lag (can take a few minutes for new event names). If POST never appears, check Console for errors.

### B. Remaining post-launch tasks (priority order)
1. **GA4 Key Event** — Admin → Events → toggle `generate_lead` as Key Event so it shows in conversion reports.
2. **Meta Custom Audiences** — build retargeting audiences now so they populate:
   - Audience 1: fired `Lead` (warm list for upsell)
   - Audience 2: page viewers who didn't fire `Lead` (drop-off retargeting)
   - Optional: audience segmented by `utm_campaign` for campaign-level retargeting
3. **Revisit `value: 5.00` AUD placeholder** — update once real CPL or LTV is known; Meta optimization improves with realistic values.
4. **Cookie consent banner** — only required if EU/UK traffic. Skip if AU-only.
5. **Copy update** — `urgency-banner` says "March 2026"; today is May 2026. Refresh.

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
