import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import crypto from "crypto";

const {
  WAITLIST_TABLE_NAME = "",
  EMAIL_FROM = "",
  RESEND_API_KEY = "",
  HASH_SALT = "",
} = process.env;

const ddb = new DynamoDBClient({});
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
function hashIp(ip: string, salt: string) {
  const h = crypto.createHash("sha256");
  h.update(`${salt}:${ip}`);
  return h.digest("hex");
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*", // tighten to your domain later
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
    const sourceIp =
      (event.requestContext.identity as any)?.sourceIp ||
      event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      "0.0.0.0";
    const userAgent = event.headers["user-agent"] || "";
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

    // Write idempotently (do not overwrite)
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

    // Email via Resend (Node 18+ has fetch)
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
      // still return success; flip to 500 if you prefer strict email delivery
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
