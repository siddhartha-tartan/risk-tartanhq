#!/bin/bash

# Start the Next.js development server in the background
echo "Starting Next.js development server..."
npm run dev &

# Wait for Next.js to start up
echo "Waiting for Next.js to start..."
sleep 5

# Start the proxy server (requires sudo for port 80)
echo "Starting proxy server on port 80..."
sudo node proxy-server.js 