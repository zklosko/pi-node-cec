import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { loadConfig, saveConfig, type SettingsConfig } from "./src/config.js";
import { claimCecAdapter, send } from "./src/cec.js";

const server = fastify();
let config = loadConfig();
const __dirname = import.meta.dirname;

await server.register(fastifyStatic, {
  root: path.join(__dirname, "..", "public"),
  prefix: "/",
});

server.get("/api/config", (request, response) => {
  const { adminToken, ...safeConfig } = config;
  response.send({ ...safeConfig, hasAdminToken: Boolean(adminToken) });
});

server.post<{ Body: Partial<SettingsConfig> }>(
  "/api/config",
  (request, response) => {
    const providedToken = request.headers["x-admin-token"] || "";
    if (config.adminToken && providedToken !== config.adminToken) {
      response.code(403).send({
        ok: false,
        error: "Invalid or missing admin token",
      });
      return;
    }
    const allowedFields = [
      "cecDevice",
      "cecAdapterType",
      "targetLogicalAddress",
      "scenes",
      "port",
      "adminToken",
    ] as const satisfies readonly (keyof SettingsConfig)[];

    const newConfig: Partial<SettingsConfig> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(request.body, field)) {
        newConfig[field] = request.body[field] as never;
      }
    }

    config = saveConfig(newConfig);

    const restartNeeded = Object.prototype.hasOwnProperty.call(
      newConfig,
      "port",
    );

    const { adminToken, ...safeConfig } = config;
    response.send({
      ok: true,
      config: { ...safeConfig, hasAdminToken: Boolean(adminToken) },
      restartNeeded,
    });
  },
);

server.get<{ Querystring: { command?: string } }>(
  "/api/trigger",
  async (request, response) => {
    const command = request.query.command;
    if (!command) {
      response.code(400).send({
        ok: false,
        error: 'Missing "command" parameter',
      });
      return;
    }

    try {
      const result = await send(command, config);
      response.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      response.code(500).send({
        ok: false,
        error: message,
      });
    }
  },
);

server.post<{ Body: { command?: string } }>(
  "/api/trigger",
  async (request, response) => {
    const { command } = request.body || {};
    if (!command) {
      response
        .code(400)
        .send({ ok: false, error: "Missing command in request body" });
      return;
    }
    try {
      const result = await send(command, config);
      response.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      response.code(500).send({ ok: false, error: message });
    }
  },
);

server.get("/api/health", (request, response) => {
  response.send({
    ok: true,
    uptimeSeconds: process.uptime(),
  });
});

server.listen({ port: config.port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  claimCecAdapter(config);
  console.log(`Server listening at ${address}`);
});
