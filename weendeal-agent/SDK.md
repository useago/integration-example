# AGO SDK usage (plain JS)

Reference for `@useago/sdk` as used from a plain-JavaScript environment.

**Setup**

- [Loading the SDK](#loading-the-sdk)
- [Initialization](#initialization)

**Key features**

- [Sending messages](#sending-messages)
- [Streaming events](#streaming-events)
- [Client functions](#client-functions)
- [Context](#context)
- [Conversation history](#conversation-history)

**Also available in the SDK**

- [Conversation list & feedback](#conversation-list--feedback)
- [Interactive tool calls](#interactive-tool-calls)
- [Navigation function](#navigation-function)
- [Zero-config init](#zero-config-init)
- [Streaming helpers](#streaming-helpers)
- [Pre-built client functions](#pre-built-client-functions)

**Reference**

- [`AgoClient` method reference](#agoclient-method-reference)
- [Type reference](#type-reference)
- [Module exports](#module-exports)

---

# Setup

## Loading the SDK

Without a bundler, resolve the SDK from a CDN through an import map:

```html
<script type="importmap">
  { "imports": { "@useago/sdk": "https://esm.sh/@useago/sdk@0.1.7" } }
</script>
```

In a bundled project (Vite, webpack, …) install it via npm instead:

```bash
npm install @useago/sdk
```

## Initialization

Create one `AgoClient` and reuse it for the lifetime of the page. The constructor
takes an `AgoConfig`:

```js
import { AgoClient } from "@useago/sdk";

const client = new AgoClient({
  baseUrl: "https://weendeal.api.useago.com",
  defaultAgentId: "credit",
  debug: DEV,
});
```

### `AgoConfig`

| Option     | Type      | Required | Purpose                                                                             |
| ---------- | --------- | -------- | ----------------------------------------------------------------------------------- |
| `baseUrl`  | `string`  | yes      | AGO API host the widget talks to.                                                   |
| `widgetId` | `string`  | no       | Identifies the widget; sent as the `X-Widget-Id` header. Auto-generated if omitted. |
| `agent`    | `string`  | no       | Default agent (id or slug) for new conversations. Preferred over `defaultAgentId`.  |
| `debug`    | `boolean` | no       | Enables SDK console logging.                                                        |

Config can be changed after construction with `client.updateConfig(partial)`. To skip
hand-writing this object entirely, see [Zero-config init](#zero-config-init).

---

# Key features

These are the SDK features this project actually wires up.

## Sending messages

```js
await client.sendMessage(content, { conversationId });
```

`sendMessage(content, options?)` returns a `Promise<AgoMessage>` that resolves with
the final message once the stream completes — but you typically render from the
[streaming events](#streaming-events) rather than awaiting the return value. Pass an
existing `conversationId` to continue a thread; omit it on the first turn and read
the id back off `message:complete`.

> **Example** ([src/main.js](src/main.js)):
>
> ```js
> await client.sendMessage(content, { conversationId });
> ```

### `SendMessageOptions`

| Option           | Type     | Purpose                                                           |
| ---------------- | -------- | ----------------------------------------------------------------- |
| `conversationId` | `string` | Continue an existing thread. Omit to start a new one.             |
| `agentId`        | `string` | Override the configured `agent` / `defaultAgentId` for this send. |
| `files`          | `File[]` | Attachments — switches the request to `multipart/form-data`.      |

Registered [client functions](#client-functions) and [context](#context) are
attached to every send automatically; you don't pass them here.

## Streaming events

The reply streams over Server-Sent Events. Subscribe with `client.on(event, handler)`
(and `off` / `once` / `waitFor`):

| Event               | Payload                                  | Typical handling                                                                |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| `message:start`     | `{ conversationId, messageId }`          | Create an empty assistant bubble, keyed by `messageId`.                         |
| `message:chunk`     | `{ conversationId, messageId, content }` | Append the delta and re-render.                                                 |
| `message:complete`  | the full `AgoMessage`                    | Persist `conversationId`, finalize the bubble, render `sources`.                |
| `message:error`     | `{ error, conversationId?, messageId? }` | Surface the error and re-enable input.                                          |
| `toolCall:received` | `ToolCallData`                           | The agent invoked a server/UI tool — see [tool calls](#interactive-tool-calls). |
| `toolCall:form`     | `ToolCallData` (`type: "form"`)          | The agent wants the user to fill a form.                                        |
| `function:invoke`   | `ClientFunctionInvocation`               | A registered client function is about to run (fired by the SDK).                |
| `function:result`   | `{ invocationId, result, error? }`       | A client function finished; its result was returned to the agent.               |
| `connection:status` | `{ connected }`                          | Connection state changes.                                                       |

> **Example** ([src/main.js](src/main.js)):
>
> ```js
> client.on("message:start", ({ messageId }) => {
>   /* create bubble */
> });
> client.on("message:chunk", ({ messageId, content }) => {
>   /* append delta */
> });
> client.on("message:complete", (msg) => {
>   conversationId = msg.conversationId;
> });
> ```

> `message:chunk` carries only the new delta — accumulate it yourself.
> `message:complete` then delivers the whole, final message (with `sources`), so use
> it to replace, not re-append.

### Subscription methods

| Method                         | Returns            | Notes                                   |
| ------------------------------ | ------------------ | --------------------------------------- |
| `on(event, handler)`           | `void`             | Subscribe.                              |
| `off(event, handler)`          | `void`             | Unsubscribe the same handler reference. |
| `once(event, handler)`         | `void`             | Auto-unsubscribes after the first call. |
| `waitFor(event, { timeout? })` | `Promise<payload>` | Resolves the next time the event fires. |

## Client functions

A client function is browser-side code the **agent** can call mid-turn to read or
mutate page state.

### 1. Define

`defineFunction(definition)`

| Field         | Type                     | Purpose                                                                                                |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `name`        | `string`                 | Unique function name the agent calls.                                                                  |
| `description` | `string`                 | Tells the agent _when_ to call it — this is the prompt the model reads.                                |
| `parameters`  | JSON-Schema object       | `{ type: "object", properties, required? }`. Each property: `{ type, description?, enum?, default? }`. |
| `handler`     | `async (args) => result` | Runs in the browser; the return value is sent back to the agent. Must be JSON-serializable.            |

> **Example** ([src/credit/agentFunctions.js](src/credit/agentFunctions.js), with
> `description` from [src/credit/schema.js](src/credit/schema.js)):
>
> ```js
> const updateRequest = defineFunction({
>   name: "updateRequest",
>   description: CREDIT_SCHEMA.updateRequestDescription,
>   parameters: { type: "object", properties: buildProperties() },
>   handler: async (args) => {
>     /* apply known fields to store */
>   },
> });
> ```

### 2. Register

| Method                                    | Accepts                                     |
| ----------------------------------------- | ------------------------------------------- |
| `register(def \| def[])`                  | One definition or an array (preferred).     |
| `registerFunction(def)`                   | A single definition object.                 |
| `registerFunction(name, handler, schema)` | Classic 3-arg form (`schema` omits `name`). |
| `unregisterFunction(name)`                | Removes one; returns `true` if it existed.  |
| `getRegisteredFunctions()`                | Returns the current array of schemas.       |

```js
// agentFunctions.js — both definitions share one closure over `store`
export function buildCreditFunctions(store) {
  const updateRequest = defineFunction({
    /* … */
  });
  return { updateRequest };
}

// main.js — register every value of that object at once
client.register(Object.values(buildCreditFunctions(store)));
```

### 3. Invocation

When the agent decides to call a function, the SDK handles the whole round trip and
emits two events you can observe:

1. **`function:invoke`** — `{ invocationId, functionName, arguments, conversationId }`.
   The SDK is about to run your handler.
2. The SDK runs `handler(args)` and waits for it (handlers may be `async`).
3. **`function:result`** — `{ invocationId, result, error? }`. The return value (or, if
   the handler threw, its error message) is sent back to the agent, which continues the
   turn with that result.

> Example: full handler in [src/credit/agentFunctions.js](src/credit/agentFunctions.js).

Subscribe to the two events to trace calls live — the dev panel does exactly this,
logging each invocation and its result:

```js
client.on("function:invoke", ({ functionName, arguments: args }) => {
  logLine(`→ ${functionName}(${JSON.stringify(args ?? {})})`);
});
client.on("function:result", ({ result, error }) => {
  logLine(error ? `✗ ${error}` : `← ${JSON.stringify(result)}`);
});
```

> Example: [src/services/devPanel.js](src/services/devPanel.js).

## Context

Context is structured data sent with **every** message.

| Method                             | Kind    | Evaluated              | Use for                                               |
| ---------------------------------- | ------- | ---------------------- | ----------------------------------------------------- |
| `setContext(key, entry)`           | static  | once, until changed    | Values that rarely change.                            |
| `addDynamicContext(key, provider)` | dynamic | on every `sendMessage` | Live state pulled from a store/ref/computed.          |
| `removeContext(key)`               | —       | —                      | Remove a static entry.                                |
| `removeDynamicContext(key)`        | —       | —                      | Remove a dynamic provider.                            |
| `enableAutoPageContext()`          | dynamic | on every `sendMessage` | Auto-attach URL + page title (key `browser-page`).    |
| `getContextSnapshot()`             | —       | now                    | Inspect what would be sent (`{ entries }` or `null`). |

> **Example** ([src/main.js](src/main.js)):
>
> ```js
> client.addDynamicContext("credit-request-state", () => ({
>   name: "Demande de regroupement de crédits en cours",
>   data: summarize(request),
> }));
> ```

## Conversation history

Restore a previous thread by fetching it with its messages:

```js
const conv = await client.getConversation(conversationId);
for (const m of conv?.messages ?? []) {
  /* re-render each m.role / m.content */
}
```

> Example: [src/main.js](src/main.js) (`restoreConversation`) restores the saved
> conversation on reload.

# Also available in the SDK

## Conversation list & feedback

| Method                              | Returns                   | Purpose                                      |
| ----------------------------------- | ------------------------- | -------------------------------------------- |
| `getConversations()`                | `Promise<Conversation[]>` | List threads (id, title, `lastMessageDate`). |
| `getMessages(id)`                   | `Promise<AgoMessage[]>`   | Just the messages of a thread.               |
| `submitFeedback(messageId, rating)` | `Promise<void>`           | `rating` is `"positive"` or `"negative"`.    |

A thread switcher would list `getConversations()` and load the chosen one via
[`getConversation(id)`](#conversation-history); thumbs-up/down on a message calls
`submitFeedback`.

## Interactive tool calls

When the agent uses a server-side tool that needs the user — a form to fill or an
action to confirm — it arrives as a `toolCall:received` (and `toolCall:form` for
forms) event carrying `ToolCallData`. Respond with one of:

| Method                             | Purpose                         |
| ---------------------------------- | ------------------------------- |
| `submitToolCallForm(id, formData)` | Send filled form data back.     |
| `confirmToolCall(id)`              | Approve a confirmation request. |
| `rejectToolCall(id)`               | Decline it.                     |

The agent's [client functions](#client-functions) run on the same underlying
mechanism, so this project already exercises that path indirectly.

## Navigation function

`registerNavigationFunction(navigate, routes)` registers a ready-made `navigateToPage`
function so the agent can route the user. Each route is `{ name, path, description }`;
`navigate(path)` is your router's navigate callback.

## Zero-config init

`createAgo()` builds a ready `AgoClient` without a hand-written config, auto-detecting
`baseUrl`/`widgetId` from `window.AGO`, `<meta>` tags, or `data-ago-*` attributes
(checked in that order of priority). `autoDetectConfig()` returns just the detected
config object.

## Streaming helpers

Function wrappers around `client.on(...)` for callers who prefer callbacks or an async
generator over manual subscriptions:

| Helper                                                                                              | What it does                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `onMessage`, `onMessageChunk`, `onMessageStart`, `onMessageError`, `onToolCall`, `onFunctionInvoke` | Subscribe via callback; each returns an unsubscribe fn. |
| `createMessageStream(client, content, options?)`                                                    | Send a message and `for await` over its events.         |

## Pre-built client functions

Ready-made [client functions](#client-functions) for common browser actions, importable
and registered directly: `showToast`, `showNotification`, `openUrl`, `copyToClipboard`,
`setTheme`, `showConfirmDialog`, `getUserLocation`, `scrollToElement`, `setLocalStorage`,
`getLocalStorage`, `highlightElement`, `submitForm`, `trackEvent`. Attach a handler to a
bare schema with `withHandler`.

---

# Reference

## `AgoClient` method reference

| Method                                                                        | Returns                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------- |
| `sendMessage(content, options?)`                                              | `Promise<AgoMessage>`                             |
| `getConversations()`                                                          | `Promise<Conversation[]>`                         |
| `getConversation(id)` / `getMessages(id)`                                     | `Promise<Conversation>` / `Promise<AgoMessage[]>` |
| `submitFeedback(messageId, rating)`                                           | `Promise<void>`                                   |
| `register(def \| def[])`                                                      | `void`                                            |
| `registerFunction(def)` / `(name, handler, schema)`                           | `void`                                            |
| `unregisterFunction(name)`                                                    | `boolean`                                         |
| `getRegisteredFunctions()`                                                    | `ClientFunctionSchema[]`                          |
| `registerNavigationFunction(navigate, routes)`                                | `void`                                            |
| `setContext(key, entry)` / `removeContext(key)`                               | `void` / `boolean`                                |
| `addDynamicContext(key, provider)` / `removeDynamicContext(key)`              | `void` / `boolean`                                |
| `enableAutoPageContext()`                                                     | `void`                                            |
| `getContextSnapshot()`                                                        | `ContextSnapshot \| null`                         |
| `submitToolCallForm(id, data)` / `confirmToolCall(id)` / `rejectToolCall(id)` | `Promise<void>`                                   |
| `on/off/once(event, handler)`                                                 | `void`                                            |
| `waitFor(event, { timeout? })`                                                | `Promise<payload>`                                |
| `updateConfig(partial)`                                                       | `void`                                            |
| `destroy()`                                                                   | `void` — drops listeners, functions, and context. |

## Type reference

```ts
interface AgoMessage {
  id: string;
  conversationId: string;
  content: string;
  role: "user" | "assistant";
  status: "IN_PROGRESS" | "DONE" | "ERROR" | "TODO" | "CANCELED";
  agent?: { id: string; name: string; displayName?: string };
  sources?: { id: string; title: string; url?: string }[];
  toolCalls?: ToolCallData[];
  followUpReplies?: string[];
  createdAt: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageDate: Date;
  messages?: AgoMessage[];
}

interface ContextEntry {
  name?: string;
  description?: string;
  data?: Record<string, unknown>;
}
```

## Module exports

All importable from `@useago/sdk`:

| Export                                                                                              | What it is                                                                 |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `AgoClient`                                                                                         | The main client class.                                                     |
| `defineFunction`                                                                                    | Typed function-definition helper.                                          |
| `createAgo`, `autoDetectConfig`                                                                     | Zero-config init from `window.AGO` / meta / `data-ago-*`.                  |
| `onMessage`, `onMessageChunk`, `onMessageStart`, `onMessageError`, `onToolCall`, `onFunctionInvoke` | Callback wrappers around `client.on(...)`; each returns an unsubscribe fn. |
| `createMessageStream(client, content, options?)`                                                    | Sends a message and yields events as an async generator (`for await`).     |
| `SSEHandler`, `isStreamNetworkError`                                                                | Low-level SSE plumbing.                                                    |
| pre-built functions (`showToast`, `openUrl`, …) + `withHandler`                                     | See [Pre-built client functions](#pre-built-client-functions).             |
| `createMockClient`                                                                                  | In-memory client for tests (`@useago/sdk/testing`).                        |
| `AgoError`, `AgoApiError`, `AgoNetworkError`, `AgoStreamError`, `AgoFunctionError`                  | Error subclasses the SDK throws — catch to distinguish failure kinds.      |
| `FunctionRegistry`, `ClientContextRegistry`, `EventEmitter`, `logger`                               | Internals for advanced usage.                                              |

Type-only exports include `AgoConfig`, `SendMessageOptions`, `AgoMessage`,
`Conversation`, `AgoSource`, `ToolCallData`, `ToolCallType`, `FormSchema`,
`ClientFunctionDefinition`, `ClientFunctionSchema`, `AgoClientEvents`, and more.

See the [public SDK docs](https://ago.mintlify.app/features/sdk-integration) for the
hosted reference and framework wrappers (React, Vue, Angular).
