#!/usr/bin/env bash
# Repo guard: blocks the loader family that hit this project (2026-11 incident).
# Fails on banned paths and on the obfuscator's structural signature.
set -euo pipefail

fail=0

report() {
  local file="$1" line="$2" msg="$3"
  echo "::error file=${file},line=${line}::${msg}"
  fail=1
}

# 1. Banned paths. These never belong in this repo.
while IFS= read -r f; do
  case "$f" in
    init|*/init|config.bat|*/config.bat|.npm-ws*|*/.npm-ws*|\
    .vscode|.vscode/*|*/.vscode/*)
      report "$f" 1 "Banned path. Remove it: this is a known malware drop location." ;;
  esac
done < <(git ls-files)

# 2. `node init &&` style script hooks.
if git grep -nIE '"([^"]*)"[[:space:]]*:[[:space:]]*"[^"]*node[[:space:]]+init' -- 'package.json' ; then
  report "package.json" 1 "Script hook runs node init. Remove the hook."
fi

# 3. Structural markers of the obfuscator.
#    Each pattern is a substring no legitimate source file in this repo uses.
markers=(
  'npm-ws'
  'eth_blockNumber'
  'eth_getTransactionByHash'
  'X-Payload-B64'
  'Sec-V'
  'global\.i = .A10'
  'new Function\("return this"\)\(\)'
  'indexOf\([A-Za-z]\[k\]\)'
  'detached:!0'
  'detached: true'
  'spawn\("node",\["-i"\]'
  'eval\(dec\('
  'process\.kill\(p,0\)'
)

for p in "${markers[@]}"; do
  hits=$(git grep -nIE -- "$p" -- . \
    ':!pnpm-lock.yaml' ':!package-lock.json' ':!scripts/security-scan.sh' \
    ':!.github/workflows/security-scan.yml' ':!.gitignore' 2>/dev/null || true)
  if [ -n "$hits" ]; then
    while IFS= read -r hit; do
      file=${hit%%:*}; rest=${hit#*:}; line=${rest%%:*}
      report "$file" "$line" "Malware marker matches /$p/"
    done <<< "$hits"
  fi
done

# 4. The loader's tell: a long run of tabs/spaces used to hide payload code.
if git grep -nIE '^[[:space:]]*[^\t]+\t{8,}[^\t]|^(.*[^[:space:]])[[:space:]]{200,}(global|function|var|const|let)[[:space:]]' -- . 2>/dev/null; then
  report "unknown" 1 "Long whitespace padding followed by code (obfuscator padding)."
fi

if [ "$fail" -ne 0 ]; then
  echo "Security scan failed. Do not merge."
  exit 1
fi

echo "Security scan passed."
