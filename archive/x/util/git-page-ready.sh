#!/usr/bin/bash

# Ensure we are using the correct name
REPO="Hpy2GitHub/weatherair"

echo "🚀 Setting up GitHub Pages for $REPO..."

# 1. Ensure the repo is Public
gh repo edit "$REPO" --visibility public

# 2. Enable GitHub Pages using the correct object syntax
# This avoids the "not of type object" 422 error
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/pages" \
  -f "source[branch]=main" \
  -f "source[path]=/"
