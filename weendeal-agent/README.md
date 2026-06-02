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
`http://192.168.x.x:5173`) you can open on any device on the same Wi-Fi.

## Dev mode

The **DEV TOOLS** panel is **off by default**. Turn it on by adding `?dev` to the URL (e.g.
`http://localhost:5173/?dev`), or by setting `window.AGO_DEV = true`
