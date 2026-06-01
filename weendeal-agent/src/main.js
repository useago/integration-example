import { AgoClient } from "@useago/sdk";
import { buildCreditFunctions } from "./credit/agentFunctions.js";
import { INITIAL_REQUEST } from "./credit/model.js";
import { initDevPanel, renderDevPanel } from "./services/devPanel.js";
import { renderMarkdown } from "./services/markdown.js";
import {
  clearSession,
  loadConversationId,
  loadRequest,
  saveConversationId,
  saveRequest,
} from "./services/sessionStore.js";

// ─── Dev flag ─────────────────────────────────────────────────────
// Hardcoded ON for demonstration purposes rendering dev panel
const DEV = true;

// ─── Configuration ────────────────────────────────────────────────
const client = new AgoClient({
  baseUrl: "https://weendeal.api.useago.com",
  widgetId: "ago_widget__U_0uoreN3HwElvncdL8v2fPLdsD9xAZbc1KIFOry2E",
  defaultAgentId: "credit",
  debug: true,
});

let conversationId = loadConversationId(); // keeps the thread across turns and reloads
let request = structuredClone(INITIAL_REQUEST);
// Restore the in-progress request saved with this conversation — known keys only, so a
// changed schema can't reintroduce removed fields. No conversation → drop any orphan.
const savedRequest = conversationId ? loadRequest() : null;
if (savedRequest) {
  for (const k of Object.keys(request)) {
    if (k in savedRequest) request[k] = savedRequest[k];
  }
} else {
  clearSession();
}
const store = {
  get: () => request,
  set: (next) => {
    request = next;
    saveRequest(request);
    if (DEV) renderDevPanel();
  },
  submit: () => ({
    ok: true,
    reference: "WD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  }),
};
client.register(Object.values(buildCreditFunctions(store)));

// ─── Context: what the agent knows about the page ─────────────────
client.enableAutoPageContext();
client.addDynamicContext("credit-request-state", () => ({
  name: "Demande de regroupement de crédits en cours",
  description:
    "État actuel de la demande. Champs vides = null; ne pas redemander ce qui est déjà rempli.",
  data: request,
}));

if (DEV) initDevPanel({ getState: store.get, client });

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
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = input.value.trim();
  if (!content) return;
  addMessage("user", content);
  input.value = "";
  sendBtn.disabled = true;
  try {
    await client.sendMessage(content, { conversationId });
  } catch (err) {
    addMessage("assistant", "⚠️ " + (err?.message ?? err));
    sendBtn.disabled = false;
  }
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
  request = structuredClone(INITIAL_REQUEST);
  if (DEV) renderDevPanel();
  log.innerHTML = "";
  bubbles.clear();
  rawText.clear();
  statusEl.textContent = "prêt";
  statusEl.classList.remove("live");
  input.focus();
});

// ─── Restore the previous conversation on load ──────────────────────
async function restoreConversation() {
  if (!conversationId) return;
  try {
    const conv = await client.getConversation(conversationId);
    for (const m of conv?.messages ?? []) {
      const wrap = addMessage(m.role === "user" ? "user" : "assistant");
      const bubble = wrap.querySelector(".bubble");
      // User text is plain; assistant replies are markdown (matches live rendering).
      if (m.role === "user") bubble.textContent = m.content;
      else bubble.innerHTML = renderMarkdown(m.content ?? "");
    }
    log.scrollTop = log.scrollHeight;
  } catch {
    // Conversation expired/deleted or network error — start fresh.
    conversationId = undefined;
    clearSession();
    request = structuredClone(INITIAL_REQUEST);
    if (DEV) renderDevPanel();
  }
}

restoreConversation();
