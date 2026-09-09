# Express CEC

A small Node.js service exposing a REST API that executes CEC commands using the `cec-ctl` library. Includes a web UI on port `8080` for manual triggering and adjusting settings.

## Install

Requires Node 22+, `v4l-utils`, and the current user must have permission to open `/dev/cec0` (add user to the `video` group). Designed for Raspberry Pi, but can work on other Linux devices as well.

```bash
npm install --omit=dev
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

## Client Implemention

```http
GET  /api/trigger?command=POWER_ON
POST /api/trigger   (JSON body: {"command": "POWER_ON"})
```

Returns the following JSON:

```json
{ "command": "POWER_ON", "ok": true, "code": 0, "stdout": "...", "stderr": "", "args": [...] }
```

### Triggering commands from Q-SYS

Q-SYS's Lua environment has a built-in `HttpClient` global:

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

## Troubleshooting

- **The mini-HDMI cable/adapter doesn't carry the CEC pin (pin 13).**
  Cheap mini-HDMI-to-HDMI cables and adapters frequently omit this wire.
  `cec-ctl` will run and exit successfully even though nothing reaches the
  TV -- this looks exactly like "the TV doesn't recognize the Pi". Try a
  different cable/adapter known to pass CEC.
- **CEC is disabled on the TV**, or only enabled for specific inputs.
  Check the TV's settings (branded per manufacturer: Anynet+, Bravia
  Sync, SimpLink, VIERA Link, etc.) and make sure it's on for the HDMI
  input the Pi is plugged into.
