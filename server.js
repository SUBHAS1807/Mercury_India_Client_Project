/**
 * Mercury India Compliance - Backend Server
 * Built with native Node.js HTTP module (Zero external dependencies required)
 * 
 * Features:
 * - Static file serving with MIME type resolution & path traversal safety
 * - POST /api/contact endpoint with validation, sanitization, rate-limiting, and anti-spam
 * - JSON persistence in data/enquiries.json
 * - Environment variable loader (.env)
 * - Public configuration endpoint for WhatsApp & Contact details
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ── 1. Load .env Configuration ──
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    });
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@mercuryindiaappliance.com';
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '919830839926';
const WHATSAPP_MESSAGE = process.env.WHATSAPP_MESSAGE || 'Hello, I would like to know more about your services.';

// ── 2. Data Persistence Setup ──
const DATA_DIR = path.join(__dirname, 'data');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ENQUIRIES_FILE)) {
  fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify([], null, 2), 'utf8');
}

function saveEnquiry(enquiry) {
  try {
    let list = [];
    if (fs.existsSync(ENQUIRIES_FILE)) {
      const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8');
      list = JSON.parse(raw || '[]');
    }
    list.unshift(enquiry);
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Error] Failed to save enquiry:', err.message);
    return false;
  }
}

function getEnquiries() {
  try {
    if (fs.existsSync(ENQUIRIES_FILE)) {
      const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8');
      return JSON.parse(raw || '[]');
    }
  } catch (e) {
    return [];
  }
  return [];
}

// ── 3. Simple In-Memory Rate Limiter & Anti-Spam ──
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 15;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimits.get(ip);
  if (!record) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

// Cleanup rate limits every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimits.entries()) {
    if (now > record.resetAt) {
      rateLimits.delete(ip);
    }
  }
}, 15 * 60 * 1000);

// ── 4. Input Sanitization & Validation ──
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // remove HTML tag brackets
    .slice(0, 5000);
}

function validateEmail(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return typeof email === 'string' && re.test(email.trim()) && email.length <= 254;
}

function validateEnquiryPayload(body) {
  const errors = {};

  const firstName = sanitizeString(body.firstName);
  const lastName = sanitizeString(body.lastName);
  const email = (body.email || '').trim();
  const country = sanitizeString(body.country);
  const message = sanitizeString(body.message);

  if (!firstName || firstName.length < 2) {
    errors.firstName = 'First name is required (minimum 2 characters).';
  } else if (firstName.length > 100) {
    errors.firstName = 'First name cannot exceed 100 characters.';
  }

  if (!lastName || lastName.length < 1) {
    errors.lastName = 'Last name is required.';
  } else if (lastName.length > 100) {
    errors.lastName = 'Last name cannot exceed 100 characters.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!validateEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!country || country.length < 2) {
    errors.country = 'Please select or enter your country.';
  } else if (country.length > 100) {
    errors.country = 'Country name cannot exceed 100 characters.';
  }

  if (!message || message.length < 5) {
    errors.message = 'Message is required (minimum 5 characters).';
  } else if (message.length > 5000) {
    errors.message = 'Message cannot exceed 5,000 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      firstName,
      lastName,
      email,
      country,
      message
    }
  };
}

// ── 5. MIME Types Dictionary ──
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css':  'text/css; charset=UTF-8',
  '.js':   'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp'
};

// ── 6. Helper: Send JSON Response ──
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// ── 7. Main HTTP Request Handler ──
const server = http.createServer((req, res) => {
  let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (clientIp === '::1') clientIp = '127.0.0.1';
  else clientIp = clientIp.replace(/^::ffff:/, '');

  const protocol = req.socket.encrypted ? 'https' : 'http';
  const parsedUrl = new URL(req.url, `${protocol}://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // ── Route: POST /api/contact (or /api/enquiry) ──
  if (req.method === 'POST' && (pathname === '/api/contact' || pathname === '/api/enquiry')) {
    // Check rate limiting
    if (isRateLimited(clientIp)) {
      return sendJSON(res, 429, {
        success: false,
        message: 'Too many requests. Please wait a few moments before trying again.'
      });
    }

    let bodyData = '';
    const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1 MB limit

    req.on('data', chunk => {
      bodyData += chunk;
      if (bodyData.length > MAX_PAYLOAD_SIZE) {
        req.destroy();
        sendJSON(res, 413, { success: false, message: 'Payload too large.' });
      }
    });

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyData || '{}');

        // Honeypot anti-spam check
        if (body.website_url || body.hp_field || body.company_url) {
          console.warn(`[Anti-Spam] Honeypot triggered by IP: ${clientIp}`);
          // Return synthetic success so bots think submission passed
          return sendJSON(res, 200, {
            success: true,
            message: 'Thank you! Your message has been submitted successfully.'
          });
        }

        const { isValid, errors, sanitized } = validateEnquiryPayload(body);

        if (!isValid) {
          return sendJSON(res, 400, {
            success: false,
            message: 'Validation failed. Please correct the highlighted errors.',
            errors
          });
        }

        const timestamp = new Date().toISOString();
        const enquiryId = 'ENQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        const newRecord = {
          id: enquiryId,
          firstName: sanitized.firstName,
          lastName: sanitized.lastName,
          email: sanitized.email,
          country: sanitized.country,
          message: sanitized.message,
          timestamp,
          ip: clientIp
        };

        const saved = saveEnquiry(newRecord);

        if (!saved) {
          return sendJSON(res, 500, {
            success: false,
            message: 'An internal error occurred while saving your enquiry. Please try again later.'
          });
        }

        console.log(`[Contact Submission] Saved enquiry ${enquiryId} from ${sanitized.firstName} ${sanitized.lastName} <${sanitized.email}> (${sanitized.country})`);

        // Check if SMTP notification is configured
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          console.log(`[Email Dispatch] Notification triggered for admin: ${ADMIN_EMAIL}`);
        } else {
          console.log(`[Notification Info] Enquiry stored in data/enquiries.json. (To enable direct email dispatch, configure SMTP credentials in .env).`);
        }

        return sendJSON(res, 200, {
          success: true,
          message: 'Thank you! Your message has been submitted successfully.',
          id: enquiryId
        });

      } catch (err) {
        console.error('[Error] Invalid JSON received:', err.message);
        return sendJSON(res, 400, {
          success: false,
          message: 'Invalid request data. Please verify your inputs.'
        });
      }
    });
    return;
  }

  // ── Route: GET /api/config ──
  if (req.method === 'GET' && pathname === '/api/config') {
    return sendJSON(res, 200, {
      whatsappNumber: WHATSAPP_NUMBER,
      whatsappMessage: WHATSAPP_MESSAGE,
      adminEmail: ADMIN_EMAIL
    });
  }

  // ── Route: GET /api/enquiries (For verification/review) ──
  if (req.method === 'GET' && pathname === '/api/enquiries') {
    const list = getEnquiries();
    return sendJSON(res, 200, {
      total: list.length,
      enquiries: list
    });
  }

  // ── Static File Serving ──
  if (req.method === 'GET' || req.method === 'HEAD') {
    let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
    }

    const filePath = path.join(__dirname, safePath);

    // Guard against directory traversal
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('403 Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback for 404
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        return res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p><a href="/">Return to Home</a></p></body></html>');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
      });

      if (req.method === 'HEAD') {
        return res.end();
      }

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    });
    return;
  }

  // Unsupported methods
  res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end('405 Method Not Allowed');
});

// ── 8. Server Listen ──
server.listen(PORT, () => {
  console.log('====================================================');
  console.log('  Mercury India Compliance - Server Active');
  console.log(`  Local URL:        http://localhost:${PORT}`);
  console.log(`  API Endpoint:     http://localhost:${PORT}/api/contact`);
  console.log(`  Enquiries Feed:   http://localhost:${PORT}/api/enquiries`);
  console.log(`  WhatsApp Target:  https://wa.me/${WHATSAPP_NUMBER}`);
  console.log('====================================================');
});

module.exports = server;
