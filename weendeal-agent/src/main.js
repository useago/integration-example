import { AgoClient } from "@useago/sdk";
import { buildCreditFunctions } from "./credit/agentFunctions.js";
import { blankRequest, summarize } from "./credit/helpers.js";
import { initDevPanel } from "./services/devPanel.js";
import { renderMarkdown } from "./services/markdown.js";
import {
  clearSession,
  loadConversationId,
  loadRequest,
  saveConversationId,
  saveRequest,
} from "./services/sessionStore.js";

// ─── Dev flag ─────────────────────────────────────────────────────

const DEV = window.AGO_DEV ?? new URLSearchParams(location.search).has("dev");

// ─── Configuration ────────────────────────────────────────────────
const client = new AgoClient({
  baseUrl: window.AGO_BASE_URL ?? "https://weendeal.api.useago.com",
  widgetId:
    window.AGO_WIDGET_ID ??
    "ago_widget__U_0uoreN3HwElvncdL8v2fPLdsD9xAZbc1KIFOry2E",
  defaultAgentId: "credit",
  debug: DEV,
});

let conversationId = loadConversationId(); // keeps the thread across turns and reloads

function createStore(initial) {
  let state = initial;
  const subscribers = new Set();
  return {
    get: () => state,
    set: (next) => {
      state = next;
      saveRequest(state);
      subscribers.forEach((fn) => fn(state));
    },
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

// Restore the in-progress request saved with this conversation.
const store = createStore({
  ...blankRequest(),
  ...(conversationId ? loadRequest() : null),
});
if (!conversationId) clearSession();
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

// Conversation starters shown on the empty chat. Mirrors AGO's starter model:
// `prompt` is the initial message sent, `additionalPrompt` is extra system
// context steering the conversation for that path. Clicking one opens the
// conversation with the matching starter.
const STARTERS = [
  {
    label: "Crédit immobilier",
    prompt: "Je souhaite regrouper un crédit immobilier.",
    additionalPrompt:
      "L'utilisateur démarre depuis le starter « Crédit immobilier » : il veut un regroupement portant sur un crédit immobilier.",
  },
  {
    label: "Crédit immobilier + crédit conso",
    prompt:
      "Je souhaite regrouper un crédit immobilier et des crédits à la consommation.",
    additionalPrompt:
      "L'utilisateur démarre depuis le starter « Crédit immobilier + crédit conso » : il veut un regroupement mêlant un crédit immobilier et des crédits à la consommation.",
  },
  {
    label: "Crédit conso",
    prompt: "Je souhaite regrouper des crédits à la consommation.",
    additionalPrompt:
      "L'utilisateur démarre depuis le starter « Crédit conso » : il veut un regroupement portant uniquement sur des crédits à la consommation.",
  },
];

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

// Welcome screen with conversation-starter buttons, shown while the chat is empty.
function renderStarters() {
  const box = document.createElement("div");
  box.className = "starters";
  box.innerHTML = `<p class="starters-intro">Bonjour&nbsp;! Sur quel type de crédit souhaitez-vous être accompagné&nbsp;?</p>`;
  const list = document.createElement("div");
  list.className = "starters-list";
  for (const starter of STARTERS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "starter-btn";
    btn.textContent = starter.label;
    btn.addEventListener("click", () => startFromStarter(starter));
    list.appendChild(btn);
  }
  box.appendChild(list);
  log.appendChild(box);
}

function clearStarters() {
  log.querySelectorAll(".starters").forEach((el) => el.remove());
}

// Open the conversation from a starter: pin its additional prompt as context
// for the whole thread, then send its initial message.
function startFromStarter(starter) {
  if (starter.additionalPrompt) {
    client.setContext("conversation-starter", {
      name: "Conversation starter sélectionné",
      description: starter.additionalPrompt,
    });
  }
  sendMessage(starter.prompt);
}

async function sendMessage(content) {
  const trimmed = content.trim();
  if (!trimmed) return;
  clearStarters();
  clearSuggestions();
  addMessage("user", trimmed);
  input.value = "";
  sendBtn.disabled = true;
  try {
    await client.sendMessage(trimmed, { conversationId });
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
  conversationId = msg.conversationId;
  saveConversationId(conversationId);
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
  conversationId = undefined;
  clearSession();
  client.removeContext("conversation-starter");
  store.set(blankRequest());
  log.innerHTML = "";
  bubbles.clear();
  rawText.clear();
  statusEl.textContent = "prêt";
  statusEl.classList.remove("live");
  renderStarters();
  input.focus();
});

// ─── Restore the previous conversation on load ──────────────────────
async function restoreConversation() {
  if (!conversationId) {
    renderStarters();
    return;
  }
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
    conversationId = undefined;
    clearSession();
    store.set(blankRequest());
    log.innerHTML = "";
    renderStarters();
  }
}

restoreConversation();
