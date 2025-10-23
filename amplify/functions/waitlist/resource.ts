// amplify/functions/waitlist/resource.ts
import { defineFunction, secret } from "@aws-amplify/backend";

export const waitlist = defineFunction({
  entry: "./handler.ts",
  memoryMB: 256,
  timeoutSeconds: 10,
  environment: {
    EMAIL_FROM: process.env.EMAIL_FROM,
    WAITLIST_TABLE_NAME: process.env.WAITLIST_TABLE_NAME,
    RESEND_API_KEY: secret("RESEND_API_KEY"),
    HASH_SALT: secret("HASH_SALT"),
  },
});
