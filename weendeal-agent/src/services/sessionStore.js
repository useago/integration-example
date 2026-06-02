// Persists the chat session across reloads: the conversation id and the in-progress
// request object. Both live in localStorage and are cleared together via clearSession().
// The messages themselves are rehydrated from the backend via client.getConversation(id).
const CONVERSATION_KEY = "weendeal_conversation_id";
const REQUEST_KEY = "weendeal_request_state";

export function loadConversationId() {
  try {
    return localStorage.getItem(CONVERSATION_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function saveConversationId(id) {
  try {
    if (id) localStorage.setItem(CONVERSATION_KEY, id);
    else localStorage.removeItem(CONVERSATION_KEY);
  } catch {
    /* storage disabled — nothing to persist, ignore */
  }
}

export function loadRequest() {
  try {
    const raw = localStorage.getItem(REQUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // disabled storage or malformed JSON — treat as no saved state
  }
}

export function saveRequest(request) {
  try {
    localStorage.setItem(REQUEST_KEY, JSON.stringify(request));
  } catch {
    /* storage disabled / quota — nothing to persist, ignore */
  }
}

// New conversation or a failed restore: drop both halves of the session together.
export function clearSession() {
  saveConversationId(undefined);
  try {
    localStorage.removeItem(REQUEST_KEY);
  } catch {
    /* ignore */
  }
}
