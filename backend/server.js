#!/usr/bin/env node

/**
 * Link-A Unified Production Server
 * Servidor robusto com graceful shutdown e auto-recovery
 * Suporta Railway deployment e desenvolvimento local
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de porta com fallback inteligente
const PORT = parseInt(process.env.PORT || '8000', 10);
const MAX_PORT_ATTEMPTS = 10;

console.log('🚀 Inicializando Link-A Server...');

// Função para tentar encontrar uma porta libre
async function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const testServer = createServer();
    
    testServer.listen(startPort, '0.0.0.0', () => {
      const port = testServer.address().port;
      testServer.close(() => resolve(port));
    });

    testServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        if (startPort - PORT < MAX_PORT_ATTEMPTS) {
          console.log(`⚠️  Porta ${startPort} em uso, tentando ${startPort + 1}...`);
          testServer.close();
          findAvailablePort(startPort + 1).then(resolve).catch(reject);
        } else {
          reject(new Error(`Nenhuma porta disponível entre ${PORT} e ${PORT + MAX_PORT_ATTEMPTS}`));
        }
      } else {
        reject(err);
      }
    });
  });
}

// Função para matar processos antigos na porta (Linux/Mac)
async function killProcessOnPort(port) {
  try {
    const killProcess = spawn('bash', ['-c', `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`], {
      stdio: 'pipe'
    });
    
    return new Promise((resolve) => {
      killProcess.on('close', () => {
        console.log(`🧹 Limpeza da porta ${port} concluída`);
        resolve();
      });
      
      // Timeout para não travar
      setTimeout(() => {
        killProcess.kill();
        resolve();
      }, 2000);
    });
  } catch (error) {
    console.log(`⚠️  Aviso: Não foi possível limpar porta ${port}:`, error.message);
  }
}

// Classe principal do servidor
class LinkAServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.actualPort = PORT;
    this.shutdownInProgress = false;
  }

  // Configurar middlewares básicos
  setupMiddlewares() {
    // CORS para desenvolvimento e produção
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Servir arquivos estáticos
    const staticPath = path.join(__dirname, 'frontend/dist');
    this.app.use(express.static(staticPath));

    console.log(`📁 Servindo arquivos estáticos de: ${staticPath}`);
  }

  // Configurar rotas básicas
  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        message: 'Link-A Server funcionando',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        port: this.actualPort,
        environment: process.env.NODE_ENV || 'production'
      });
    });

    // Tentar carregar backend compilado
    this.loadBackendRoutes();

    // SPA Catch-all handler - CORREÇÃO DEFINITIVA: regex literal
    this.app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, 'frontend/dist/index.html'), (err) => {
        if (err) {
          console.error('❌ Erro ao servir index.html:', err);
          res.status(500).send('Erro interno do servidor');
        }
      });
    });
  }

  // Carregar rotas do backend
  async loadBackendRoutes() {
    try {
      console.log('🔌 Carregando rotas do backend...');
      const backendModule = await import('./backend/dist/index.js');
      
      if (backendModule.default) {
        // Se o backend exporta um app Express
        this.app.use('/api', backendModule.default);
        console.log('✅ Rotas do backend carregadas com sucesso');
      } else {
        console.log('⚠️  Rotas do backend não encontradas, usando APIs placeholder');
        this.setupPlaceholderAPI();
      }
    } catch (error) {
      console.log('⚠️  Backend não disponível:', error.message);
      this.setupPlaceholderAPI();
    }
  }

  // APIs placeholder quando backend não está disponível - CORREÇÃO DEFINITIVA: regex literal
  setupPlaceholderAPI() {
    this.app.get(/\/api\/.*/, (req, res) => {
      res.status(503).json({
        error: 'API endpoint em desenvolvimento',
        path: req.path,
        message: 'Backend em inicialização...'
      });
    });
  }

  // Configurar graceful shutdown
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.shutdownInProgress) {
        console.log('⚠️  Shutdown já em andamento...');
        return;
      }

      this.shutdownInProgress = true;
      console.log(`🛑 Recebido sinal ${signal}. Iniciando shutdown elegante...`);

      // Timeout para force kill
      const forceKillTimeout = setTimeout(() => {
        console.log('⚡ Forçando encerramento (timeout de 10s)...');
        process.exit(1);
      }, 10000);

      try {
        if (this.server) {
          console.log('🔌 Fechando servidor HTTP...');
          await new Promise((resolve) => {
            this.server.close(() => {
              console.log('✅ Servidor HTTP fechado');
              resolve();
            });
          });
        }

        clearTimeout(forceKillTimeout);
        console.log('✅ Shutdown concluído com sucesso');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro durante shutdown:', error);
        clearTimeout(forceKillTimeout);
        process.exit(1);
      }
    };

    // Registrar handlers de shutdown
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
    
    // Tratar erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Exceção não capturada:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rejeitada não tratada:', reason);
      shutdown('unhandledRejection');
    });
  }

  // Iniciar servidor
  async start() {
    try {
      console.log(`🔍 Verificando disponibilidade da porta ${PORT}...`);
      
      // Tentar limpar a porta primeiro
      await killProcessOnPort(PORT);
      
      // Aguardar um momento para a limpeza
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Encontrar porta disponível
      this.actualPort = await findAvailablePort(PORT);
      
      if (this.actualPort !== PORT) {
        console.log(`⚠️  Porta ${PORT} não disponível, usando porta ${this.actualPort}`);
      }

      // Configurar aplicação
      this.setupMiddlewares();
      this.setupRoutes();
      this.setupGracefulShutdown();

      // Criar e iniciar servidor
      this.server = createServer(this.app);
      
      await new Promise((resolve, reject) => {
        this.server.listen(this.actualPort, '0.0.0.0', () => {
          console.log('🌐 ===================================');
          console.log(`🚀 Link-A Server ONLINE!`);
          console.log(`📱 Frontend: http://localhost:${this.actualPort}/`);
          console.log(`🔌 API: http://localhost:${this.actualPort}/api/`);
          console.log(`🏥 Health: http://localhost:${this.actualPort}/api/health`);
          console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
          console.log('🌐 ===================================');
          resolve();
        });

        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Porta ${this.actualPort} ainda em uso após limpeza`);
            reject(error);
          } else {
            console.error('❌ Erro no servidor:', error);
            reject(error);
          }
        });
      });

    } catch (error) {
      console.error('❌ Falha ao iniciar servidor:', error);
      console.log('🔄 Tentando restart em 3 segundos...');
      
      setTimeout(() => {
        this.start();
      }, 3000);
    }
  }
}

// Inicializar servidor - CORREÇÃO: nome da classe correto
const linkAServer = new LinkAServer();
linkAServer.start();

export default linkAServer;