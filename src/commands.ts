import type { SettingsConfig } from "./config.js";

type CommandBuilder = (config: SettingsConfig) => string[];

const powerOff: CommandBuilder = (config) => [
  "-d",
  config.cecDevice,
  "--to",
  String(config.targetLogicalAddress),
  "--standby",
];

export const COMMANDS: Record<string, CommandBuilder> = {
  POWER_ON: (config: SettingsConfig) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--image-view-on",
  ],
  POWER_OFF: powerOff,
  STANDBY: powerOff,
  INPUT_1: (config: SettingsConfig) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=1.0.0.0",
  ],
  INPUT_2: (config: SettingsConfig) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=2.0.0.0",
  ],
  INPUT_3: (config: SettingsConfig) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=3.0.0.0",
  ],
};
