require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// ── Rate Limiting (uncomment to enable) ───────────────────
// const rateLimit = require('express-rate-limit');
//
// const searchLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,   // 15 minutes
//   max: 50,                     // 50 search requests per IP per window
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     res.status(429).render('index', {
//       error: 'Too many search requests from your IP. Please try again in 15 minutes.',
//     });
//   },
// });
//
// const uploadLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,   // 15 minutes
//   max: 10,                     // 10 upload requests per IP per window
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     res.render('upload', {
//       error: 'Too many upload requests from your IP. Please try again in 15 minutes.',
//       success: null,
//     });
//   },
// });

// ── Middleware ─────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── View engine ───────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Routes ────────────────────────────────────────────────
const searchRoutes = require('./routes/searchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Apply rate limiters (uncomment when needed):
// app.use('/search', searchLimiter);
// app.use('/upload', uploadLimiter);

app.use('/', searchRoutes);
app.use('/', uploadRoutes);

// Home
app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// 404
app.use((req, res) => {
  res.status(404).render('index', { error: 'Page not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('index', { error: 'Something went wrong' });
});

// ── Start server (only when running directly, not via Netlify) ──
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✦ ProjectXXX running → http://localhost:${PORT}`);
  });
}

module.exports = app;
