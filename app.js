require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const helmet    = require('helmet');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRUST PROXY — ALWAYS. Namecheap Passenger sits behind a proxy layer.
//    Non-negotiable per Foundations.md
// ─────────────────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────────────────
// 2. SECURITY
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'"], // Vite dev injects inline scripts
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'blob:'],
      connectSrc:     ["'self'", 'https://api.paystack.co'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5175',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3. BODY PARSING
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// 4. STATIC FILES
//    /public_html → React build (production)
//    /public      → uploads, favicons, OG images
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public_html')));
app.use('/static', express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// 5. HEALTH CHECK — required for Namecheap Passenger startup detection
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'ok',
    app:       'adora-alora',
    env:       process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. API ROUTES
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/classes',  require('./routes/classes'));
app.use('/api/events',   require('./routes/events'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/venue',    require('./routes/venue'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/cms',      require('./routes/cms'));
app.use('/api/clerk',    require('./routes/clerk'));
app.use('/api/user',     require('./routes/user'));
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
      message: 'Adora & Alora API is running.',
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

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✓ Adora & Alora server running on port ${PORT}`);
      console.log(`  → API:      http://localhost:${PORT}/api`);
      console.log(`  → Health:   http://localhost:${PORT}/health`);
      console.log(`  → Frontend: http://localhost:5175 (Vite dev server)`);
    });
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });
