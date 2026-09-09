import { execFile } from "node:child_process";

const CEC_CTL_BIN = process.env.CEC_CTL_BIN || "cec-ctl";

export const COMMANDS = {
  POWER_ON: (config) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--image-view-on",
  ],
  POWER_OFF: (config) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--standby",
  ],
  INPUT_1: (config) => {
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=1.0.0.0"
  },
  INPUT_2: (config) => {
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=2.0.0.0"
  },
  INPUT_3: (config) => {
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=3.0.0.0"
  }
};
COMMANDS.STANDBY = COMMANDS.POWER_OFF;

export function runCecBin(args) {
  return new Promise((resolve, reject) => {
    execFile(CEC_CTL_BIN, args, { timeout: 5000 }, (err, stdout, stderr) => {
      if (err && err.code == undefined && err.errno) {
        reject(err);
        return;
      }
      resolve({
        ok: !err,
        code: err ? err.code : 0,
        stdout: stdout || "",
        stderr: stderr || "",
        args,
      });
    });
  });
}

export async function claimCecAdapter(config) {
  const flag = `--${config.cecAdapterType}`;
  try {
    const result = await runCecBin(["-d", config.cecDevice, flag]);
    if (!result.ok) {
      console.warn(
        `[cec] Adapter claim (${flag}) exited with code ${result.code}.\n` +
          `[cec] stderr: ${result.stderr.trim()}\n` +
          `[cec] If commands silently do nothing from here, check: the TV's ` +
          `CEC feature is turned on, and that your mini-HDMI cable/adapter ` +
          `actually carries pin 13 (CEC) -- many cheap ones don't.`,
      );
      return result;
    }

    console.log(
      `[cec] Adapter claimed as ${config.cecAdapterType} on ${config.cecDevice}`,
    );
    return result;
  } catch (e) {
    console.error(
      `[cec] Could not run cec-ctl at all (${CEC_CTL_BIN}): ${e.message}\n` +
        `[cec] Check that v4l-utils is installed and ${config.cecDevice} exists.`,
    );
    throw e;
  }
}

export async function send(rawCommand, config) {
  const command = (rawCommand || "").trim();
  if (!command) {
    return {
      command,
      ok: false,
      code: null,
      stdout: "",
      stderr: `No command received. Known commands: ${Object.keys(COMMANDS).join(", ")}, or RAW:<args>`,
      args: [],
    };
  }

  if (command.toUpperCase().startsWith("RAW:")) {
    const argsStr = command.slice(4).trim();
    const args = argsStr.length ? argsStr.split(/\s+/) : [];
    const result = await runCecBin(["-d", config.cecDevice, ...args]);
    return { command, ...result };
  }

  const builder = COMMANDS[command.toUpperCase()];
  if (!builder) {
    return {
      command,
      ok: false,
      code: null,
      stdout: "",
      stderr: `Unknown command "${command}". Known commands: ${Object.keys(COMMANDS).join(", ")}, or RAW:<args>`,
      args: [],
    };
  }

  const args = builder(config);
  const result = await runCecBin(args);
  return { command, ...result };
}
