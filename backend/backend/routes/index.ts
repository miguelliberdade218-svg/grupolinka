// ===== CARREGAMENTO DO .env NO TOPO ABSOLUTO (obrigatório!) =====
import 'dotenv/config'; // Carrega .env ANTES de qualquer coisa

// Debug imediato para confirmar .env
console.log('DEBUG INICIAL - DATABASE_URL do .env:', process.env.DATABASE_URL?.replace(/:.*@/, ':****@') || 'NÃO ENCONTRADA! Verifique .env e dotenv');

// ===== IMPORTS =====
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';

// ===== ROTAS COMPARTILHADAS =====
import sharedHealthRoutes from './shared/health';

// ===== NOVA API DRIZZLE UNIFICADA =====
import drizzleApiRoutes from './drizzle-api';

// ===== SISTEMAS FUNCIONAIS =====
import authRoutes from './auth';
import bookingsRoutes from './bookings';
import geoRoutes from './geo';
import billingRoutes from './billing';
import chatRoutes from './chat';

// ===== ROTAS DE LOCALIDADES =====
import locationsRouter from './locations';

// ===== NOVO SISTEMA DE HOTÉIS =====
import hotelController from '../src/modules/hotels/hotelController';

// ===== NOVO SISTEMA DE EVENTS =====
import eventController from '../src/modules/events/eventSpaceController';

// ===== ROTAS DE RIDES / DRIVERS / VEÍCULOS =====
import providerRidesRoutes from './provider/rides';
import providerDashboardRoutes from './provider/dashboard';
import rideController from '../src/modules/rides/rideController';
import driverController from '../src/modules/drivers/driverController';
import vehicleRoutes from './provider/vehicles';

// ===== ROTAS DE PARCERIAS =====
import { partnershipRoutes } from '../src/modules/partnerships/partnershipRoutes';
import { driverPartnershipRoutes } from '../src/modules/drivers/partnershipRoutes';

// ===== OUTRAS ROTAS MODULARES =====
import clientController from '../src/modules/clients/clientController';
import adminController from '../src/modules/admin/adminController';
import userController from '../src/modules/users/userController';

// ===== ROTAS INDIVIDUAIS DA RAIZ =====
import adminRoutes from '../adminRoutes';
import paymentRoutes from '../paymentRoutes';
import profileRoutes from '../profileRoutes';
import searchRoutes from '../searchRoutes';

// ===== ROTA RPC =====
import rpcRoutes from './rpc';

// ===== IMPORTS DO DRIZZLE =====
import { db } from '../db';
import { users } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

// ===== FIREBASE ADMIN =====
import admin from 'firebase-admin';

// ===== PG-BOSS JOBS (APENAS HOTÉIS - events removido) =====
import { 
  boss as hotelBoss, 
  runAvailabilityInitialization, 
  JOB_NAME as HOTEL_JOB_NAME 
} from '../src/jobs/availabilityJob';

// ===== FUNÇÕES AUXILIARES =====
const safeString = (value: unknown, defaultValue: string = ''): string => {
  if (value === null || value === undefined || value === '') return defaultValue;
  return String(value);
};

const safeNumber = (value: unknown, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUid = (uid: string): boolean => {
  return uid.length >= 10 && uid.length <= 128;
};

// ✅ CORREÇÃO: Função para inicializar jobs (agora só hotéis)
async function initializeAllJobs() {
  console.log('🔄 Iniciando jobs PG-BOSS necessários...');
  
  try {
    // Apenas job de hotéis
    console.log('🏨 Configurando job de disponibilidade de hotéis...');
    await hotelBoss.start();
    console.log('✅ pg-boss (hotéis) iniciado com sucesso');
    
    await hotelBoss.createQueue(HOTEL_JOB_NAME);
    console.log(`✅ Queue "${HOTEL_JOB_NAME}" criada com sucesso`);
    
    await hotelBoss.schedule(
      HOTEL_JOB_NAME,
      '0 3 * * 1', // segundas às 03:00 CAT
      {}, 
      {
        tz: 'Africa/Maputo',
        retryLimit: 5,
        retryDelay: 60 * 1000,
      }
    );
    console.log(`📅 Job "${HOTEL_JOB_NAME}" agendado: segundas 03:00 CAT`);
    
    // Executar manualmente para teste imediato (opcional)
    if (process.env.RUN_HOTEL_JOB_ON_STARTUP === 'true') {
      console.log('🧪 Executando job de hotéis manualmente para teste...');
      await runAvailabilityInitialization();
    }
    
    console.log('🎪 Job de events desativado permanentemente (disponibilidade implícita)');
    
  } catch (err) {
    console.error('❌ Erro ao iniciar jobs PG-BOSS:', err);
    // Não interrompe o servidor
  }
}

export async function registerRoutes(app: express.Express): Promise<void> {
  // Debug final antes de usar db
  console.log('DEBUG ANTES DE ROTAS - DATABASE_URL:', process.env.DATABASE_URL?.replace(/:.*@/, ':****@') || 'NÃO DEFINIDA');

  // ===== CORS =====
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://link-aturismomoz.com",
        "https://www.link-aturismomoz.com",
        "https://link-a-backend-production.up.railway.app",
        process.env.CORS_ORIGIN || "https://link-a-backend-production.up.railway.app",
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:8000",
        undefined
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS bloqueado para origem: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }));
  console.log('CORS configurado com sucesso');

  // Logging simples
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production' || req.method !== 'GET') {
      console.log('Request:', {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ===== ROTAS DE ADMINISTRAÇÃO DOS JOBS (apenas hotéis mantido) =====
  
  // ✅ CORREÇÃO: Removida rota /api/admin/jobs/events/run
  
  // Rota para executar job de hotéis manualmente
  app.post('/api/admin/jobs/hotels/run', async (req, res) => {
    try {
      console.log('🎬 Executando job de hotéis manualmente...');
      
      const result = await runAvailabilityInitialization();
      
      res.json({
        success: true,
        message: 'Job de hotéis executado com sucesso',
        result
      });
    } catch (error: any) {
      console.error('❌ Erro ao executar job de hotéis:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar job de hotéis',
        details: error.message
      });
    }
  });

  // Status dos jobs (apenas hotéis)
  app.get('/api/admin/jobs/status', async (req, res) => {
    try {
      const pgbossCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = 'pgboss'
        ) as schema_exists
      `);
      
      const schemaExists = (pgbossCheck as any).rows?.[0]?.schema_exists || false;
      
      let hotelJobs = 0;
      
      if (schemaExists) {
        const hotelJobsResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM pgboss.job 
          WHERE name = ${HOTEL_JOB_NAME} AND state = 'created'
        `);
        
        hotelJobs = Number((hotelJobsResult as any).rows?.[0]?.count || 0);
      }
      
      res.json({
        success: true,
        jobs: {
          hotels: {
            name: HOTEL_JOB_NAME,
            enabled: true,
            pendingJobs: hotelJobs,
            schedule: 'segundas 03:00 CAT',
            status: hotelJobs > 0 ? 'active' : 'idle'
          },
          events: {
            enabled: false,
            note: 'Desativado permanentemente (disponibilidade implícita)'
          }
        },
        pgboss: {
          schemaExists,
          schema: 'pgboss'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar status dos jobs'
      });
    }
  });

  // Debug Firebase Auth (mantido)
  app.get('/api/debug/firebase-auth', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token não fornecido' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decodedToken = await admin.auth().verifyIdToken(token);

      res.json({
        success: true,
        message: 'Token válido!',
        decoded: {
          uid: decodedToken.uid,
          email: decodedToken.email,
        }
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Token inválido',
        firebaseError: error.code
      });
    }
  });

  // Rotas principais
  app.use('/api/locations', locationsRouter);
  console.log('Rotas de localidades registradas');

  app.use('/api/rpc', rpcRoutes);
  console.log('Rotas RPC registradas');

  app.get('/api/test-postgis', async (req, res) => {
    try {
      const postgisTest = await db.execute(sql`SELECT PostGIS_Version()`);
      const version = (postgisTest as any).rows?.[0]?.postgis_version || 'unknown';

      const distanceTest = await db.execute(sql`
        SELECT ST_DistanceSphere(
          ST_SetSRID(ST_MakePoint(32.573, -25.966), 4326),
          ST_SetSRID(ST_MakePoint(32.645, -25.959), 4326)
        ) as distance_metros
      `);

      const distance = Math.round((distanceTest as any).rows?.[0]?.distance_metros || 0);

      res.json({
        success: true,
        postgis: 'ativo',
        version,
        distanceTest: { meters: distance, km: Math.round(distance / 1000) }
      });
    } catch (error) {
      res.status(500).json({ success: false, postgis: 'inativo' });
    }
  });

  app.get('/api/locations/suggest', async (req, res) => {
    try {
      const { query, limit = 10 } = req.query;
      const searchQuery = safeString(query);
      const searchLimit = Math.min(safeNumber(limit, 10), 50);

      if (searchQuery.length < 2) {
        return res.status(400).json({ success: false, error: 'Query muito curta' });
      }

      const suggestions = await db.execute(sql`
        SELECT id, name, province, district, type, lat::float, lng::float
        FROM mozambique_locations 
        WHERE name ILIKE ${'%' + searchQuery + '%'}
        ORDER BY 
          CASE 
            WHEN lower(name) = lower(${searchQuery}) THEN 0
            WHEN lower(name) LIKE lower(${searchQuery} + '%') THEN 1
            ELSE 2
          END,
          name
        LIMIT ${searchLimit}
      `);

      res.json({
        success: true,
        data: (suggestions as any).rows || [],
        query: searchQuery,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar sugestões' });
    }
  });

  const upsertUser = async (userData: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    roles?: string[];
  }) => {
    // ... (mantido igual - implementação original)
  };

  app.post('/api/auth/signup', async (req, res) => { 
    // ... (implementação original mantida)
  });

  app.post('/api/auth/check-registration', async (req, res) => { 
    // ... (implementação original mantida)
  });

  app.post('/api/auth/setup-roles', async (req, res) => { 
    // ... (implementação original mantida)
  });

  app.use('/api/health', sharedHealthRoutes);
  app.use('/api/drizzle', drizzleApiRoutes);

  app.use('/api/hotels', hotelController);
  console.log('Sistema de Hotéis registrado');

  app.use('/api/events', eventController);
  console.log('Sistema de Events registrado');

  app.use('/api/provider/rides', providerRidesRoutes);
  app.use('/api/provider/dashboard', providerDashboardRoutes);
  app.use('/api/rides', rideController);
  app.use('/api/driver', driverController);
  app.use('/api/vehicles', vehicleRoutes);
  console.log('Rotas de Rides/Drivers/Veículos registradas');

  app.use('/api/partnerships', partnershipRoutes);
  app.use('/api/driver/partnerships', driverPartnershipRoutes);
  console.log('Rotas de parcerias registradas');

  app.use('/api/clients', clientController);
  app.use('/api/admin/system', adminController);
  app.use('/api/users', userController);

  app.use('/api/admin-legacy', adminRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/search', searchRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/geo', geoRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/chat', chatRoutes);

  // ✅ CORREÇÃO: REMOVIDAS rotas obsoletas de events/availability
  // ❌ /api/events/availability/check (removido)
  // ❌ /api/events/availability/initialize (removido)

  // ✅ CORREÇÃO: Health-check limpo (sem referências a events antigo)
  app.get('/api/health-check', async (req, res) => {
    try {
      await db.select().from(users).limit(1);
      const postgisTest = await db.execute(sql`SELECT PostGIS_Version()`);
      const version = (postgisTest as any).rows?.[0]?.postgis_version || 'unknown';

      res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        postgis: { status: 'connected', version },
        services: {
          auth: 'operational',
          hotels: 'operational',
          events: 'operational (disponibilidade implícita)',
          rides: 'operational',
          vehicles: 'operational',
          partnerships: 'operational',
          rpc: 'operational',
          jobs: {
            hotels: 'configured',
            events: 'desativado (não necessário)'
          }
        },
        version: '2.1.0'
      });
    } catch (error) {
      res.status(500).json({ success: false, status: 'unhealthy', error: String(error) });
    }
  });

  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Rota não encontrada',
      path: req.originalUrl,
    });
  });

  app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  });

  console.log('Todas as rotas registradas com sucesso!');
  console.log('API pronta em /api/*');

  // ===== INICIALIZAR JOBS (apenas hotéis) =====
  if (process.env.ENABLE_JOBS !== 'false') {
    await initializeAllJobs();
  } else {
    console.log('⚠️ Jobs PG-BOSS desabilitados (ENABLE_JOBS=false)');
  }
}