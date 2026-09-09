# Express CEC

A small Node.js service exposing a REST API that executes CEC commands using the `cec-ctl` library. Includes a small web UI for manual triggering and adjusting settings.

## Install

Requires Node 22+, `v4l-utils`, and the current user must have permission to open `/dev/cec0` (add user to the `video` group). Designed for Raspberry Pi, but can work on other Linux devices as well.

```bash
npm install --production
node run start
```

On first run it creates `config.json` in the project's directory for settings persistance and generates an admin token required to change settings in the Web UI.

To set up as a service, copy this project to your home directory (e.g. `/home/pi/express-cec`), then:

```bash
sudo cp express-cec.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now express-cec
journalctl -u express-cec -f   # watch logs
```

Adjust `User=`/`Group=` in the service file if `pi`/`video` isn't right
for your setup (permission to open `/dev/cec0` is what matters).

## Client Implemention

### Triggering commands from Q-SYS

Q-SYS's Lua environment has a built-in `HttpClient` global -- no socket
setup needed, just:

```lua
HttpClient.Download({
  Url = "http://<ip>:8080/api/trigger?command=POWER_ON",
  Timeout = 5,
  EventHandler = function(tbl, code, data, err)
    if code == 200 then
      local result = JSON.decode(data)
      print("CEC result ok=" .. tostring(result.ok))
    else
      print("HTTP request failed: " .. tostring(err))
    end
  end,
})
```

Swap the `command` query value for whatever you want to send (`STANDBY`,
or `RAW:<cec-ctl args>` URL-encoded). No pairing, framing, or persistent
connection required -- each trigger is a one-shot GET.

### Triggering commands generally

Any HTTP client works, not just Q-SYS:

```
GET  /api/trigger?command=POWER_ON
POST /api/trigger   (JSON body: {"command": "POWER_ON"})
```

Both return the same JSON shape:

```json
{ "command": "POWER_ON", "ok": true, "code": 0, "stdout": "...", "stderr": "", "args": [...] }
```

## Command set

Only `POWER_ON` and `STANDBY`/`POWER_OFF` are wired up right now, since
those were the only ones tested against real CEC. I mapped them to
`cec-ctl`'s `--image-view-on` and `--standby` opcodes respectively, which
are the common choices for "wake/switch to me" and "power off" -- but I
don't have hardware to confirm these are exactly right for your TV. If a
command doesn't behave as expected:

1. SSH into the Pi and test the equivalent `cec-ctl` invocation directly
   (see the comment at the top of `src/cec.js` for the exact args each
   command builds). This is much faster to iterate on than going through
   the whole service.
2. Once you find args that work, update the `COMMANDS` table in
   `src/cec.js` to match.
3. For anything not in `COMMANDS` yet, use the `RAW:<args>` escape hatch
   from the UDP/web UI directly -- no code change needed, e.g.
   `RAW:--to 0 --give-power-status`.

## If CEC isn't working at all

Two very common causes, worth ruling out before debugging this code:

- **The mini-HDMI cable/adapter doesn't carry the CEC pin (pin 13).**
  Cheap mini-HDMI-to-HDMI cables and adapters frequently omit this wire.
  `cec-ctl` will run and exit successfully even though nothing reaches the
  TV -- this looks exactly like "the TV doesn't recognize the Pi". Try a
  different cable/adapter known to pass CEC.
- **CEC is disabled on the TV**, or only enabled for specific inputs.
  Check the TV's settings (branded per manufacturer: Anynet+, Bravia
  Sync, SimpLink, VIERA Link, etc.) and make sure it's on for the HDMI
  input the Pi is plugged into.

## Web UI

Visit `http://<pi-ip>:8080/` (default port). Manual trigger buttons and a
free-text command box are open to anyone on the network; changing
settings requires the admin token in the Settings section. Port changes
(UDP/web) need a service restart to take effect -- the UI will tell you
when that's the case.

## Config file fields

| Field | Meaning |
| --- | --- |
| `port` | HTTP listen port (restart required to change) |
| `cecDevice` | CEC device node, e.g. `/dev/cec0` |
| `cecAdapterType` | Logical device role this Pi claims on the CEC bus (`playback`, `tv`, `record`, `tuner`, `audio`) |
| `targetLogicalAddress` | CEC logical address commands are sent to (0 = TV) |
| `adminToken` | Shared secret required to change settings; empty = unset (first save bootstraps one) |
| `scenes` | Array of `{ name, command }` objects shown as extra buttons in the web UI                        |
