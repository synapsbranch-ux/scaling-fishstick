// amplify/functions/waitlist/resource.ts
import { defineFunction, secret } from "@aws-amplify/backend";

export const waitlist = defineFunction({
  name: "waitlist",
  entry: "./handler.ts",
  runtime: 20,          // Node 20
  memoryMB: 256,
  timeoutSeconds: 20,
  environment: {
    // Garder uniquement les secrets ici
    RESEND_API_KEY: secret("RESEND_API_KEY"),
    HASH_SALT: secret("HASH_SALT"),
  },
});
