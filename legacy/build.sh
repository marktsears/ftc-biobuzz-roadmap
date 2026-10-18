#!/bin/sh
# Assemble src/ into a single self-contained index.html
cd "$(dirname "$0")"
{ cat src/01-head.html src/02-body.html src/03-data-core.js src/04-data-weeks-1.js src/05-data-weeks-2.js src/06-app.js; printf '</script>\n</body>\n</html>\n'; } > index.html
echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes)"
