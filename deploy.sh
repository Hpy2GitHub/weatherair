#!/bin/bash
# deploy.sh - Deploy Vite weather app
# Usage:
# ./deploy.sh npm          → local dev
# ./deploy.sh apache       → build + deploy to Apache
# ./deploy.sh github "msg" → build for GitHub

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
  npm run dev
  exit 0
fi

# ── github mode ───────────────────────────────────────────────────────────────
if [ "$1" = "github" ]; then
  COMMIT_MSG="${2:-"Update weather app: $TIMESTAMP"}"
  echo "🚀 GitHub Deployment..."
  npm run build:github
  git add .
  if ! git diff-index --quiet HEAD --; then
    git commit -m "$COMMIT_MSG"
    git push origin main
    echo "✅ Pushed to GitHub!"
  else
    echo "⚠️ No changes."
  fi
  exit 0
fi

# ── apache mode ───────────────────────────────────────────────────────────────
if [ "$1" = "apache" ]; then
  echo "🚀 Starting Apache deployment..."

  # === IMPORTANT: Set correct base path for subdirectory ===
  APACHE_BASE="/sandbox/weather-air/"

  echo "📁 Project dir : $PROJECT_DIR"
  echo "🎯 Target dir  : $TARGET_DIR"
  echo "🔗 Base path   : $APACHE_BASE"
  echo ""

  # 1. Backup
  echo "1. Backing up..."
  if [ -d "$TARGET_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -a "$TARGET_DIR"/. "$BACKUP_DIR"/
    echo "✅ Backup created: $BACKUP_DIR"
  else
    mkdir -p "$TARGET_DIR"
  fi

  # 2. Build with correct base path
  echo ""
  echo "2. Building with base = $APACHE_BASE ..."
  npm run build -- --base="$APACHE_BASE"
  
  echo "✅ Build complete"

  # 3. Deploy
  echo ""
  echo "3. Deploying files..."
  rsync -a --delete "$BUILD_DIR"/ "$TARGET_DIR"/

  # 4. Permissions (important for mounted drives)
  echo ""
  echo "4. Setting permissions..."
  find "$TARGET_DIR" -type d -exec chmod 755 {} \;
  find "$TARGET_DIR" -type f -exec chmod 644 {} \;

  echo ""
  echo "🎉 Deployment successful!"
  echo "🌐 Live at: http://localhost/sandbox/weather-air/"
  echo "💾 Backup : $BACKUP_DIR"
  exit 0
fi

echo "❌ Invalid command. Use: npm | apache | github"
exit 1
