import { defineFunction } from "@useago/sdk";
import { summarize } from "./helpers.js";
import { CREDIT_SCHEMA } from "./schema.js";

export function buildCreditFunctions(store) {
  const knownKeys = new Set(CREDIT_SCHEMA.fields.map((f) => f.key));

  const updateRequest = defineFunction({
    name: "updateRequest",
    description: CREDIT_SCHEMA.updateRequestDescription,
    parameters: {
      type: "object",
      properties: {
        patch: {
          type: "object",
          description:
            "Champs renseignés → valeurs (codes), tels que définis dans tes instructions.",
        },
      },
    },
    handler: async (args = {}) => {
      const patch = args.patch ?? {};

      const unknown = Object.keys(patch).filter((k) => !knownKeys.has(k));
      if (unknown.length) {
        console.warn(
          "[schema drift] updateRequest received unknown field(s) — check schema.js against the credit agent prompt:",
          unknown,
        );
      }
      store.set({ ...store.get(), ...patch });
      // Confirm only what changed — the dynamic context already carries the full state.
      const summary = summarize(store.get());
      const updated = {};
      for (const k of Object.keys(patch)) {
        if (knownKeys.has(k)) updated[k] = summary[k];
      }
      return { ok: true, updated };
    },
  });

  return { updateRequest };
}
