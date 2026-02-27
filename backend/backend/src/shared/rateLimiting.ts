// ========================================================================
// RATE LIMITING CONFIGURATION - Backend Security
// Implementar em src/shared/rateLimiting.ts
// ========================================================================

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

// Criar cliente Redis para armazenar rate limits
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// ==================== LIMITADORES POR TIPO ====================

/**
 * Rate limiter para endpoints de autenticação
 * - 5 tentativas por 15 minutos
 */
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth-limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 requisições
  message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para endpoints de API pública
 * - 100 requisições por 15 minutos
 */
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'api-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Limite de requisições atingido. Tente novamente mais tarde.',
});

/**
 * Rate limiter para uploads de arquivos
 * - 10 uploads por hora
 */
export const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'upload-limit:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
});

/**
 * Rate limiter para aprovação de capacidades (para admins)
 * - 50 aprovações por hora
 */
export const capabilityApprovalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'capability-approval-limit:',
  }),
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Limite de aprovações de capacidades atingido.',
  skip: (req) => {
    // Não aplicar rate limit se for usuário super-admin
    return (req as any).user?.isAdmin === true && (req as any).user?.isSuperAdmin === true;
  },
});

// ==================== INTEGRAÇÃO EM routes/auth.ts ====================
/*
import { authLimiter, uploadLimiter, capabilityApprovalLimiter } from '../src/shared/rateLimiting.js';

// Adicionar a endpoints críticas:
router.post('/api/auth/login', authLimiter, loginHandler);
router.post('/api/auth/create-client', authLimiter, createClientHandler);
router.post('/api/auth/upload-document', uploadLimiter, uploadDocumentHandler);
router.post('/api/auth/approve-capability', capabilityApprovalLimiter, approveCapabilityHandler);
*/

// ==================== MONITORAMENTO DE RATE LIMITING ====================

/**
 * Middleware para logging de rate limit violations
 */
export const rateLimitLogger = (req, res, next) => {
  res.on('finish', () => {
    if (res.status === 429) { // Too Many Requests
      console.warn(`⚠️ [RATE LIMIT] Violação de rate limit:\n  IP: ${req.ip}\n  Rota: ${req.path}\n  Método: ${req.method}`);
    }
  });
  next();
};

export default {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  capabilityApprovalLimiter,
  rateLimitLogger,
};
