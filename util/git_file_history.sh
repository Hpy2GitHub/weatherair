#!/bin/bash

echo "don't run without editing"
exit 1

FILE="App.css"  # Change this or pass as parameter

# If argument provided, use it instead
if [ ! -z "$1" ]; then
    FILE="$1"
fi

echo "==================================="
echo "History for: $FILE"
echo "==================================="
echo ""

# Option 1: Simple format you requested
echo "Simple format:"
echo "-----------------------------------"
git log --format="$FILE %h %s" -- "$FILE"

echo ""
echo "Option 2: With dates"
echo "-----------------------------------"
git log --format="$FILE %h %ad %s" --date=short -- "$FILE"

echo ""
echo "Option 3: With author initials"
echo "-----------------------------------"
git log --format="$FILE %h %an: %s" -- "$FILE"

echo ""
echo "Option 4: Just commit hashes and messages (pipeline friendly)"
echo "-----------------------------------"
git log --format="%h %s" -- "$FILE"
