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