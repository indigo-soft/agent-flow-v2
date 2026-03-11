#!/usr/bin/env bash
# env.sh — safe .env loader library for shell scripts.
# Usage: source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
#
# Available functions:
#   load_env ROOT_DIR   — loads ROOT_DIR/.env into the current environment

# load_env ROOT_DIR
# Loads variables from ROOT_DIR/.env into the current shell environment.
# - Skips blank lines and comments (lines starting with #)
# - Strips surrounding single and double quotes from values
# - Handles values that contain '=' characters correctly
# - Does NOT evaluate or execute any value content (safe against injection)
load_env() {
  local root_dir="${1:-}"

  if [ -z "$root_dir" ]; then
    log_error "load_env: ROOT_DIR argument is required."
    return 1
  fi

  local env_file="$root_dir/.env"

  if [ ! -f "$env_file" ]; then
    # .env is optional — silently skip if not present
    return 0
  fi

  log_info "📦 Loading environment variables from .env..."

  local key raw_value value

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip blank lines and comments
    [[ -z "$line" || "$line" == \#* ]] && continue

    # Split only on the FIRST '=' to correctly handle values like FOO=a=b
    key="${line%%=*}"
    raw_value="${line#*=}"

    # Skip lines without a key
    [[ -z "$key" ]] && continue

    # Strip surrounding double quotes
    value="${raw_value%\"}"
    value="${value#\"}"
    # Strip surrounding single quotes
    value="${value%\'}"
    value="${value#\'}"

    export "$key=$value"
  done < "$env_file"
}
