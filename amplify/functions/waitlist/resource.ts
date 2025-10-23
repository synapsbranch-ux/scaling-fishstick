// amplify/functions/waitlist/resource.ts
import { defineFunction, secret } from "@aws-amplify/backend"; // <-- bon import

export const waitlist = defineFunction({
  name: "waitlist",
  entry: "./handler.ts",
  runtime: 20,          // Node 20
  memoryMB: 256,
  timeoutSeconds: 20,
  environment: {
    EMAIL_FROM: process.env.EMAIL_FROM,
    WAITLIST_TABLE_NAME: process.env.WAITLIST_TABLE_NAME,
    RESEND_API_KEY: secret("RESEND_API_KEY"),
    HASH_SALT: secret("HASH_SALT"),
  },
});
