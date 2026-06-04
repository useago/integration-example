import { CREDIT_SCHEMA } from "./schema.js";

export function blankRequest() {
  return {
    conversationId: null,
    ...Object.fromEntries(
      CREDIT_SCHEMA.fields.map((f) => [
        f.key,
        f.type === "string" && !f.enum ? "" : null,
      ]),
    ),
  };
}

function labelFor(key, value) {
  if (value == null || value === "") return null;
  const field = CREDIT_SCHEMA.fields.find((f) => f.key === key);
  const option = field?.enum?.find((o) => o.value === value);
  return option ? option.label : value;
}

export function summarize(state) {
  const out = {};
  for (const f of CREDIT_SCHEMA.fields) {
    const value = state[f.key];
    out[f.key] = value === "" ? null : f.enum ? labelFor(f.key, value) : value;
  }
  return out;
}
