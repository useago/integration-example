import { CREDIT_SCHEMA } from "./schema.js";

// Initial blank state, derived from the schema: free-text strings -> "", enums/numbers -> null.
export const INITIAL_REQUEST = Object.fromEntries(
  CREDIT_SCHEMA.fields.map((f) => [
    f.key,
    f.type === "string" && !f.enum ? "" : null,
  ]),
);

// Human label for a value (uses a field's enum labels when present, e.g. "proprietaire" -> "Propriétaire").
export function labelFor(key, value) {
  if (value == null || value === "") return null;
  const field = CREDIT_SCHEMA.fields.find((f) => f.key === key);
  const option = field?.enum?.find((o) => o.value === value);
  return option ? option.label : value;
}
