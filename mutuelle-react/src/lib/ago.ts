import { AgoClient } from "@useago/sdk";

export const agoClient = new AgoClient({
  baseUrl: import.meta.env.VITE_AGO_BASE_URL ?? "https://weendeal.api.useago.com/",
  defaultAgentId: "mutuelle",
});
