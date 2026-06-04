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

      // Whitelist: the agent may only write fields defined in the schema.
      // conversationId (app-managed) and any stray/hallucinated keys are dropped,
      // so they can never reach the store or localStorage.
      const safePatch = {};
      const unknown = [];
      for (const [key, value] of Object.entries(patch)) {
        if (knownKeys.has(key)) safePatch[key] = value;
        else unknown.push(key);
      }
      if (unknown.length) {
        console.warn(
          "[schema drift] updateRequest dropped unknown field(s) — check schema.js against the credit agent prompt:",
          unknown,
        );
      }

      store.set({ ...store.get(), ...safePatch });

      // Confirm only what changed — the dynamic context already carries the full state.
      const summary = summarize(store.get());
      const updated = {};
      for (const key of Object.keys(safePatch)) updated[key] = summary[key];
      return { ok: true, updated };
    },
  });

  return { updateRequest };
}
