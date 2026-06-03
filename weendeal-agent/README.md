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

## Conversation starters

The empty chat shows a welcome screen with conversation-starter buttons. Clicking
one opens the conversation with a matching first message — handy to reduce the
blank-page effect.

They are defined in [src/main.js](src/main.js) as the `STARTERS` array. Each entry
has:

| Field              | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `label`            | Button text shown to the user.                                           |
| `prompt`           | Initial message sent to the agent when the button is clicked.            |
| `additionalPrompt` | Optional. Pinned as conversation context (`setContext`) to steer the thread. |

To add or change a starter, edit that array — no other wiring needed. The buttons
reappear on a fresh load and after **Nouvelle discussion**, and disappear once a
message is sent.


## Dev mode

The **DEV TOOLS** panel is **off by default**. Turn it on by adding `?dev` to the URL (e.g.
`http://localhost:5173/?dev`), or by setting `window.AGO_DEV = true`
