#!/bin/sh
export PATH="/Users/andy/.nvm/versions/node/v22.20.0/bin:$PATH"
exec npx mcp-remote http://localhost:3001/mcp
