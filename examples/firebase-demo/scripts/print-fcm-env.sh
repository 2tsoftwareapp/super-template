#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <path-to-firebase-adminsdk.json>"
  exit 1
fi

KEY_FILE="$1"

if [[ ! -f "$KEY_FILE" ]]; then
  echo "File not found: $KEY_FILE"
  exit 1
fi

node -e "
const fs = require('fs');
const key = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const privateKey = key.private_key.replace(/\n/g, '\\\\n');
console.log('FCM_PROJECT_ID=' + key.project_id);
console.log('FCM_CLIENT_EMAIL=' + key.client_email);
console.log('FCM_PRIVATE_KEY=\"' + privateKey + '\"');
" "$KEY_FILE"
