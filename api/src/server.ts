import cors from "@fastify/cors";
import Fastify from "fastify";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifySession } from "./auth.js";
import { closePool } from "./db.js";
import { FnError } from "./errors.js";
import { functions } from "./fns/index.js";

const PORT = Number(process.env.PORT) || 8787;
// api/templates tanto en desarrollo (src/) como compilado (dist/)
const TEMPLATES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");
const TEMPLATE_NAME_RE = /^[a-z0-9-]+\.html$/;
const INTERNAL_MESSAGE = "Ocurrió un error. Inténtalo de nuevo.";

/** TRUST_PROXY: true/false o una lista de IPs/CIDR de confianza (lo que acepta Fastify). */
function trustProxy(): boolean | string {
  const raw = (process.env.TRUST_PROXY || "").trim();
  if (!raw || raw === "false") return false;
  if (raw === "true") return true;
  return raw;
}

/** CORS_ORIGINS: `*` en desarrollo; en producción una lista separada por comas. */
function corsOrigin(): boolean | string[] {
  const raw = (process.env.CORS_ORIGINS || "*").trim();
  if (!raw || raw === "*") return true;
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

const app = Fastify({ logger: true, trustProxy: trustProxy() });

await app.register(cors, {
  origin: corsOrigin(),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.setErrorHandler((err: unknown, request, reply) => {
  if (err instanceof FnError) {
    void reply.status(err.status).send({ code: err.code, message: err.message });
    return;
  }
  // Errores propios de Fastify (JSON mal formado, cuerpo vacío, demasiado grande...)
  const statusCode = (err as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 500) {
    const code =
      statusCode === 401
        ? "unauthenticated"
        : statusCode === 403
          ? "permission-denied"
          : statusCode === 404
            ? "not-found"
            : statusCode === 429
              ? "resource-exhausted"
              : "invalid-argument";
    void reply.status(statusCode).send({ code, message: "La petición no es válida." });
    return;
  }
  request.log.error(err);
  void reply.status(500).send({ code: "internal", message: INTERNAL_MESSAGE });
});

app.setNotFoundHandler((_request, reply) => {
  void reply.status(404).send({ code: "not-found", message: "La ruta no existe." });
});

app.get("/health", async () => ({ ok: true }));

/** Plantillas de correo de GoTrue (p. ej. GOTRUE_MAILER_TEMPLATES_RECOVERY apunta a /templates/recovery.html). */
app.get<{ Params: { name: string } }>("/templates/:name", async (request, reply) => {
  const name = request.params.name;
  if (!TEMPLATE_NAME_RE.test(name)) {
    throw new FnError("not-found", "La plantilla no existe.");
  }
  let html: string;
  try {
    html = await readFile(path.join(TEMPLATES_DIR, name), "utf8");
  } catch (err) {
    if ((err as { code?: string }).code === "ENOENT") {
      throw new FnError("not-found", "La plantilla no existe.");
    }
    throw err;
  }
  return reply.type("text/html; charset=utf-8").send(html);
});

/** Antes callables de Cloud Functions: POST /fn/<nombre> con JSON y la sesión en Authorization: Bearer. */
for (const [name, handler] of Object.entries(functions)) {
  app.post(`/fn/${name}`, async (request) => {
    const auth = await verifySession(request.headers.authorization);
    const body = request.body;
    const data: Record<string, unknown> =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    return handler({ auth, data, ip: request.ip || "unknown" });
  });
}

const shutdown = async (signal: string) => {
  app.log.info(`Recibido ${signal}; cerrando la API.`);
  await app.close();
  await closePool();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
