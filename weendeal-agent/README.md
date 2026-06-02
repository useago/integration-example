# Weendeal AGO chat (plain JS, no build)

A minimal custom chat UI for the Weendeal AGO agent, built on the AGO SDK
(`@useago/sdk`).

## Run

We use **browser-sync** — live reload on save, and a LAN URL for testing on your phone.
No project install needed (`npx` fetches it on first run):

```bash
npx browser-sync start --server --files "*.html, **/*.js, **/*.css" --port 5173
```

It opens `http://localhost:5173` and also prints an **External** URL (e.g.
`http://192.168.x.x:5173`) you can open on any device on the same Wi-Fi. Saving
`index.html`, `src/main.js`, or `style.css` reloads every connected browser.

## What's inside

- `index.html` — markup and the importmap that resolves `@useago/sdk` from the CDN.
- `style.css` — terracotta theme.
- `src/` — all application code:
  - `src/main.js` — SDK init, page context, streaming, message rendering, and the function wiring (module entry).
  - `src/credit/` — the loan-consolidation feature:
    - `src/credit/schema.js` — the field contract for the JSON object the agent builds (the single source of truth).
    - `src/credit/model.js` — the request model: initial blank state + enum-label lookup, derived from the schema.
    - `src/credit/estimate.js` — indicative monthly-payment / debt-ratio calc for the client summary
    - `src/credit/agentFunctions.js` — the `updateRequest` / `submitRequest` functions the agent calls, generic over the schema.
  - `src/services/` — feature-agnostic infrastructure:
    - `src/services/sessionStore.js` — persists the conversation id **and** the in-progress request object to `localStorage` (restored on reload, cleared together via `clearSession()`).
    - `src/services/markdown.js` — renders assistant replies from markdown to safe HTML.
    - `src/services/devPanel.js` — the DEV TOOLS inspector (live JSON object + function-call log); injects its own styles at runtime, so it needs no separate stylesheet.

## Configuration

The agent connection lives at the top of `src/main.js`:

- `baseUrl` — the AGO API host (`https://weendeal.api.useago.com`).
- `widgetId` — the widget this UI talks to.
- `defaultAgentId` — optional, targets a specific agent (`credit` here).
- `debug` — SDK debug logging; tracks **Dev mode** (see below).

`baseUrl` and `widgetId` default to the values above, but you can override them without editing
source by setting `window.AGO_BASE_URL` / `window.AGO_WIDGET_ID` before `src/main.js` loads.

## Client-side functions (building a JSON object)

While the user chats, **the agent incrementally builds a JSON object** by
calling functions we registered.

- **`updateRequest(patch)`** — one generic updater. All fields are optional; the agent fills
  everything it can infer from a message in a single call (e.g. "propriétaire, 3000 €/mois, 2
  crédits pour 25000 €" → one call setting four fields). The handler merges only known keys into
  the state object.
- **`submitRequest()`** — explicit send; requires an email or phone, returns a `WD-…` reference.

The whole shape is **schema-driven**: `src/credit/schema.js` is the single source of truth, and the
initial state, the function parameter schemas, the labels, and the dynamic context are all
derived from it.

> Important: the schema must cover **every** field the agent asks about. The `credit` agent runs
> its own scripted question flow (housing status → estimation → regroupement type → co-borrower →
> family situation → income/charges → existing credits → treasury/duration → contact). If the user
> answers a question that has no matching field in `src/credit/schema.js`, the agent calls
> `updateRequest` with an **empty object**.

## Dev mode

The **DEV TOOLS** panel is **off by default**. Turn it on by adding `?dev` to the URL (e.g.
`http://localhost:5173/?dev`), or by setting `window.AGO_DEV = true` before `src/main.js` loads.
The same flag also drives the SDK client's `debug` logging.

When on, the panel (top-right) shows the live JSON object as the agent builds it, the computed
monthly payment / debt ratio, and a log of every `updateRequest` / `submitRequest` call.
