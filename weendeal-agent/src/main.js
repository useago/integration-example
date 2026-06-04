import { AgoClient, createStore } from "@useago/sdk";
import { initDevPanel } from "@useago/sdk/devtools";
import { buildCreditFunctions } from "./credit/agentFunctions.js";
import { blankRequest, summarize } from "./credit/helpers.js";
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

const store = createStore(blankRequest(), { key: agentId });

client.register(Object.values(buildCreditFunctions(store)));

client.addDynamicContext("credit-request-state", () => ({
  name: "Demande de regroupement de crédits en cours",
  description:
    "État actuel de la demande. Champs vides = null; ne pas redemander ce qui est déjà rempli.",
  data: summarize(store.get()),
}));

if (DEV) initDevPanel({ store, client });

// ─── UI ────────────────────────────────────────────────────────────
const log = document.getElementById("log");
const input = document.getElementById("input");
const form = document.getElementById("composer");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");
const newChatBtn = document.getElementById("new-chat");

const bubbles = new Map(); // messageId -> .msg element
const rawText = new Map(); // messageId -> accumulated raw markdown

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

async function sendMessage(content) {
  const trimmed = content.trim();
  if (!trimmed) return;
  clearSuggestions();
  addMessage("user", trimmed);
  input.value = "";
  sendBtn.disabled = true;
  try {
    await client.sendMessage(trimmed, {
      // null (no conversation yet) → undefined so it's omitted from the request body.
      conversationId: store.get().conversationId ?? undefined,
    });
  } catch (err) {
    addMessage("assistant", "⚠️ " + (err?.message ?? err));
    sendBtn.disabled = false;
  }
}

// ─── Streaming wiring ──────────────────────────────────────────────
client.on("message:start", ({ messageId }) => {
  const wrap = addMessage("assistant");
  wrap.classList.add("streaming");
  bubbles.set(messageId, wrap);
  statusEl.textContent = "écrit…";
  statusEl.classList.add("live");
});

client.on("message:chunk", ({ messageId, content }) => {
  const wrap = bubbles.get(messageId);
  if (wrap) {
    const raw = (rawText.get(messageId) ?? "") + content;
    rawText.set(messageId, raw);
    wrap.querySelector(".bubble").innerHTML = renderMarkdown(raw);
    log.scrollTop = log.scrollHeight;
  }
});

client.on("message:complete", (msg) => {
  // Persist the conversation id onto the request so the thread survives reloads.
  store.set({ ...store.get(), conversationId: msg.conversationId });
  const wrap = bubbles.get(msg.id);
  if (wrap) {
    wrap.classList.remove("streaming");
    wrap.querySelector(".bubble").innerHTML = renderMarkdown(msg.content);
    bubbles.delete(msg.id);
    rawText.delete(msg.id);
    if (msg.sources?.length) {
      const s = document.createElement("div");
      s.className = "sources";
      s.innerHTML =
        "Sources : " +
        msg.sources
          .map((src) =>
            src.url
              ? `<a href="${src.url}" target="_blank">${src.title}</a>`
              : src.title,
          )
          .join(" · ");
      wrap.appendChild(s);
    }
    renderSuggestions(wrap, msg.followUpReplies);
  }
  statusEl.textContent = "prêt";
  statusEl.classList.remove("live");
  sendBtn.disabled = false;
});

client.on("message:error", ({ error }) => {
  addMessage("assistant", "⚠️ " + error);
  statusEl.textContent = "erreur";
  statusEl.classList.remove("live");
  sendBtn.disabled = false;
});

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
  // Resets both the request fields and conversationId; the store re-persists it.
  store.set(blankRequest());
  log.innerHTML = "";
  bubbles.clear();
  rawText.clear();
  statusEl.textContent = "prêt";
  statusEl.classList.remove("live");
  input.focus();
});

// ─── Restore the previous conversation on load ──────────────────────
async function restoreConversation() {
  const conversationId = store.get().conversationId;
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
    store.clear();
  }
}

restoreConversation();
