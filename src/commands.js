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
  INPUT_1: (config) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=1.0.0.0",
  ],
  INPUT_2: (config) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=2.0.0.0",
  ],
  INPUT_3: (config) => [
    "-d",
    config.cecDevice,
    "--to",
    String(config.targetLogicalAddress),
    "--active-source",
    "phys-addr=3.0.0.0",
  ],
};
COMMANDS.STANDBY = COMMANDS.POWER_OFF;
