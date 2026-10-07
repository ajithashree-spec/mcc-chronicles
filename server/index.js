const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const pool = require('./config/db');
const { helmetMiddleware, apiLimiter, authLimiter } = require('./middleware/securityMiddleware');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers via Helmet (applied at the top of middleware chain)
app.use(helmetMiddleware);

// CORS configuration supporting local development frontends
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
  })
);

// Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting (Hardened Security)
app.use('/api/auth/login', authLimiter);
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 as alive');
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: rows && rows.length > 0 ? 'connected' : 'unknown',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Root friendly greeting
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MCC Chronicles API',
    health: '/api/health',
    version: '1.0.0'
  });
});

// Mount API Routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const articleRoutes = require('./routes/articleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const commentRoutes = require('./routes/commentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const circularRoutes = require('./routes/circularRoutes');
const searchRoutes = require('./routes/searchRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const auditRoutes = require('./routes/auditRoutes');
const backupRoutes = require('./routes/backupRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const contactRoutes = require('./routes/contactRoutes');
const feedRoutes = require('./routes/feedRoutes');
const sitemapRoutes = require('./routes/sitemapRoutes');
const tagRoutes = require('./routes/tagRoutes');
const pollRoutes = require('./routes/pollRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

const { notFoundHandler, globalErrorHandler } = require('./middleware/errorMiddleware');

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/sitemap.xml', sitemapRoutes);
app.use('/sitemap.xml', sitemapRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Global Error Handling Middleware
app.use(globalErrorHandler);

// Initialize background cron scheduler engine (Task 95)
const { initCronScheduler } = require('./services/cronScheduler');
initCronScheduler();

// Export app for test suites
module.exports = app;

// Start server when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[MCC Chronicles Server] Running on http://localhost:${PORT}`);
    console.log(`[MCC Chronicles Server] Health check available at http://localhost:${PORT}/api/health`);
  });
}
