#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TS_SCRIPT="$SCRIPT_DIR/find-buddy.ts"

# 尝试找到 bun：先检查 PATH，再检查常见安装位置
resolve_bun() {
  # 1. 已在 PATH 中
  if command -v bun &>/dev/null; then
    command -v bun
    return
  fi
  # 2. 常见安装位置
  local candidates=(
    "$HOME/.bun/bin/bun"
    "$HOME/.local/bin/bun"
    "/usr/local/bin/bun"
    "/opt/homebrew/bin/bun"
  )
  for p in "${candidates[@]}"; do
    if [ -x "$p" ]; then
      echo "$p"
      return
    fi
  done
  return 1
}

BUN_PATH=$(resolve_bun) || true

if [ -z "$BUN_PATH" ]; then
  echo "bun 未安装，正在安装..."
  curl -fsSL https://bun.sh/install | bash
  BUN_PATH="$HOME/.bun/bin/bun"
  if [ ! -x "$BUN_PATH" ]; then
    echo "安装失败，请手动安装 bun: https://bun.sh"
    exit 1
  fi
  echo "bun 安装完成"
fi

exec "$BUN_PATH" run "$TS_SCRIPT" "$@"
