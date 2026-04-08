import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
import promocionesRoutes from './routes/promociones.routes.js';
import carritoRoutes from './routes/carrito.routes.js';
import contactRoutes from './routes/contact.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { auditMiddleware } from './middleware/audit.middleware.js';

dotenv.config({ path: './.env' });

const isVercel = process.env.VERCEL === '1';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'cdnjs.cloudflare.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:', 'i.imgur.com'],
      connectSrc: ["'self'", 'https:', 'http://localhost:3000', 'http://localhost:3001'],
      frameSrc: ["'self'"],
    },
  } : false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(auditMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/contact', contactRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const publicPath = process.env.VERCEL 
  ? path.join(__dirname, '../../public')
  : path.join(__dirname, '../../public');

app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 BetoStore API started successfully                   ║
║                                                           ║
║   Server:  http://localhost:${PORT}                         ║
║   Health:  http://localhost:${PORT}/health                  ║
║   API:     http://localhost:${PORT}/api                     ║
║                                                           ║
║   Mode:    ${(process.env.NODE_ENV || 'development').padEnd(12)}                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;
