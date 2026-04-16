const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function clean(value) {
  return String(value || "").trim();
}

function validateLead(payload) {
  const name = clean(payload.name);
  const phone = clean(payload.phone);
  if (!name || !phone) {
    return { ok: false, error: "Ad və telefon mütləqdir." };
  }
  return { ok: true };
}

function buildTelegramMessage(payload) {
  const estimate = payload.estimate || {};
  return [
    "Yeni AZTOWERS müraciəti",
    "",
    `Ad: ${clean(payload.name)}`,
    `Telefon: ${clean(payload.phone)}`,
    `Qeyd: ${clean(payload.note) || "Qeyd yoxdur"}`,
    "",
    "Smeta:",
    `Qiymət: ${clean(estimate.price) || "-"}`,
    `Layihə: ${clean(estimate.summary) || "-"}`,
    `Paket: ${clean(estimate.package) || "-"}`,
    `Müddət: ${clean(estimate.duration) || "-"}`,
    `Tip: ${clean(estimate.projectType) || "-"}`,
    `Obyekt: ${clean(estimate.propertyType) || "-"}`,
    `Keyfiyyət: ${clean(estimate.quality) || "-"}`,
    `İcra: ${clean(estimate.timeline) || "-"}`,
    `Sahə: ${clean(estimate.area) || "-"}`,
    `Əlavələr: ${clean(estimate.addons) || "-"}`,
    "",
    `Mənbə: ${clean(payload.source) || "-"}`,
  ].join("\n");
}

function saveLead(payload) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(LEADS_FILE, JSON.stringify({ ...payload, savedAt: new Date().toISOString() }) + "\n");
}

async function sendTelegram(payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { configured: false };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildTelegramMessage(payload),
      disable_web_page_preview: true,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.description || "Telegram mesajı göndərilmədi.");
  }

  return { configured: true, messageId: result.result?.message_id };
}

async function handleContact(req, res) {
  try {
    const payload = await readJsonBody(req);
    const validation = validateLead(payload);
    if (!validation.ok) {
      sendJson(res, 400, { ok: false, error: validation.error });
      return;
    }

    saveLead(payload);
    const telegram = await sendTelegram(payload);

    sendJson(res, 200, {
      ok: true,
      stored: true,
      telegramConfigured: telegram.configured,
      telegramMessageId: telegram.messageId || null,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || "Server xətası." });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rawPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(ROOT, rawPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/contact") {
    handleContact(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { ok: false, error: "Method not allowed" });
});

server.listen(PORT, HOST, () => {
  console.log(`AZTOWERS site running at http://${HOST}:${PORT}`);
  console.log("Telegram bot:", process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? "configured" : "not configured");
});
