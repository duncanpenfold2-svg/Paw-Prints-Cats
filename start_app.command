#!/bin/bash
cd "$(dirname "$0")" || exit 1
echo "Starting Paw Prints — Cats..."
echo "Keep this window open while using the app."
echo ""
echo "Opening app at http://localhost:8002"
open "http://localhost:8002"
python3 -m http.server 8002
