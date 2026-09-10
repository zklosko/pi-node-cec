/**
 * | Field                  | Meaning                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `port`                 | HTTP listen port (restart required to change)                                                    |
| `cecDevice`            | CEC device node, e.g. `/dev/cec0`                                                                |
| `cecAdapterType`       | Logical device role this Pi claims on the CEC bus (`playback`, `tv`, `record`, `tuner`, `audio`) |
| `targetLogicalAddress` | CEC logical address commands are sent to (0 = TV)                                                |
| `adminToken`           | Shared secret required to change settings; empty = unset (first save bootstraps one)             |
| `scenes`               | Array of `{ name, command }` objects shown as extra buttons in the web UI                        |
 */

import Conf from "conf";
import crypto from "node:crypto";

export type SettingsConfig = {
  port: number;
  cecDevice: string;
  cecAdapterType: string;
  targetLogicalAddress: number;
  adminToken?: string;
  scenes?: { name: string; command: string }[];
};

const DEFAULTS = {
  port: 8080,
  cecDevice: "/dev/cec0",
  cecAdapterType: "playback",
  targetLogicalAddress: 0,
  adminToken: "",
  scenes: [],
};

const config = new Conf<SettingsConfig>({
  projectName: "rest-cec",
  defaults: DEFAULTS,
});

function makeAdminToken() {
  const newToken = crypto.randomBytes(9).toString("base64url");
  config.set("adminToken", newToken);
  console.log(
    `[config] Generated admin token: ${newToken}\n` +
      `[config] You'll need this to change settings in the web UI.`,
  );
}

export function loadConfig() {
  if (!config.get("adminToken")) makeAdminToken();
  return config.store;
}

export function saveConfig(newConfig: Partial<SettingsConfig>) {
  config.set(newConfig);
  return config.store;
}
