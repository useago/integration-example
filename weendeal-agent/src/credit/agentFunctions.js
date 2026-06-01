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
function summarize(state) {
  const out = {};
  for (const f of CREDIT_SCHEMA.fields) {
    const value = state[f.key];
    out[f.key] = value === "" ? null : f.enum ? labelFor(f.key, value) : value;
  }
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
      for (const [key, value] of Object.entries(args ?? {})) {
        const field = fieldsByKey.get(key);
        if (!field || value === undefined) continue; // ignore unknown / absent keys
        if (field.enum && !field.enum.some((o) => o.value === value)) {
          return { ok: false, error: `Valeur invalide pour ${key} : ${value}` };
        }
        next[key] = value;
      }
      store.set(next);
      return { ok: true, ...summarize(next) };
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
      return { ok: true, reference, ...summarize(state) };
    },
  });

  return { updateRequest, submitRequest };
}
