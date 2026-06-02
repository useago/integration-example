// Client-side functions the agent calls to build the credit-regroupement JSON object.
import { defineFunction } from "@useago/sdk";
import { buildProperties, pick, summarize } from "./helpers.js";
import { CREDIT_SCHEMA } from "./schema.js";

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

  return { updateRequest };
}
