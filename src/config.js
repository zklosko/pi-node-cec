import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const __dirname = import.meta.dirname;
const CONFIG_PATH =
  process.env.CEC_BRIDGE_CONFIG || path.join(__dirname, "..", "config.json");

const DEFAULTS = {
  port: 8080,
  cecDevice: "/dev/cec0",
  cecAdapterType: "playback",
  targetLogicalAddress: 0,
  adminToken: "",
  scenes: [],
};

function readConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  return JSON.parse(raw);
}

function writeConfig(config) {
  const dir = path.dirname(CONFIG_PATH);
  const tmp = path.join(
    dir,
    `.${path.basename(CONFIG_PATH)}.tmp-${process.pid}-${Date.now()}`,
  );
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2), "utf8");
  fs.renameSync(tmp, CONFIG_PATH);
}

function ensureConfigExists() {
  if (fs.existsSync(CONFIG_PATH)) return;
  const initial = {
    ...DEFAULTS,
    adminToken: crypto.randomBytes(9).toString("base64url"),
  };
  writeConfig(initial);
  console.log(
    `[config] First run: created ${CONFIG_PATH}\n` +
      `[config] Generated admin token: ${initial.adminToken}\n` +
      `[config] You'll need this to change settings in the web UI.`,
  );
}

export function loadConfig() {
  ensureConfigExists();
  const onDisk = readConfig();
  return { ...DEFAULTS, ...onDisk };
}

export function saveConfig(newConfig) {
  const current = loadConfig();
  const next = { ...current, ...newConfig };
  writeConfig(next);
  return next;
}
