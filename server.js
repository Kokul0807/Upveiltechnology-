require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const reviewsRouter = require('./routes/reviews');
const contactRouter = require('./routes/contact');
const prisma = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3001;

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL is not set!');
  console.error('Please add DATABASE_URL to your Vercel environment variables.');
  console.error('Get it from: Vercel Dashboard → Your Project → Storage → Postgres');
}

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  })
);
app.use(express.json({ limit: '100kb' }));

// Basic abuse protection on the write endpoints (reviews + contact form).
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP, please try again later.' },
});
app.use('/api/reviews', (req, res, next) => (req.method === 'POST' ? writeLimiter(req, res, next) : next()));
app.use('/api/contact', (req, res, next) => (req.method === 'POST' ? writeLimiter(req, res, next) : next()));

// Health check endpoint with database verification
app.get('/api/health', async (req, res) => {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.use('/api/reviews', reviewsRouter);
app.use('/api/contact', contactRouter);

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong on the server.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await prisma.$disconnect();
  server.close();
});

const server = app.listen(PORT, () => {
  console.log(`✅ Upveil Technology backend listening on port ${PORT}`);
  console.log(`📊 Database configured: ${process.env.DATABASE_URL ? '✅ Yes' : '❌ NO - CONFIGURE NOW!'}`);
});

module.exports = app;
