import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import groupRoutes from './routes/groups.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import priceRoutes from './routes/prices.routes.js';
import summaryRoutes from './routes/summary.routes.js';

const app = express();

// Middleware
// Helmet for HTTP headers
app.use(helmet());

// CORS config allowing credentials for HttpOnly cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/summary', summaryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Handle invalid JSON parsing errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Bad Request: Invalid JSON payload (check for missing quotes or commas)' });
  }

  // Generic fallback
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
