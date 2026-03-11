#!/usr/bin/env bash
# colors.sh — colored output library for shell scripts.
# Usage: source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
#
# Available functions:
#   log_error   "message"  — red   + ❌ prefix  (stderr)
#   log_success "message"  — green + ✔  prefix  (stdout)
#   log_info    "message"  — yellow             (stdout)
#   log_text    "message"  — white              (stdout)
#   log_step    "message"  — yellow + 🔍 prefix (stdout)

# Detect whether the terminal supports colors.
# Disable colors when output is redirected to a file or pipe.
_colors_supported() {
  [[ -t 1 ]] && [[ "${TERM:-}" != "dumb" ]] && [[ "${NO_COLOR:-}" != "1" ]]
}

if _colors_supported; then
  _RED='\033[0;31m'
  _GREEN='\033[0;32m'
  _YELLOW='\033[0;33m'
  _WHITE='\033[0;97m'
  _RESET='\033[0m'
else
  _RED=''
  _GREEN=''
  _YELLOW=''
  _WHITE=''
  _RESET=''
fi

# log_error MESSAGE
# Prints a red error message with ❌ prefix to stderr.
log_error() {
  echo -e "${_RED}❌ ${1}${_RESET}" >&2
}

# log_success MESSAGE
# Prints a green success message with ✔ prefix to stdout.
log_success() {
  echo -e "${_GREEN}✔ ${1}${_RESET}"
}

# log_info MESSAGE
# Prints a yellow informational message to stdout.
log_info() {
  echo -e "${_YELLOW}${1}${_RESET}"
}

# log_text MESSAGE
# Prints a plain white message to stdout.
log_text() {
  echo -e "${_WHITE}${1}${_RESET}"
}

# log_step MESSAGE
# Prints a yellow step/check message with 🔍 prefix to stdout.
log_step() {
  echo -e "${_YELLOW}🔍 ${1}${_RESET}"
}
