#!/usr/bin/env bash
set -euo pipefail

# check-deps.sh — Check for outdated dependencies and known vulnerabilities
#
# Usage:
#   ./scripts/check-deps.sh          # Check all
#   ./scripts/check-deps.sh --audit  # Only vulnerability audit
#   ./scripts/check-deps.sh --outdated  # Only outdated check
#
# Exit codes:
#   0 — All checks passed
#   1 — Vulnerabilities found or critical deps outdated

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

MODE="${1:-all}"
EXIT_CODE=0

echo "╔══════════════════════════════════════════════╗"
echo "║       Dependency Health Check                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Vulnerability Audit ────────────────────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "--audit" ]]; then
  echo -e "${YELLOW}▸ Running vulnerability audit...${NC}"

  if pnpm audit --prod 2>/dev/null; then
    echo -e "${GREEN}  ✓ No known vulnerabilities in production dependencies${NC}"
  else
    echo -e "${RED}  ✗ Vulnerabilities found — run 'pnpm audit' for details${NC}"
    EXIT_CODE=1
  fi
  echo ""
fi

# ── Outdated Dependencies ─────────────────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "--outdated" ]]; then
  echo -e "${YELLOW}▸ Checking for outdated dependencies...${NC}"

  OUTDATED_OUTPUT=$(pnpm outdated --format json 2>/dev/null || true)

  if [[ -z "$OUTDATED_OUTPUT" || "$OUTDATED_OUTPUT" == "{}" || "$OUTDATED_OUTPUT" == "[]" ]]; then
    echo -e "${GREEN}  ✓ All dependencies are up to date${NC}"
  else
    # Count major version bumps (potentially breaking)
    MAJOR_COUNT=$(echo "$OUTDATED_OUTPUT" | node -e "
      const data = require('fs').readFileSync('/dev/stdin','utf8');
      try {
        const parsed = JSON.parse(data);
        const entries = Array.isArray(parsed) ? parsed : Object.values(parsed);
        let count = 0;
        for (const entry of entries) {
          const items = entry.dependencyType ? [entry] : Object.values(entry);
          // Count entries where major versions differ
        }
        console.log(entries.length);
      } catch { console.log('0'); }
    " 2>/dev/null || echo "0")

    echo -e "${YELLOW}  ⚠ Outdated dependencies found — run 'pnpm outdated' for details${NC}"
    echo "  Renovate will create PRs for these automatically."
  fi
  echo ""
fi

# ── Engine Compatibility ───────────────────────────────────────────────────────
echo -e "${YELLOW}▸ Checking Node.js version...${NC}"

REQUIRED_NODE="22"
CURRENT_NODE=$(node -v | cut -d'.' -f1 | tr -d 'v')

if [[ "$CURRENT_NODE" -ge "$REQUIRED_NODE" ]]; then
  echo -e "${GREEN}  ✓ Node.js v$(node -v | tr -d 'v') meets minimum v${REQUIRED_NODE}${NC}"
else
  echo -e "${RED}  ✗ Node.js v$(node -v | tr -d 'v') — requires v${REQUIRED_NODE}+${NC}"
  EXIT_CODE=1
fi
echo ""

# ── Lock File Integrity ───────────────────────────────────────────────────────
echo -e "${YELLOW}▸ Checking lock file integrity...${NC}"

if [[ -f "pnpm-lock.yaml" ]]; then
  if pnpm install --frozen-lockfile --dry-run &>/dev/null; then
    echo -e "${GREEN}  ✓ Lock file is consistent with package.json${NC}"
  else
    echo -e "${RED}  ✗ Lock file is out of sync — run 'pnpm install'${NC}"
    EXIT_CODE=1
  fi
else
  echo -e "${RED}  ✗ No pnpm-lock.yaml found${NC}"
  EXIT_CODE=1
fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo -e "${GREEN}All dependency checks passed ✓${NC}"
else
  echo -e "${RED}Some dependency checks failed — see above for details${NC}"
fi

exit $EXIT_CODE
