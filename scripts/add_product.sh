#!/usr/bin/env bash
# Usage:
#   ./scripts/add_product.sh path/to/new_product.json
# The file must contain ONE valid product object with fields:
# title, brand, category, description, price, tags[], verified(bool), image, url

set -euo pipefail

NEW_ITEM_FILE="${1:-}"

if [[ -z "$NEW_ITEM_FILE" || ! -f "$NEW_ITEM_FILE" ]]; then
  echo "Error: supply a path to a JSON file with one product object." >&2
  exit 1
fi

# Validate JSON object is valid
jq -e type "$NEW_ITEM_FILE" >/dev/null

# Ensure products.json exists
if [[ ! -f products.json ]]; then
  echo "Error: products.json not found in repo root." >&2
  exit 1
fi

# Validate products.json is an array
jq -e 'type == "array"' products.json >/dev/null

# Append item if it doesn't duplicate title+brand
TITLE=$(jq -r '.title' "$NEW_ITEM_FILE")
BRAND=$(jq -r '.brand' "$NEW_ITEM_FILE")

TMP_OUT="$(mktemp)"
jq --arg t "$TITLE" --arg b "$BRAND" '
  if any(.[]; .title == $t and .brand == $b) then
    halt_error(2; "Duplicate product (same title & brand) detected")
  else
    . + [ input ]
  end
' products.json "$NEW_ITEM_FILE" > "$TMP_OUT"

mv "$TMP_OUT" products.json

echo "✅ Added: $TITLE ($BRAND)"
