const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const DATA_DIR = path.join(__dirname, 'data');
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');
const LOG_FILE = path.join(DATA_DIR, 'devices.log');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get local network IP addresses for TV connection convenience
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// Load devices from disk
function loadDevices() {
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      const data = fs.readFileSync(DEVICES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading devices file:', err.message);
  }
  return {};
}

// Save devices to disk
function saveDevices(devices) {
  try {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving devices file:', err.message);
    return false;
  }
}

// Append event to log
function appendLog(entry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    console.error('Error appending log:', err.message);
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  // Global CORS Headers (essential for Smart TV web apps and cross-origin fetch)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ---------------------------------------------------------------------------
  // API Routes
  // ---------------------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    // POST endpoint: /api/device, /api/devices, /api/telemetry, /api/register
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 1e6) { // 1MB flood protection
          req.connection.destroy();
        }
      });

      req.on('end', () => {
        let payload;
        try {
          payload = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid JSON payload. Expected: { username, deviceid, version }'
          }));
          return;
        }

        const { username, deviceid, version } = payload;
        if (!deviceid && !username) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Missing required fields: username and/or deviceid are required.'
          }));
          return;
        }

        const now = new Date().toISOString();
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const key = deviceid ? String(deviceid) : `user_${username}_${Date.now()}`;

        const devices = loadDevices();
        const existing = devices[key] || {};

        const record = {
          deviceid: deviceid || existing.deviceid || 'unknown',
          username: username || existing.username || 'anonymous',
          version: version || existing.version || 'unknown',
          firstSeen: existing.firstSeen || now,
          lastSeen: now,
          lastIp: clientIp,
          userAgent: req.headers['user-agent'] || '',
          checkinCount: (existing.checkinCount || 0) + 1
        };

        devices[key] = record;
        const saved = saveDevices(devices);

        // Also append each check-in to audit log
        appendLog({
          timestamp: now,
          ip: clientIp,
          action: 'POST',
          payload
        });

        if (!saved) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Failed to write device data to server' }));
          return;
        }

        console.log(`[API POST] Stored device: ${record.deviceid} (user: ${record.username}, ver: ${record.version}) from ${clientIp}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Device data stored successfully',
          data: record
        }));
      });
      return;
    }

    // GET /api/devices or /api/device to view stored devices
    if (req.method === 'GET') {
      const devices = loadDevices();
      const deviceList = Object.values(devices);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        count: deviceList.length,
        devices: deviceList
      }, null, 2));
      return;
    }

    // Unhandled API method
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  // ---------------------------------------------------------------------------
  // Static File Serving
  // ---------------------------------------------------------------------------
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, HOST, () => {
  const ips = getLocalIpAddresses();
  console.log(`\n======================================================`);
  console.log(`  LivingPixel Server running on port ${PORT}`);
  console.log(`  Local:   http://localhost:${PORT}/`);
  ips.forEach(ip => {
    console.log(`  Network: http://${ip}:${PORT}/ (accessible from Smart TV)`);
    console.log(`  API:     http://${ip}:${PORT}/api/device`);
  });
  console.log(`======================================================\n`);
});
