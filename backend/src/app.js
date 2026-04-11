import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import connectDB from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
import promocionesRoutes from './routes/promociones.routes.js';
import carritoRoutes from './routes/carrito.routes.js';
import contactRoutes from './routes/contact.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { auditMiddleware } from './middleware/audit.middleware.js';

dotenv.config({ path: './.env' });

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
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

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/contact', contactRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  // Don't start server in test without valid MongoDB URI
  if (process.env.NODE_ENV === 'test' && !process.env.MONGO_URI?.includes('mongodb')) {
    console.log('⚠️ Skipping server start in test (no MongoDB)');
    return;
  }
  
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    } else {
      console.log('⚠️ Server start skipped in test env');
    }
  }
};

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;