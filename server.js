import express from "express";
import path from "node:path";
import { loadConfig, saveConfig } from "./src/config.js";
import { claimCecAdapter, send } from "./src/cec.js";

let config = loadConfig();
const __dirname = import.meta.dirname;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API

app.get("/api/config", (req, res) => {
  const { adminToken, ...safeConfig } = config;
  res.json({ ...safeConfig, hasAdminToken: Boolean(adminToken) });
});

app.post("/api/config", (req, res) => {
  const providedToken = req.get("x-admin-token") || "";
  if (config.adminToken && providedToken !== config.adminToken) {
    res.status(403).json({
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
  ];
  const newConfig = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      newConfig[field] = req.body[field];
    }
  }

  config = saveConfig(newConfig);

  const restartNeeded = Object.prototype.hasOwnProperty.call(newConfig, "port");

  const { adminToken, ...safeConfig } = config;
  res.json({
    ok: true,
    config: { ...safeConfig, hasAdminToken: Boolean(adminToken) },
    restartNeeded,
  });
});

app.get("/api/trigger", async (req, res) => {
  const command = req.query.command;
  if (!command) {
    res.status(400).json({
      ok: false,
      error: 'Missing "command" parameter',
    });
    return;
  }

  try {
    const result = await send(command, config);
    res.json(result);
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

app.post("/api/trigger", async (req, res) => {
  const { command } = req.body || {};
  if (!command) {
    res
      .status(400)
      .json({ ok: false, error: "Missing command in request body" });
    return;
  }
  try {
    const result = await send(command, config);
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    uptimeSeconds: process.uptime(),
  });
});

// Runtime

async function main() {
  try {
    await claimCecAdapter(config);
  } catch (e) {
    // Don't crash so we can try again after troubleshooting
  }

  app.listen(config.port, () => {
    console.log(`[http] admin UI and API listening on port ${config.port}`);
  });
}

main();
