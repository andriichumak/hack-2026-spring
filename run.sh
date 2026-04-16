#!/bin/sh
export PATH="/Users/andy/.nvm/versions/node/v22.20.0/bin:$PATH"
cd /Users/andy/code/mcp-apps
exec npx tsx main.ts --stdio
