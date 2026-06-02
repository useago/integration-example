import { CREDIT_SCHEMA } from "./schema.js";

// Initial blank state, derived from the schema: free-text strings -> "", enums/numbers -> null.
const INITIAL_REQUEST = Object.fromEntries(
  CREDIT_SCHEMA.fields.map((f) => [
    f.key,
    f.type === "string" && !f.enum ? "" : null,
  ]),
);

// A fresh blank request — own copy, safe to mutate.
export function blankRequest() {
  return structuredClone(INITIAL_REQUEST);
}

// Blank request with any previously-saved values merged in — known keys only, so a
// changed schema can't reintroduce fields that were since removed.
export function hydrateRequest(savedRequest) {
  const request = blankRequest();
  if (!savedRequest) return request;
  for (const k of Object.keys(request)) {
    if (k in savedRequest) request[k] = savedRequest[k];
  }
  return request;
}

// Human label for a value (uses a field's enum labels when present, e.g. "proprietaire" -> "Propriétaire").
function labelFor(key, value) {
  if (value == null || value === "") return null;
  const field = CREDIT_SCHEMA.fields.find((f) => f.key === key);
  const option = field?.enum?.find((o) => o.value === value);
  return option ? option.label : value;
}

// User-facing view of the state: enum values mapped to their labels, other fields as-is, returned to the agent.
export function summarize(state) {
  const out = {};
  for (const f of CREDIT_SCHEMA.fields) {
    const value = state[f.key];
    out[f.key] = value === "" ? null : f.enum ? labelFor(f.key, value) : value;
  }
  return out;
}

// JSON-Schema `properties` derived from the field list (every field optional).
export function buildProperties() {
  const properties = {};
  for (const f of CREDIT_SCHEMA.fields) {
    const prop = { type: f.type };
    if (f.description) prop.description = f.description;
    if (f.enum) prop.enum = f.enum.map((o) => o.value);
    properties[f.key] = prop;
  }
  return properties;
}

// Shallow object subset for the given keys.
export function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}
