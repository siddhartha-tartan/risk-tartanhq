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