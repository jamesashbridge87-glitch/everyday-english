# Session Notes — 2026-05-02

Handoff document. Resume from the **Pending** section below.

---

## Done & shipped to production

Merged via PR #1 (`claude/general-session-OYW9L` → `main`, squash). Vercel auto-deployed; production verified serving new code.

### 1. Hero spacing
- `style.css`: logo `200px → 120px`, avatar `120px → 80px`
- Tightened brand padding, headline/subheadline margins, social-proof banner padding
- Changed `.landing-content` from `justify-content: center` to `flex-start` so the hero hugs the top
- Goal: email capture card lands above the fold

### 2. Meta Pixel — `1414360586898639`
- Base snippet + `<noscript>` fallback in `<head>` of `index.html`
- `PageView` fires on page load
- `Lead` fires **only** inside the `response.ok && data.success` branch with:
  ```js
  { currency: 'AUD', value: 5.00, content_name: 'Small Talk Survival Guide', content_category: 'Lead Generation' }
  ```
- Guarded with `typeof fbq === 'function'` so blockers can't break form submission
- **Verified live**: Pixel Helper shows `Lead` with currency/value ✅

### 3. GA4 — `G-JPPBPVVNYN`
- gtag.js snippet in `<head>`
- `page_view` fires automatically on load (verified via Realtime — page title "Aussie Small Talk Survival Guide" showing)
- `generate_lead` fires in the success branch with `currency: AUD, value: 5.00, content_name`
- Guarded with `typeof gtag === 'function'`

### 4. Microsoft Clarity — `w44i7isac0`
- Standard async snippet in `<head>`
- **Verified live**: Live view showed test session ✅

### 5. Production verification
```bash
curl -s "https://guide.youraussieuncle.com.au/?cb=$(date +%s)" \
  | grep -E "fbq\('init'|gtag\('config'|clarity\.ms"
```
Returned all three IDs — confirms Vercel is tracking `main` and the deploy shipped. (No "gotcha #1" issue.)

---

## Pending — pick up here next session

### A. Confirm `generate_lead` reaches GA4
`page_view` is confirmed working in Realtime. `generate_lead` not yet confirmed. To diagnose:
1. Open guide.youraussieuncle.com.au in a clean Incognito tab
2. F12 → Network tab → filter `collect`
3. Submit the form with a test email
4. Look for a **second** POST to `google-analytics.com/g/collect` with `en=generate_lead` in the payload
5. If POST appears but Realtime doesn't show → GA4 dashboard lag (can take a few minutes for first instance of a new event name)
6. If POST never appears → check browser Console for errors; either form submit failed or gtag was undefined at the call site

### B. Walk through remaining post-launch tasks (in priority order)
1. **GA4 Key Event** — Admin → Events → toggle `generate_lead` as Key Event so it shows in conversion reports.
2. **Meta Custom Audiences** — Build retargeting audiences now so they start populating:
   - Audience 1: people who fired `Lead` (warm list for upsell)
   - Audience 2: page viewers who didn't fire `Lead` (drop-off retargeting)
3. **Revisit `value: 5.00` AUD placeholder** — update once you know real CPL or LTV; Meta optimization improves with realistic values.
4. **Cookie consent banner** — only required if EU/UK traffic. Skip if AU-only.
5. **Copy update** — `urgency-banner` says "March 2026"; today is May 2026. Refresh the date.

### C. Wait for Meta diagnostic to clear
Per the brief, Events Manager warning ("currency/value missing") takes ~24h to clear after first clean events. Don't act on this — just check back tomorrow.

---

## Reference

- **Repo**: `jamesashbridge87-glitch/everyday-english`
- **Production**: https://guide.youraussieuncle.com.au
- **PR shipped**: https://github.com/jamesashbridge87-glitch/everyday-english/pull/1
- **Working branch this session**: `claude/general-session-OYW9L` (merged, can be deleted or reused)
- **Form architecture**: custom `<form>` in `index.html` POSTs to `/api/subscribe` (Vercel function in `api/subscribe.js` calling ConvertKit v3 API). Form ID `9135329`. **Not** a Kit-hosted embed — that means the success branch is in inline JS in `index.html`, which is where all conversion events fire.

### IDs in one place
| Tool | ID |
|---|---|
| Meta Pixel | `1414360586898639` |
| GA4 | `G-JPPBPVVNYN` |
| Clarity | `w44i7isac0` |
| ConvertKit form | `9135329` |
