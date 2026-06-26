import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const PORT = Number.parseInt(process.env.COREI_HOST_PORT || "8787", 10);
const HOST_BIND = process.env.COREI_HOST_BIND || "127.0.0.1";
const OLLAMA_BASE_URL = process.env.COREI_OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.COREI_HOST_MODEL || "gemma3:4b";
const ADMIN_TOKEN = process.env.COREI_ADMIN_TOKEN || "";
const MAX_BODY_SIZE_BYTES = 512 * 1024;

const rawAllowedOrigins =
  process.env.COREI_ALLOWED_ORIGINS ||
  "https://www.koraytasan.com,https://koraytasan.com,http://127.0.0.1:1420,http://localhost:1420";
const allowedOrigins = new Set(
  rawAllowedOrigins
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

const dataDir = path.join(rootDir, "data", "online-host");
const conversationFile = path.join(dataDir, "external-conversations.json");
const recoveryAttemptFile = path.join(dataDir, "recovery-attempts.json");
const temporaryChangesFile = path.join(dataDir, "temporary-changes.json");
const temporaryProfilesFile = path.join(dataDir, "temporary-profiles.json");

const MASTER_ADMIN_PROFILE = {
  email: process.env.COREI_ADMIN_EMAIL || "ben@koraytasan.com",
  phone: process.env.COREI_ADMIN_PHONE || "+90 5553163797",
};

const RECOVERY_QUESTIONS = [
  process.env.COREI_RECOVERY_QUESTION_1 || "Master persona başlığının ilk kelimesi nedir?",
  process.env.COREI_RECOVERY_QUESTION_2 || "Admin telefonunun son 4 hanesi nedir?",
];

/**
 * @typedef {{ role: "user" | "assistant", content: string, at: string }} StoredMessage
 *
 * @typedef {{
 *   id: string,
 *   channel: "contact" | "share",
 *   source: string,
 *   topic: string,
 *   recipientLabel: string,
 *   guestDisplayName?: string,
 *   createdAt: string,
 *   updatedAt: string,
 *   status: "active" | "completed" | "revoked" | "expired",
 *   messageCount: number,
 *   summary: string,
 *   transcript: StoredMessage[],
 * }} ExternalConversation
 */

function nowIso() {
  return new Date().toISOString();
}

function summarizeTranscript(transcript) {
  const lastAssistant = [...transcript]
    .reverse()
    .find((entry) => entry.role === "assistant");
  if (!lastAssistant) return "Gorusme devam ediyor.";
  const clean = lastAssistant.content.replace(/\s+/g, " ").trim();
  if (!clean) return "Yanıt olustu.";
  return clean.length > 260 ? `${clean.slice(0, 260)}...` : clean;
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readConversationStore() {
  await ensureDataDir();
  try {
    const raw = await readFile(conversationFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    return [];
  }
}

async function writeConversationStore(store) {
  await ensureDataDir();
  const next = JSON.stringify(store, null, 2);
  await writeFile(conversationFile, next, "utf8");
}

async function readJsonArrayStore(filePath) {
  await ensureDataDir();
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    return [];
  }
}

async function writeJsonArrayStore(filePath, items) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(items, null, 2), "utf8");
}

async function parseJsonBody(request) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    const nextChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += nextChunk.length;
    if (total > MAX_BODY_SIZE_BYTES) {
      throw new Error("BODY_TOO_LARGE");
    }
    chunks.push(nextChunk);
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function applyCors(response, origin) {
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-CoreI-Source, X-CoreI-Operation-Id"
  );
}

function sendJson(response, statusCode, payload, origin) {
  applyCors(response, origin);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function unauthorized(response, origin) {
  sendJson(response, 401, { ok: false, error: "UNAUTHORIZED" }, origin);
}

function isAdminAuthorized(request) {
  if (!ADMIN_TOKEN) return true;
  const authHeader = request.headers.authorization || "";
  const expected = `Bearer ${ADMIN_TOKEN}`;
  return authHeader === expected;
}

async function callOllamaChat(messages, model = DEFAULT_MODEL) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      options: {
        temperature: 0.35,
        top_p: 0.9,
        repeat_penalty: 1.1,
      },
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const fallback = `OLLAMA_ERROR_${response.status}`;
    throw new Error(detail || fallback);
  }

  const json = await response.json();
  const content = json?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("EMPTY_OLLAMA_REPLY");
  }
  return content.trim();
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUsername(value) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `9${digits}`;
  return digits;
}

async function hashAnswer(value) {
  const normalized = value.trim().toLocaleLowerCase("tr-TR");
  const payload = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Buffer.from(digest).toString("hex");
}

function toStoredMessage(role, content) {
  return {
    role,
    content,
    at: nowIso(),
  };
}

function upsertConversation(store, draft) {
  const index = store.findIndex((item) => item.id === draft.id);
  if (index === -1) {
    return [draft, ...store].slice(0, 400);
  }
  const next = [...store];
  next[index] = draft;
  return next;
}

function buildPublicConversation(entry) {
  return {
    id: entry.id,
    channel: entry.channel,
    source: entry.source,
    topic: entry.topic,
    recipientLabel: entry.recipientLabel,
    guestDisplayName: entry.guestDisplayName,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    status: entry.status,
    messageCount: entry.messageCount,
    summary: entry.summary,
  };
}

const serverStartedAt = Date.now();

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  const method = request.method || "GET";
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (method === "OPTIONS") {
    applyCors(response, origin);
    response.writeHead(204);
    response.end();
    return;
  }

  if (method === "GET" && pathname === "/health") {
    const store = await readConversationStore();
    const recoveryAttempts = await readJsonArrayStore(recoveryAttemptFile);
    const temporaryProfiles = await readJsonArrayStore(temporaryProfilesFile);
    const temporaryChanges = await readJsonArrayStore(temporaryChangesFile);
    sendJson(
      response,
      200,
      {
        ok: true,
        service: "core-i-host-api",
        startedAt: new Date(serverStartedAt).toISOString(),
        uptimeSec: Math.floor((Date.now() - serverStartedAt) / 1000),
        ollamaBaseUrl: OLLAMA_BASE_URL,
        model: DEFAULT_MODEL,
        conversations: store.length,
        recoveryAttempts: recoveryAttempts.length,
        temporaryProfiles: temporaryProfiles.length,
        temporaryChanges: temporaryChanges.length,
      },
      origin
    );
    return;
  }

  if (method === "GET" && pathname === "/core") {
    response.writeHead(302, {
      Location: "/",
    });
    response.end();
    return;
  }

  if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const html = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>core-I Host</title>
    <style>
      body { margin:0; padding:32px; font-family: Inter, Arial, sans-serif; background:#11110f; color:#f4f0e8; }
      .box { max-width:760px; margin:0 auto; padding:24px; border-radius:16px; background:rgba(255,255,255,.08); }
      h1 { margin:0 0 8px; }
      p { color:#d5cbbd; line-height:1.6; }
      code { background:rgba(0,0,0,.3); padding:2px 6px; border-radius:6px; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>core-I Host aktif</h1>
      <p>Bu endpoint host makinede calisiyor. Web ve form istekleri buradan Ollama'ya iletilir.</p>
      <p>Saglik kontrolu: <code>/health</code></p>
      <p>Contact API: <code>/api/contact</code></p>
      <p>Chat API: <code>/api/chat</code></p>
      <p>Gateway Chat: <code>/v1/chat</code></p>
      <p>Recovery: <code>/v1/auth/forgot/*</code></p>
    </div>
  </body>
</html>`;
    applyCors(response, origin);
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }

  if (method === "GET" && pathname === "/api/external-conversations") {
    if (!isAdminAuthorized(request)) {
      unauthorized(response, origin);
      return;
    }
    const limitRaw = Number.parseInt(url.searchParams.get("limit") || "30", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 120) : 30;
    const store = await readConversationStore();
    const items = store
      .slice()
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, limit)
      .map(buildPublicConversation);
    sendJson(response, 200, { ok: true, items }, origin);
    return;
  }

  if (method === "POST" && pathname === "/v1/chat") {
    try {
      const body = await parseJsonBody(request);
      const operationId = normalizeText(body.operationId) || `op-${randomUUID()}`;
      const selectedModel = normalizeText(body.model) || DEFAULT_MODEL;
      const inputMessage = normalizeText(body.message);
      const promptMessages = Array.isArray(body.messages)
        ? body.messages
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
              role: item.role === "assistant" ? "assistant" : "user",
              content: normalizeText(item.content),
            }))
            .filter((item) => item.content)
        : [];

      if (!inputMessage && promptMessages.length === 0) {
        sendJson(
          response,
          400,
          {
            ok: false,
            error: "MESSAGE_REQUIRED",
            operationId,
          },
          origin
        );
        return;
      }

      const systemPrompt = normalizeText(body.systemPrompt);
      const messages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...promptMessages,
        ...(inputMessage ? [{ role: "user", content: inputMessage }] : []),
      ];

      const reply = await callOllamaChat(messages, selectedModel);
      sendJson(
        response,
        200,
        {
          ok: true,
          operationId,
          reply,
          strategy: {
            mode: "host-primary",
            provider: "host-ollama",
            model: selectedModel,
          },
        },
        origin
      );
      return;
    } catch (error) {
      sendJson(
        response,
        500,
        {
          ok: false,
          error: "CHAT_FAILED",
          detail: error instanceof Error ? error.message : "UNKNOWN",
        },
        origin
      );
      return;
    }
  }

  if (method === "POST" && pathname === "/v1/auth/forgot/start") {
    try {
      const body = await parseJsonBody(request);
      const username = normalizeText(body.username);
      if (!username) {
        sendJson(
          response,
          400,
          { ok: false, error: "USERNAME_REQUIRED" },
          origin
        );
        return;
      }

      const isAdminIdentity =
        normalizeUsername(username) === normalizeUsername(MASTER_ADMIN_PROFILE.email) ||
        normalizePhone(username) === normalizePhone(MASTER_ADMIN_PROFILE.phone);

      if (!isAdminIdentity) {
        sendJson(
          response,
          403,
          {
            ok: false,
            error: "ACCOUNT_NOT_ELIGIBLE",
          },
          origin
        );
        return;
      }

      const attempts = await readJsonArrayStore(recoveryAttemptFile);
      const attempt = {
        id: `recover-${randomUUID()}`,
        createdAt: nowIso(),
        username: MASTER_ADMIN_PROFILE.email,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        questions: RECOVERY_QUESTIONS,
        verified: false,
        failedCount: 0,
      };
      attempts.unshift(attempt);
      await writeJsonArrayStore(recoveryAttemptFile, attempts.slice(0, 200));
      sendJson(
        response,
        200,
        {
          ok: true,
          attemptId: attempt.id,
          questions: attempt.questions,
          expiresAt: attempt.expiresAt,
        },
        origin
      );
      return;
    } catch (error) {
      sendJson(
        response,
        500,
        {
          ok: false,
          error: "FORGOT_START_FAILED",
          detail: error instanceof Error ? error.message : "UNKNOWN",
        },
        origin
      );
      return;
    }
  }

  if (method === "POST" && pathname === "/v1/auth/forgot/verify") {
    try {
      const body = await parseJsonBody(request);
      const attemptId = normalizeText(body.attemptId);
      const email = normalizeText(body.email);
      const answers = Array.isArray(body.answers)
        ? body.answers.map((item) => normalizeText(String(item)))
        : [];

      if (!attemptId || answers.length < 2) {
        sendJson(response, 400, { ok: false, error: "VERIFY_INPUT_REQUIRED" }, origin);
        return;
      }

      const attempts = await readJsonArrayStore(recoveryAttemptFile);
      const targetIndex = attempts.findIndex((item) => item.id === attemptId);
      if (targetIndex === -1) {
        sendJson(response, 404, { ok: false, error: "ATTEMPT_NOT_FOUND" }, origin);
        return;
      }

      const attempt = attempts[targetIndex];
      if (Date.parse(attempt.expiresAt) <= Date.now()) {
        sendJson(response, 410, { ok: false, error: "ATTEMPT_EXPIRED" }, origin);
        return;
      }

      if (normalizeUsername(email) !== normalizeUsername(MASTER_ADMIN_PROFILE.email)) {
        attempt.failedCount = Number(attempt.failedCount || 0) + 1;
        attempts[targetIndex] = attempt;
        await writeJsonArrayStore(recoveryAttemptFile, attempts);
        sendJson(response, 403, { ok: false, error: "EMAIL_MISMATCH" }, origin);
        return;
      }

      const expectedHash1 = normalizeText(process.env.COREI_RECOVERY_ANSWER_HASH_1);
      const expectedHash2 = normalizeText(process.env.COREI_RECOVERY_ANSWER_HASH_2);
      const firstHash = await hashAnswer(answers[0]);
      const secondHash = await hashAnswer(answers[1]);
      const fallbackVerified =
        answers[0].toLocaleLowerCase("tr-TR").includes("koray") &&
        answers[1].replace(/\D+/g, "") === "3797";
      const verified =
        (expectedHash1 && expectedHash2
          ? firstHash === expectedHash1 && secondHash === expectedHash2
          : fallbackVerified) || false;

      if (!verified) {
        attempt.failedCount = Number(attempt.failedCount || 0) + 1;
        attempts[targetIndex] = attempt;
        await writeJsonArrayStore(recoveryAttemptFile, attempts);
        sendJson(response, 403, { ok: false, error: "RECOVERY_ANSWERS_INVALID" }, origin);
        return;
      }

      attempt.verified = true;
      attempt.recoveryToken = `rt-${randomUUID()}`;
      attempt.verifiedAt = nowIso();
      attempts[targetIndex] = attempt;
      await writeJsonArrayStore(recoveryAttemptFile, attempts);

      sendJson(
        response,
        200,
        {
          ok: true,
          attemptId: attempt.id,
          recoveryToken: attempt.recoveryToken,
        },
        origin
      );
      return;
    } catch (error) {
      sendJson(
        response,
        500,
        {
          ok: false,
          error: "FORGOT_VERIFY_FAILED",
          detail: error instanceof Error ? error.message : "UNKNOWN",
        },
        origin
      );
      return;
    }
  }

  if (method === "POST" && pathname === "/v1/auth/forgot/issue-temporary-profile") {
    try {
      const body = await parseJsonBody(request);
      const attemptId = normalizeText(body.attemptId);
      const recoveryToken = normalizeText(body.recoveryToken);
      const reason = normalizeText(body.reason) || "Admin şifre kurtarma";

      if (!attemptId || !recoveryToken) {
        sendJson(
          response,
          400,
          { ok: false, error: "RECOVERY_TOKEN_REQUIRED" },
          origin
        );
        return;
      }

      const attempts = await readJsonArrayStore(recoveryAttemptFile);
      const attempt = attempts.find((item) => item.id === attemptId);
      if (!attempt || !attempt.verified || attempt.recoveryToken !== recoveryToken) {
        sendJson(response, 403, { ok: false, error: "RECOVERY_NOT_VERIFIED" }, origin);
        return;
      }

      const temporaryProfiles = await readJsonArrayStore(temporaryProfilesFile);
      const profile = {
        id: `tmp-${randomUUID()}`,
        issuedAt: nowIso(),
        expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        reason,
        scopes: ["chat", "hub"],
        restrictions: [
          "admin-panel-kapali",
          "ayarlar-kapali",
          "lisans-kapali",
          "terminal-kapali",
          "gecmis-sohbet-kapali",
        ],
      };
      temporaryProfiles.unshift(profile);
      await writeJsonArrayStore(temporaryProfilesFile, temporaryProfiles.slice(0, 100));

      sendJson(response, 200, { ok: true, profile }, origin);
      return;
    } catch (error) {
      sendJson(
        response,
        500,
        {
          ok: false,
          error: "TEMP_PROFILE_ISSUE_FAILED",
          detail: error instanceof Error ? error.message : "UNKNOWN",
        },
        origin
      );
      return;
    }
  }

  if (method === "GET" && pathname === "/v1/admin/temporary-changes") {
    if (!isAdminAuthorized(request)) {
      unauthorized(response, origin);
      return;
    }
    const items = await readJsonArrayStore(temporaryChangesFile);
    sendJson(response, 200, { ok: true, items }, origin);
    return;
  }

  if (method === "POST" && pathname === "/v1/admin/temporary-changes/approve") {
    if (!isAdminAuthorized(request)) {
      unauthorized(response, origin);
      return;
    }
    try {
      const body = await parseJsonBody(request);
      const changeId = normalizeText(body.changeId);
      const approve = Boolean(body.approve);
      const reviewedBy = normalizeText(body.reviewedBy) || "admin";
      if (!changeId) {
        sendJson(response, 400, { ok: false, error: "CHANGE_ID_REQUIRED" }, origin);
        return;
      }

      const items = await readJsonArrayStore(temporaryChangesFile);
      const targetIndex = items.findIndex((item) => item.id === changeId);
      if (targetIndex === -1) {
        sendJson(response, 404, { ok: false, error: "CHANGE_NOT_FOUND" }, origin);
        return;
      }

      items[targetIndex] = {
        ...items[targetIndex],
        status: approve ? "approved" : "rejected",
        reviewedAt: nowIso(),
        reviewedBy,
      };
      await writeJsonArrayStore(temporaryChangesFile, items);
      sendJson(response, 200, { ok: true, item: items[targetIndex] }, origin);
      return;
    } catch (error) {
      sendJson(
        response,
        500,
        {
          ok: false,
          error: "TEMP_CHANGE_REVIEW_FAILED",
          detail: error instanceof Error ? error.message : "UNKNOWN",
        },
        origin
      );
      return;
    }
  }

  if (method === "POST" && pathname === "/api/chat") {
    try {
      const body = await parseJsonBody(request);
      const message = normalizeText(body.message);
      if (!message) {
        sendJson(response, 400, { ok: false, error: "MESSAGE_REQUIRED" }, origin);
        return;
      }

      const topic = normalizeText(body.topic) || "Genel konu";
      const recipientLabel = normalizeText(body.recipientLabel) || "Misafir";
      const guestDisplayName = normalizeText(body.guestDisplayName);
      const conversationId = normalizeText(body.conversationId) || `guest-${randomUUID()}`;

      const store = await readConversationStore();
      const current =
        store.find((item) => item.id === conversationId) ||
        /** @type {ExternalConversation} */ ({
          id: conversationId,
          channel: "share",
          source: normalizeText(body.source) || "web-core-link",
          topic,
          recipientLabel,
          guestDisplayName: guestDisplayName || undefined,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          status: "active",
          messageCount: 0,
          summary: "Gorusme basladi.",
          transcript: [],
        });

      const userMessage = toStoredMessage("user", message);
      const transcriptForModel = [...current.transcript, userMessage];

      const systemPrompt = [
        "You are core-I guest conversation mode.",
        "Stay within the topic and clarify requirements.",
        "Do not ask for unnecessary private data.",
        "If you need more context, ask short concrete questions.",
        "Always answer in the user's language.",
      ].join("\n");

      const modelMessages = [
        { role: "system", content: systemPrompt },
        ...transcriptForModel.map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
      ];

      const assistantReply = await callOllamaChat(modelMessages);
      const assistantMessage = toStoredMessage("assistant", assistantReply);

      const nextTranscript = [...transcriptForModel, assistantMessage].slice(-240);
      const nextConversation = {
        ...current,
        topic: current.topic || topic,
        recipientLabel: current.recipientLabel || recipientLabel,
        guestDisplayName: guestDisplayName || current.guestDisplayName,
        updatedAt: nowIso(),
        messageCount: nextTranscript.filter((entry) => entry.role === "user").length,
        summary: summarizeTranscript(nextTranscript),
        transcript: nextTranscript,
      };

      const nextStore = upsertConversation(store, nextConversation);
      await writeConversationStore(nextStore);

      sendJson(
        response,
        200,
        {
          ok: true,
          conversationId,
          reply: assistantReply,
          summary: nextConversation.summary,
        },
        origin
      );
      return;
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { ok: false, error: "INVALID_JSON" }, origin);
        return;
      }
      if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
        sendJson(response, 413, { ok: false, error: "BODY_TOO_LARGE" }, origin);
        return;
      }
      sendJson(
        response,
        500,
        {
          ok: false,
          error: "CHAT_FAILED",
          detail: error instanceof Error ? error.message : "UNKNOWN",
        },
        origin
      );
      return;
    }
  }

  if (method === "POST" && pathname === "/api/contact") {
    try {
      const body = await parseJsonBody(request);
      const message = normalizeText(body.message);
      if (!message) {
        sendJson(response, 400, { ok: false, error: "MESSAGE_REQUIRED" }, origin);
        return;
      }

      const name = normalizeText(body.name) || "Misafir";
      const email = normalizeText(body.email);
      const phone = normalizeText(body.phone);
      const subject = normalizeText(body.subject) || "Iletisim formu";
      const threadId = normalizeText(body.threadId) || `contact-${randomUUID()}`;
      const source = normalizeText(body.source) || "koraytasan-contact";

      const store = await readConversationStore();
      const current =
        store.find((item) => item.id === threadId) ||
        /** @type {ExternalConversation} */ ({
          id: threadId,
          channel: "contact",
          source,
          topic: subject,
          recipientLabel: email || phone || name,
          guestDisplayName: name || undefined,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          status: "active",
          messageCount: 0,
          summary: "Iletisim gorusmesi basladi.",
          transcript: [],
        });

      const contactMessageText = [
        `Ad: ${name}`,
        email ? `E-posta: ${email}` : null,
        phone ? `Telefon: ${phone}` : null,
        `Konu: ${subject}`,
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n");

      const userMessage = toStoredMessage("user", contactMessageText);
      const transcriptForModel = [...current.transcript, userMessage];

      const systemPrompt = [
        "You are core-I contact assistant for koraytasan.com.",
        "Reply clearly and warmly in the same language as the user.",
        "If requirements are unclear, ask concise follow-up questions.",
        "Do not fabricate capabilities or commitments.",
      ].join("\n");

      const modelMessages = [
        { role: "system", content: systemPrompt },
        ...transcriptForModel.map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
      ];

      const assistantReply = await callOllamaChat(modelMessages);
      const assistantMessage = toStoredMessage("assistant", assistantReply);
      const nextTranscript = [...transcriptForModel, assistantMessage].slice(-240);

      const nextConversation = {
        ...current,
        topic: subject,
        recipientLabel: email || phone || name,
        guestDisplayName: name || current.guestDisplayName,
        updatedAt: nowIso(),
        messageCount: nextTranscript.filter((entry) => entry.role === "user").length,
        summary: summarizeTranscript(nextTranscript),
        transcript: nextTranscript,
      };

      const nextStore = upsertConversation(store, nextConversation);
      await writeConversationStore(nextStore);

      sendJson(
        response,
        200,
        {
          ok: true,
          threadId,
          reply: assistantReply,
          summary: nextConversation.summary,
        },
        origin
      );
      return;
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { ok: false, error: "INVALID_JSON" }, origin);
        return;
      }
      if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
        sendJson(response, 413, { ok: false, error: "BODY_TOO_LARGE" }, origin);
        return;
      }
      sendJson(
        response,
        500,
        {
          ok: false,
          error: "CONTACT_FAILED",
          detail: error instanceof Error ? error.message : "UNKNOWN",
        },
        origin
      );
      return;
    }
  }

  sendJson(response, 404, { ok: false, error: "NOT_FOUND" }, origin);
});

server.listen(PORT, HOST_BIND, () => {
  console.log(`[core-i-host-api] running on http://${HOST_BIND}:${PORT}`);
  console.log(`[core-i-host-api] ollama: ${OLLAMA_BASE_URL}`);
  console.log(`[core-i-host-api] model: ${DEFAULT_MODEL}`);
  console.log(`[core-i-host-api] allowed origins: ${Array.from(allowedOrigins).join(", ")}`);
});
