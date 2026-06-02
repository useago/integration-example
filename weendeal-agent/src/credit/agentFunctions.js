// Client-side functions the agent calls to build the credit-regroupement JSON object.
import { defineFunction } from "@useago/sdk";
import { labelFor } from "./model.js";
import { CREDIT_SCHEMA } from "./schema.js";

// JSON-Schema `properties` derived from the field list (every field optional).
function buildProperties() {
  const properties = {};
  for (const f of CREDIT_SCHEMA.fields) {
    const prop = { type: f.type };
    if (f.description) prop.description = f.description;
    if (f.enum) prop.enum = f.enum.map((o) => o.value);
    properties[f.key] = prop;
  }
  return properties;
}

// User-facing view of the state: labelled enums + computed figures, returned to the agent.
export function summarize(state) {
  const out = {};
  for (const f of CREDIT_SCHEMA.fields) {
    const value = state[f.key];
    out[f.key] = value === "" ? null : f.enum ? labelFor(f.key, value) : value;
  }
  return out;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}

export function buildCreditFunctions(store) {
  const fieldsByKey = new Map(CREDIT_SCHEMA.fields.map((f) => [f.key, f]));

  const updateRequest = defineFunction({
    name: "updateRequest",
    description: CREDIT_SCHEMA.updateRequestDescription,
    parameters: { type: "object", properties: buildProperties() },
    handler: async (args) => {
      const next = { ...store.get() };
      const applied = [];
      const rejected = [];
      for (const [key, value] of Object.entries(args ?? {})) {
        const field = fieldsByKey.get(key);
        if (!field || value === undefined) continue;
        if (field.enum && !field.enum.some((o) => o.value === value)) {
          rejected.push(`${key}=${value}`); // skip this one, keep the rest of the call
          continue;
        }
        next[key] = value;
        applied.push(key);
      }
      // SCHEMA DRIFT GUARD — the `credit` agent's question flow is defined SERVER-SIDE and
      // CREDIT_SCHEMA (schema.js) must mirror it field-for-field. When the agent asks about a
      // field that has no match here, it calls updateRequest with nothing usable.
      if (applied.length === 0 && rejected.length === 0) {
        console.warn(
          "[schema drift] updateRequest received no known field — check CREDIT_SCHEMA against the credit agent flow:",
          args,
        );
      }
      store.set(next);
      // Confirm only what changed — the dynamic context already carries the full state.
      const result = { ok: true, updated: pick(summarize(next), applied) };
      if (rejected.length) result.rejected = rejected;
      return result;
    },
  });

  const submitRequest = defineFunction({
    name: "submitRequest",
    description: CREDIT_SCHEMA.submitRequestDescription,
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const state = store.get();
      if (!state.email && !state.telephone) {
        return {
          ok: false,
          error: "Email ou téléphone requis pour envoyer la demande.",
        };
      }
      const { reference } = store.submit(state);
      return { ok: true, reference };
    },
  });

  return { updateRequest, submitRequest };
}
