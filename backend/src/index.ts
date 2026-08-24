import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CeramixFlow Backend API',
    timestamp: new Date().toISOString(),
    aiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
    telegramConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim() !== ''),
  });
});

// Mount Routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏺 CeramixFlow Backend Server running on http://localhost:${PORT}`);
  console.log(`🚀 API Endpoints ready at http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
