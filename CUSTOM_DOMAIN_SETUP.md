# Custom Domain Setup for Local Development

This guide explains how to change from `http://localhost:3000` to `https://risk.tartanhq.com` for your Next.js application during local development.

## 📋 Overview

We'll transform your development setup from:
- **Before**: `http://localhost:3000`
- **After**: `https://risk.tartanhq.com` (no port needed!)

## 🛠️ Prerequisites

- macOS with Homebrew installed
- Node.js and npm
- Next.js application running on port 3000
- Admin/sudo privileges

## 📚 Step-by-Step Guide

### Step 1: Install Required Tools

```bash
# Install mkcert for SSL certificates
brew install mkcert

# Install http-proxy for Node.js (if not already installed)
npm install http-proxy --save-dev
```

### Step 2: Set Up Hosts File

Edit your system's hosts file to map your custom domain to localhost:

```bash
# Open hosts file for editing
sudo nano /etc/hosts
```

Add this line at the end of the file:
```
127.0.0.1       risk.tartanhq.com
```

Save and exit (in nano: `Ctrl+X`, then `Y`, then `Enter`)

**Verify the change:**
```bash
cat /etc/hosts
```

### Step 3: Generate SSL Certificates

```bash
# Install the local CA
mkcert -install

# Generate certificates for your domain
mkcert risk.tartanhq.com localhost 127.0.0.1 ::1
```

This creates two files:
- `risk.tartanhq.com+3.pem` (certificate)
- `risk.tartanhq.com+3-key.pem` (private key)

### Step 4: Create HTTP Proxy Server (Optional - for HTTP only)

Create `proxy-server.js`:

```javascript
const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// Create the server that will proxy requests
const server = http.createServer((req, res) => {
  // Forward all requests to localhost:3000
  proxy.web(req, res, {
    target: 'http://localhost:3000',
    changeOrigin: true,
    headers: {
      'X-Forwarded-Host': req.headers.host,
      'X-Forwarded-Proto': 'http'
    }
  });
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Proxy error: ' + err.message);
});

// Start the proxy server on port 80
const PORT = 80;
server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Access your app at: http://risk.tartanhq.com`);
});
```

### Step 5: Create HTTPS Proxy Server

Create `https-proxy-server.js`:

```javascript
const https = require('https');
const fs = require('fs');
const httpProxy = require('http-proxy');

// Read the SSL certificates
const options = {
  key: fs.readFileSync('./risk.tartanhq.com+3-key.pem'),
  cert: fs.readFileSync('./risk.tartanhq.com+3.pem')
};

// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// Create the HTTPS server that will proxy requests
const server = https.createServer(options, (req, res) => {
  // Forward all requests to localhost:3000
  proxy.web(req, res, {
    target: 'http://localhost:3000',
    changeOrigin: true,
    headers: {
      'X-Forwarded-Host': req.headers.host,
      'X-Forwarded-Proto': 'https'
    }
  });
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Proxy error: ' + err.message);
});

// Start the HTTPS proxy server on port 443
const PORT = 443;
server.listen(PORT, () => {
  console.log(`HTTPS Proxy server running on port ${PORT}`);
  console.log(`Access your app at: https://risk.tartanhq.com`);
  console.log(`Certificates loaded successfully!`);
});
```

### Step 6: Update Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Allow custom domain in development
  experimental: {
    allowedDevOrigins: ['risk.tartanhq.com'],
  },
  // Security headers for HTTPS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Forwarded-Proto',
            value: 'https',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Step 7: Update Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --port 3000 --hostname 0.0.0.0",
    "proxy": "sudo node proxy-server.js",
    "https-proxy": "sudo node https-proxy-server.js"
  }
}
```

### Step 8: Create Startup Scripts

#### HTTP Startup Script (`start-dev.sh`)

```bash
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
```

#### HTTPS Startup Script (`start-https-dev.sh`)

```bash
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
```

Make scripts executable:
```bash
chmod +x start-dev.sh
chmod +x start-https-dev.sh
```

## 🚀 Usage

### Option 1: HTTP Access (Port 80)
```bash
# Start both servers
./start-dev.sh

# Access your app at:
# http://risk.tartanhq.com
```

### Option 2: HTTPS Access (Port 443) - Recommended
```bash
# Start both servers
./start-https-dev.sh

# Access your app at:
# https://risk.tartanhq.com
```

### Option 3: Manual Steps
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start HTTPS proxy
npm run https-proxy
```

## 🔧 File Structure

After setup, your project should have these additional files:

```
your-project/
├── proxy-server.js
├── https-proxy-server.js
├── start-dev.sh
├── start-https-dev.sh
├── risk.tartanhq.com+3.pem
├── risk.tartanhq.com+3-key.pem
├── next.config.js (updated)
└── package.json (updated)
```

## 🔍 Verification

### Check Hosts File
```bash
cat /etc/hosts | grep risk.tartanhq.com
# Should show: 127.0.0.1       risk.tartanhq.com
```

### Check Certificate Files
```bash
ls -la *.pem
# Should show both certificate files
```

### Check Running Servers
```bash
# Check Next.js (port 3000)
lsof -i :3000

# Check HTTPS proxy (port 443)
lsof -i :443
```

### Test Domain Resolution
```bash
ping risk.tartanhq.com
# Should ping 127.0.0.1
```

## 🎯 Expected Results

- ✅ **Green padlock** in browser address bar
- ✅ **No port number** needed in URL
- ✅ **Custom domain** instead of localhost
- ✅ **SSL certificate** trusted by browser
- ✅ **All functionality** works exactly the same

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill processes on specific ports
sudo lsof -ti:80 | xargs sudo kill -9
sudo lsof -ti:443 | xargs sudo kill -9
sudo lsof -ti:3000 | xargs sudo kill -9
```

### Certificate Issues
```bash
# Reinstall CA
mkcert -install

# Regenerate certificates
rm *.pem
mkcert risk.tartanhq.com localhost 127.0.0.1 ::1
```

### Browser Shows "Not Secure"
1. Make sure `mkcert -install` was run
2. Restart your browser
3. Clear browser cache/cookies
4. Check that certificates exist in project root

### Proxy Errors
- Ensure Next.js is running on port 3000 first
- Check that proxy server has correct file paths to certificates
- Verify sudo permissions for ports 80/443

## 🔐 Security Notes

- **Local Development Only**: These certificates only work on your machine
- **Certificate Expiry**: Certificates expire on October 18, 2027
- **Sudo Required**: Ports 80 and 443 require administrator privileges
- **Firewall**: Your system firewall may need configuration for ports 80/443

## 🎉 Benefits

- **Professional URLs** for development
- **HTTPS testing** in development environment
- **No CORS issues** with custom domains
- **Easy client demonstrations** with clean URLs
- **Production-like setup** for testing

## 📝 Notes

- The `mkcert` tool creates locally-trusted certificates
- Proxy servers forward requests from ports 80/443 to 3000
- Hosts file maps custom domain to localhost (127.0.0.1)
- Next.js configuration allows cross-origin requests from custom domain

This setup gives you a production-like development environment with HTTPS and custom domains! 