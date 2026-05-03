#!/bin/bash

echo "Stopping React dev server..."
port=3001

# Kill by port using netstat
PORT_PID=$(netstat -tlnp 2>/dev/null | grep :$port | awk '{print $7}' | cut -d'/' -f1)
if [ ! -z "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null
fi

# Kill npm and node processes
pkill -f "npm" 2>/dev/null
pkill -f "node.*react-scripts" 2>/dev/null
pkill -f "start.js" 2>/dev/null

pkill -f node

echo "Done! Port 3001 should be free now."
