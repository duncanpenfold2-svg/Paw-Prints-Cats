set projectPath to "/Users/owner/cat-tracker"
set launchCmd to "cd " & quoted form of projectPath & "; (lsof -i :8002 -sTCP:LISTEN >/dev/null 2>&1 || nohup python3 -m http.server 8002 >/tmp/cat-tracker-server.log 2>&1 &)"
do shell script launchCmd
delay 1
open location "http://localhost:8002"
display notification "Paw Prints — Cats is ready in your browser." with title "Paw Prints — Cats"
