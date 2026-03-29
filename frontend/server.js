import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Security - Disabled for development
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: 'cross-origin' },
//   contentSecurityPolicy: false,
// }));

// CORS
app.use(cors({
  origin: true,
  credentials: true,
}));

// Logging
app.use(morgan('dev'));

// Body parsing - MUST BE BEFORE PROXY
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API PROXY - Forward to Backend (MUST BE FIRST)
app.use('/api', async (req, res) => {
  const target = `${API_URL}/api${req.url}`;
  console.log(`[PROXY] ${req.method} /api${req.url} -> ${target}`);
  
  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(API_URL).host,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.text();
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(data);
  } catch (err) {
    console.error('[PROXY ERROR]', err.message);
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
});

// Contact Form Proxy
app.use('/contact', express.json(), async (req, res, next) => {
  const target = `${API_URL}/contact`;
  console.log(`[PROXY] ${req.method} /contact -> ${target}`, req.body);
  
  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.text();
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(data);
  } catch (err) {
    console.error('[PROXY ERROR]', err.message);
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
});

// ============================================
// STATIC FILES - Frontend
// ============================================
app.use(express.static('templates'));
app.use('/assets', express.static('assets'));
app.use('/css', express.static('assets/css'));
app.use('/js', express.static('assets/js'));
app.use('/img', express.static('assets/img'));

// ============================================
// ROUTES - HTML Pages
// ============================================

// Home
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'templates/index.html'));
});

// Shop
app.get('/shop.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/shop.html'));
});

// Shop Single
app.get('/shop-single.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/shop-single.html'));
});

// Login
app.get('/login.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/login.html'));
});

// Register
app.get('/register.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/register.html'));
});

// Recuperar
app.get('/recuperar.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/recuperar.html'));
});

// Reset password
app.get('/reset-password.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/reset-password.html'));
});

// Cart
app.get('/cart.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/cart.html'));
});

// Checkout
app.get('/checkout.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/checkout.html'));
});

// Contact
app.get('/contact.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/contact.html'));
});

// About
app.get('/about.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/about.html'));
});

// Promociones
app.get('/promociones.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/promociones.html'));
});

// Releases
app.get('/releases.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/releases.html'));
});

// Admin
app.get('/admin/dashboard.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/admin/dashboard.html'));
});

app.get('/admin/productos.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/admin/productos.html'));
});

app.get('/admin/producto-formulario.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/admin/producto-formulario.html'));
});

app.get('/admin/usuarios.html', (req, res) => {
  res.sendFile(join(__dirname, 'templates/admin/usuarios.html'));
});

// ============================================
// FALLBACK
// ============================================
app.get('*', (req, res) => {
  if (!req.path.includes('.') || req.path.endsWith('.html')) {
    res.sendFile(join(__dirname, 'templates/index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 BetoStore Server started                           ║
║                                                           ║
║   Frontend:  http://localhost:${PORT}                      ║
║   API Proxy: http://localhost:${PORT}/api                   ║
║   Backend:   ${API_URL}                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
