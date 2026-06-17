#!/bin/bash
echo "==== Verify served main.*.js ===="
curl -s https://jigou.matux.tech/app/ | grep -oE 'main\.[a-f0-9]+\.js' | head -3

echo ""
echo "==== Check new main.js in mounted dir ===="
ls -la /opt/openmt/backend/deploy/frontend/main.*.js

echo ""
echo "==== Quick HTTP HEAD on new main.js ===="
MAIN=$(ls /opt/openmt/backend/deploy/frontend/main.*.js | xargs -n1 basename | head -1)
echo "Main: $MAIN"
curl -sI "https://jigou.matux.tech/app/$MAIN" | head -5

echo ""
echo "==== Check critical unresolved variables in served main ===="
curl -s "https://jigou.matux.tech/app/$MAIN" | grep -c "color:\$" || echo "0"
echo "expected: 0"
