#!/bin/bash

# ATTENTION! Keep this script idempotent

echo "Git configuration..."
git remote add t3 https://github.com/t3-oss/create-t3-turbo.git
git config pull.rebase true
git config branch.autoSetupRebase always
echo "DONE"


echo "Git rebase from t3..."
git fetch t3 && git rebase -s recursive -X theirs t3/main
echo "DONE"

echo "Remove LICENSE."
rm LICENSE

echo "Node packages install..."
nvm install "$(jq -r '.engines.node' package.json | tr -d '^')"
corepack enable && corepack prepare pnpm@10.19.0 --activate # TODO: dynamic version
pnpm install
pnpm format:fix
pnpm lint:fix
echo "DONE"

echo "Setup DB."
pnpm db:push
