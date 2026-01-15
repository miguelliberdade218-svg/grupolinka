// ====================================
// ARQUIVO: index.js ou app.js (arquivo principal)
// DESCRIÇÃO: Servidor principal Railway com todas as rotas
// ====================================

const express = require('express');
const cors = require('cors');
require('./config/firebase'); // Inicializar Firebase

const app = express();
const PORT = process.env.PORT || 8080;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    'https://link-aturismomoz.com',
    'http://localhost:5000',           // Replit local
    'https://*.replit.app',            // Replit production
    'https://*.vercel.app',            // Vercel se usar
    process.env.FRONTEND_URL           // URL do frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== ROTAS =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Link-A Backend API funcionando',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Rotas de autenticação
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Rotas de viagens (suas rotas existentes)
const rideRoutes = require('./routes/rides'); // Se já tem
app.use('/api/rides-simple', rideRoutes);

// Rota para listar endpoints disponíveis
app.get('/api', (req, res) => {
  res.json({
    message: 'Link-A Backend API',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/auth/profile',
      'POST /api/auth/register', 
      'PUT /api/auth/roles',
      'POST /api/rides-simple/create',
      'GET /api/rides-simple/search'
    ],
    version: '3.0.0'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint não encontrado',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/auth/profile',
      'POST /api/auth/register',
      'PUT /api/auth/roles', 
      'POST /api/rides-simple/create',
      'GET /api/rides-simple/search'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Link-A Backend funcionando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📱 API: http://localhost:${PORT}/api/`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;