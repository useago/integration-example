import {
  AgoClient,
  createStore,
  createFormCollector,
  createMessageStream,
} from "@useago/sdk";
import { initDevPanel } from "@useago/sdk/devtools";
import { creditFormSchema } from "./credit/schema.js";
import { renderMarkdown } from "./services/markdown.js";

// Don't activate in production
const DEV = true;
const agentId = "credit2";

// ─── Configuration ────────────────────────────────────────────────
const client = new AgoClient({
  baseUrl: window.AGO_BASE_URL ?? "https://weendeal.api.useago.com",
  widgetId:
    window.AGO_WIDGET_ID ??
    "ago_widget__U_0uoreN3HwElvncdL8v2fPLdsD9xAZbc1KIFOry2E",
  defaultAgentId: agentId,
  debug: DEV,
});

// Persisted session: the thread id + the fields gathered so far, so a reload
// restores both. (The collector's own store is in-memory, so we mirror its
// values here for persistence.)
const session = createStore(
  { conversationId: null, values: {} },
  { key: agentId },
);

// One call wires the whole conversational form: a store, an `update_credit`
// function the agent calls to fill fields, and a dynamic context that tells it
// which fields are still missing. Replaces the hand-rolled updateRequest
// function, the summarize() context, and the manual register/addDynamicContext.
const creditForm = createFormCollector({
  name: "credit",
  description:
    "Demande de rachat / regroupement de crédits. Renseigne les champs au fur et à mesure ; ne redemande pas un champ déjà rempli.",
  schema: creditFormSchema,
  initialValues: session.get().values,
});
creditForm.install(client);

// Mirror collected fields into the persisted session so they survive reloads.
creditForm.store.subscribe((s) =>
  session.set({ ...session.get(), values: s.values }),
);

if (DEV) initDevPanel({ store: creditForm.store, client });

// ─── UI ────────────────────────────────────────────────────────────
const log = document.getElementById("log");
const input = document.getElementById("input");
const form = document.getElementById("composer");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");
const newChatBtn = document.getElementById("new-chat");

function setStatus(text, live) {
  statusEl.textContent = text;
  statusEl.classList.toggle("live", live);
}

function addMessage(role, text = "") {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  wrap.innerHTML = `<div class="who">${role === "user" ? "Vous" : "AGO"}</div>
                    <div class="bubble"></div>`;
  wrap.querySelector(".bubble").textContent = text;
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
  return wrap;
}

// Render the agent's cited sources under an assistant bubble.
function renderSources(wrap, sources) {
  if (!sources?.length) return;
  const s = document.createElement("div");
  s.className = "sources";
  s.innerHTML =
    "Sources : " +
    sources
      .map((src) =>
        src.url
          ? `<a href="${src.url}" target="_blank">${src.title}</a>`
          : src.title,
      )
      .join(" · ");
  wrap.appendChild(s);
}

// Render follow-up reply pills under an assistant bubble; clicking one sends it.
function renderSuggestions(wrap, replies) {
  if (!replies?.length) return;
  const box = document.createElement("div");
  box.className = "suggested-replies";
  for (const text of replies) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reply-btn";
    btn.textContent = text;
    btn.addEventListener("click", () => sendMessage(text));
    box.appendChild(btn);
  }
  wrap.appendChild(box);
}

// Suggestions only belong under the latest assistant message.
function clearSuggestions() {
  log.querySelectorAll(".suggested-replies").forEach((el) => el.remove());
}

// One conversation turn. createMessageStream wraps the SDK's message:* events
// (start → chunks → complete | error) in a single async iterator, so a whole
// turn reads top-to-bottom here instead of being split across separate event
// handlers keyed by messageId — the bubble and its accumulated text are just
// locals. Registered client functions still run automatically mid-turn.
async function sendMessage(content) {
  const trimmed = content.trim();
  if (!trimmed) return;
  clearSuggestions();
  addMessage("user", trimmed);
  input.value = "";
  sendBtn.disabled = true;

  let wrap = null; // this turn's assistant bubble
  let raw = ""; // accumulated raw markdown
  let handled = false; // saw a complete or error event

  try {
    const stream = createMessageStream(client, trimmed, {
      // null (no conversation yet) → undefined so it's omitted from the request body.
      conversationId: session.get().conversationId ?? undefined,
    });
    for await (const event of stream) {
      if (event.type === "start") {
        wrap = addMessage("assistant");
        wrap.classList.add("streaming");
        setStatus("écrit…", true);
      } else if (event.type === "chunk") {
        raw += event.data.content;
        wrap.querySelector(".bubble").innerHTML = renderMarkdown(raw);
        log.scrollTop = log.scrollHeight;
      } else if (event.type === "complete") {
        const msg = event.data;
        // Persist the conversation id so the thread survives reloads.
        session.set({ ...session.get(), conversationId: msg.conversationId });
        wrap.classList.remove("streaming");
        wrap.querySelector(".bubble").innerHTML = renderMarkdown(msg.content);
        renderSources(wrap, msg.sources);
        renderSuggestions(wrap, msg.followUpReplies);
        handled = true;
      } else if (event.type === "error") {
        addMessage("assistant", "⚠️ " + event.data.error);
        handled = true;
      }
    }
    // The stream swallows a pre-stream sendMessage rejection (network, etc.),
    // ending without any event — surface a generic failure in that case.
    if (!handled) addMessage("assistant", "⚠️ La requête a échoué.");
  } catch (err) {
    addMessage("assistant", "⚠️ " + (err?.message ?? err));
  } finally {
    setStatus("prêt", false);
    sendBtn.disabled = false;
  }
}

// ─── Sending ────────────────────────────────────────────────────────
form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(input.value);
});

// Enter = send, Shift+Enter = new line
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// ─── New conversation reset ─────────────────────────────────────────
newChatBtn?.addEventListener("click", () => {
  // Clear the collected fields and the conversationId; both stores re-persist.
  creditForm.reset();
  session.set({ conversationId: null, values: {} });
  log.innerHTML = "";
  setStatus("prêt", false);
  input.focus();
});

// ─── Restore the previous conversation on load ──────────────────────
async function restoreConversation() {
  const conversationId = session.get().conversationId;
  if (!conversationId) return;
  try {
    const conv = await client.getConversation(conversationId);
    const messages = conv?.messages ?? [];
    messages.forEach((m, i) => {
      const wrap = addMessage(m.role === "user" ? "user" : "assistant");
      const bubble = wrap.querySelector(".bubble");
      // User text is plain; assistant replies are markdown (matches live rendering).
      if (m.role === "user") bubble.textContent = m.content;
      else bubble.innerHTML = renderMarkdown(m.content ?? "");
      // Keep suggestions only under the final assistant message (best-effort: history may omit them).
      if (m.role === "assistant" && i === messages.length - 1) {
        renderSuggestions(wrap, m.followUpReplies);
      }
    });
    log.scrollTop = log.scrollHeight;
  } catch {
    // Conversation expired/deleted or network error — start fresh.
    session.set({ conversationId: null, values: {} });
  }
}

restoreConversation();
