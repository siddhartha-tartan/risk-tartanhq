#!/bin/bash

# Start the Next.js development server in the background
echo "Starting Next.js development server..."
npm run dev &

# Wait for Next.js to start up
echo "Waiting for Next.js to start..."
sleep 5

# Start the HTTPS proxy server (requires sudo for port 443)
echo "Starting HTTPS proxy server on port 443..."
sudo node https-proxy-server.js 