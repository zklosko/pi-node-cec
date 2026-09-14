#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/home/$USER/rest-cec"

LATEST_URL=$(curl -s "https://api.github.com/repos/zklosko/express-cec/releases/latest" \
  | grep browser_download_url | cut -d '"' -f4)

mkdir -p "$INSTALL_DIR"
curl -L "$LATEST_URL" | tar xz -C "$INSTALL_DIR"

cd "$INSTALL_DIR"
npm install --omit=dev

sudo cp rest-cec.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now rest-cec