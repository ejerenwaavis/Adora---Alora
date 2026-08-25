require('dotenv').config();
// Add timestamps to all console outputs (stdout and stderr)
['log', 'error', 'warn', 'info'].forEach((method) => {
  const original = console[method];
  console[method] = function (...args) {
    const timestamp = new Date().toISOString();
    original(`[${timestamp}]`, ...args);
  };
});
const express   = require('express');
const mongoose  = require('mongoose');
const helmet    = require('helmet');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const mongoSanitize = require('express-mongo-sanitize');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRUST PROXY — ALWAYS. Namecheap Passenger sits behind a proxy layer.
//    Non-negotiable per Foundations.md
// ─────────────────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────────────────
// 2. SECURITY HEADERS & CORS
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'"], // Vite dev injects inline scripts
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc:     ["'self'", 'https://api.paystack.co'],
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'sameorigin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5175',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Form-Token'],
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3. BODY PARSING & NoSQL INJECTION SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize()); // Strip malicious MongoDB operators ($ and .)

// ─────────────────────────────────────────────────────────────────────────────
// 4. STATIC FILES
//    /public_html → React build (production)
//    /public      → uploads, favicons, OG images
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public_html')));
app.use('/static', express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// 5. HEALTH & BUILD DIAGNOSTICS CHECK — /health and /api/health
// ─────────────────────────────────────────────────────────────────────────────
const healthHandler = (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'Disconnected';
  if (dbState === 1) dbStatus = 'Live';
  else if (dbState === 2) dbStatus = 'Connecting';
  else if (dbState === 3) dbStatus = 'Disconnecting';

  let buildTimestamp = 'Unknown';
  try {
    const indexPath = path.join(__dirname, 'public_html', 'index.html');
    if (fs.existsSync(indexPath)) {
      buildTimestamp = fs.statSync(indexPath).mtime.toISOString();
    }
  } catch (e) {
    // Ignore error
  }

  const memory = process.memoryUsage();

  res.status(200).json({
    status:      'healthy',
    server:      'running',
    dbStatus,
    uptime:      `${Math.floor(process.uptime())}s`,
    app:         'aora-house',
    env:         process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    buildTime:   buildTimestamp,
    memory: {
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      rssMb:      Math.round(memory.rss / 1024 / 1024)
    },
    timestamp:   new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ─────────────────────────────────────────────────────────────────────────────
// 6. API ROUTES & SECURITY SHIELDS
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/security', require('./routes/security'));
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/classes',  require('./routes/classes'));
app.use('/api/events',   require('./routes/events'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/venue',    require('./routes/venue'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/cms',      require('./routes/cms'));
app.use('/api/clerk',    require('./routes/clerk'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/user',     require('./routes/user'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api',          require('./routes/public'));

// ─────────────────────────────────────────────────────────────────────────────
// 7. SPA CATCH-ALL
//    React Router handles all client-side navigation.
//    In development (before `vite build`), this falls back gracefully.
// ─────────────────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public_html', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Development fallback — Vite handles the frontend on port 5175
    res.status(200).json({
      message: 'Aora House API is running.',
      hint:    'Frontend served by Vite on port 5175. Run `npm run build` for production.',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error:   status >= 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. DATABASE + START
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3005;
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Attach io to app so routes can broadcast events
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to KDS socket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

mongoose
  .connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');

    // Start background waitlist promotion expiration worker (every 30s)
    const { processExpiredPromotions } = require('./services/waitlistManager');
    setInterval(() => {
      processExpiredPromotions().catch(e => console.warn('[Waitlist Worker Error]', e.message));
    }, 30000);

    server.listen(PORT, () => {
      console.log(`✓ Aora House server running on port ${PORT}`);
      console.log(`  → API:      http://localhost:${PORT}/api`);
      console.log(`  → Health:   http://localhost:${PORT}/health`);
      console.log(`  → Frontend: http://localhost:5175 (Vite dev server)`);
    });
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });
