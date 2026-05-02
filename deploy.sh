#!/bin/bash

# deploy.sh - Deploy Vite weather app
# Usage:
#   ./deploy.sh npm              → run local dev server
#   ./deploy.sh apache           → build and deploy to Apache
#   ./deploy.sh github "message" → build for GitHub and push source

set -e

PROJECT_DIR="$(pwd)"
BUILD_DIR="$PROJECT_DIR/dist"
TARGET_DIR="/mnt/d/Apache/html/sandbox/weather-air"
BACKUP_BASE="/mnt/d/Apache/html/sandbox/weather-air-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_BASE/$TIMESTAMP"

# ── npm mode ──────────────────────────────────────────────────────────────────
if [ "$1" = "npm" ]; then
  echo "🔧 Starting local dev server..."
  npm run dev -- --mode npm
  exit 0
fi

# ── github mode ───────────────────────────────────────────────────────────────
if [ "$1" = "github" ]; then
  COMMIT_MSG="${2:-"Update exercise app: $TIMESTAMP"}"

  echo "🚀 Starting GitHub Deployment..."

  echo "📦 Building for GitHub..."
  npm run build:github

  echo "📝 Committing with message: $COMMIT_MSG"
  git add .

  if ! git diff-index --quiet HEAD --; then
    git commit -m "$COMMIT_MSG"
    git push origin main
    echo "✅ Pushed to GitHub! Actions will handle the deployment."
    echo "Navigate to https://hpy2github.github.io/weatherair/"  # ← fixed repo name
  else
    echo "⚠️  No changes detected, nothing to commit."
  fi
  exit 0
fi

# ── apache mode ───────────────────────────────────────────────────────────────
if [ "$1" = "apache" ]; then
  echo "🚀 Starting Apache deployment process..."
  echo "📁 Project dir : $PROJECT_DIR"
  echo "📦 Build dir   : $BUILD_DIR"
  echo "🎯 Target dir  : $TARGET_DIR"

  echo ""
  echo "1. Backing up existing deployment..."
  if [ -d "$TARGET_DIR" ]; then
      mkdir -p "$BACKUP_DIR"
      cp -r "$TARGET_DIR"/. "$BACKUP_DIR"/
      echo "   ✅ Backup saved to: $BACKUP_DIR"
  else
      echo "   ⚠️  No existing deployment found — skipping backup"
      mkdir -p "$TARGET_DIR"
  fi

  echo ""
  echo "2. Building..."
  npm run build:apache
  echo "   ✅ Build complete"

  echo ""
  echo "3. Copying dist → $TARGET_DIR..."
  cp -r "$BUILD_DIR"/* "$TARGET_DIR"/

  echo "4. Syncing images..."
  mkdir -p "$TARGET_DIR/images"
  cp -rf ./public/. "$TARGET_DIR/."  # ← removed -u, changed glob to /. to include dotfiles

  echo ""
  echo "5. Setting permissions..."
  chmod -R 755 "$TARGET_DIR"

  echo ""
  echo "🎉 Deployment complete!"
  echo "   Live at : http://localhost/sandbox/weather-air/"
  echo "   Backup  : $BACKUP_DIR"
  exit 0
fi

# ── no valid mode ─────────────────────────────────────────────────────────────
echo "Usage:"
echo "  ./deploy.sh npm              → run local dev server"
echo "  ./deploy.sh apache           → build and deploy to Apache"
echo "  ./deploy.sh github \"message\" → build for GitHub and push source"
exit 1
