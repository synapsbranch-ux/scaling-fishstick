// amplify/functions/waitlist/handler.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { createHash } from "node:crypto";

// Ces variables sont injectées via backend.addEnvironment(...) (non-secrets)
// et via secret("...") pour les secrets.
const EMAIL_FROM = process.env.EMAIL_FROM!;
const WAITLIST_TABLE_NAME = process.env.WAITLIST_TABLE_NAME!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const HASH_SALT = process.env.HASH_SALT!;

// (Optionnel) Garde-fou runtime si l'env est mal câblé :
if (!EMAIL_FROM || !WAITLIST_TABLE_NAME || !RESEND_API_KEY || !HASH_SALT) {
  console.error("Missing required environment variables for waitlist handler.");
}

const ddb = new DynamoDBClient({});
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
function hashIp(ip: string, salt: string) {
  const h = createHash("sha256");
  h.update(`${salt}:${ip}`);
  return h.digest("hex");
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*", // restreindre plus tard à ton domaine
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers: cors, body: "Missing body" };
    }

    const nowIso = new Date().toISOString();
    const body = JSON.parse(event.body || "{}") as {
      name?: string;
      email?: string;
      utm?: Record<string, string>;
      referer?: string;
      timezone?: string;
      locale?: string;
      consent_marketing?: boolean;
    };

    // Validate email
    const email = normalizeEmail(body.email || "");
    if (!email || email.length > 254 || !emailRegex.test(email)) {
      return { statusCode: 400, headers: cors, body: "Invalid email" };
    }

    // IP / UA
    const xfwd = event.headers?.["x-forwarded-for"] ?? event.headers?.["X-Forwarded-For"];
    const sourceIp =
      (event.requestContext as any)?.identity?.sourceIp ||
      (typeof xfwd === "string" ? xfwd.split(",")[0]?.trim() : undefined) ||
      "0.0.0.0";
    const userAgent =
      event.headers?.["user-agent"] ??
      event.headers?.["User-Agent"] ??
      "";
    const ipHash = hashIp(sourceIp, HASH_SALT);

    // DynamoDB item
    const item: Record<string, any> = {
      email: { S: email },
      name: body.name ? { S: body.name.trim() } : { NULL: true },
      utm: body.utm ? { S: JSON.stringify(body.utm) } : { NULL: true },
      referer: body.referer ? { S: body.referer } : { NULL: true },
      user_agent: userAgent ? { S: userAgent } : { NULL: true },
      ip_hash: { S: ipHash },
      timezone: body.timezone ? { S: body.timezone } : { NULL: true },
      locale: body.locale ? { S: body.locale } : { NULL: true },
      consent_marketing:
        typeof body.consent_marketing === "boolean"
          ? { BOOL: body.consent_marketing }
          : { NULL: true },
      status: { S: "pending" },
      created_at: { S: nowIso },
      updated_at: { S: nowIso },
    };

    // Écriture idempotente (n'écrase pas si déjà présent)
    await ddb
      .send(
        new PutItemCommand({
          TableName: WAITLIST_TABLE_NAME,
          Item: item,
          ConditionExpression: "attribute_not_exists(email)",
        })
      )
      .catch(async (err) => {
        if ((err as any)?.name !== "ConditionalCheckFailedException") throw err;
      });

    // Email via Resend (Node 20 inclut fetch)
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <h2 style="margin:0 0 8px;">Merci pour votre curiosité 💌</h2>
        <p style="margin:0 0 12px;">Vous êtes sur la liste d’attente. Nous vous tiendrons au courant.</p>
        <p style="margin:0 0 12px;">En attendant, suivez-nous sur X/Twitter.</p>
      </div>
    `;
    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: email,
        subject: "Merci pour votre curiosité",
        html,
        text:
          "Merci pour votre curiosité — vous êtes sur la liste d’attente. Nous vous tiendrons au courant.",
      }),
    });
    if (!emailResp.ok) {
      console.error("Resend error", await emailResp.text());
      // on renvoie quand même 200; change en 500 si tu veux strict
    }

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, message: "registered" }),
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: cors, body: "Internal Server Error" };
  }
};
