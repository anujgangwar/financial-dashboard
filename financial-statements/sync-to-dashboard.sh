#!/bin/bash

# Sync data.json to dashboard
SOURCE="$HOME/Desktop/financial-statements/data.json"
DEST="$HOME/GenSearchProject/financial-dashboard/public/financial-data.json"

if [ ! -f "$SOURCE" ]; then
    echo "❌ Error: data.json not found at $SOURCE"
    exit 1
fi

echo "📋 Syncing financial data..."
cp "$SOURCE" "$DEST"

if [ $? -eq 0 ]; then
    echo "✅ Data synced successfully!"
    echo "📊 Dashboard will auto-update"
    echo ""
    echo "💡 Tip: Reload your browser to see the latest data"
else
    echo "❌ Failed to sync data"
    exit 1
fi
