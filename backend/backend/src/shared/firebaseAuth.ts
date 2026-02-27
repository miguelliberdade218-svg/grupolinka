// ========================================================================
// firebaseAuth.ts - VERSÃO MODERNIZADA (25 Fevereiro 2026)
// ✅ Sincronização Firebase UID ↔ Database
// ✅ Capabilidades integradas
// ✅ Sem quebras de compatibilidade
// ========================================================================

import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import { db } from "../../db.js";
import { users, firebase_user_mapping } from "../../shared/schema.js";
import { sql, eq } from "drizzle-orm";
import type { 
  AuthenticatedUser, 
  AuthenticatedRequest, 
  UserRole,
  UserCapabilities,
  ApiResponse,
  ApiError
} from "../../shared/types.js";

// ==================== UTILITÁRIOS DE RESPOSTA ====================

export const createApiResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

export const createApiError = (
  message: string,
  code: string = "API_ERROR",
  details?: any
): ApiError => ({
  success: false,
  message,
  code,
  details: details instanceof Error ? details.message : details,
  timestamp: new Date().toISOString(),
});

// Re-exportar types para facilitar imports
export type { UserCapabilities, ApiResponse, ApiError, AuthenticatedUser, AuthenticatedRequest };

interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

const validateFirebaseConfig = (): FirebaseConfig => {
  const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } = process.env;

  if (!FIREBASE_PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID is missing');
  if (!FIREBASE_PRIVATE_KEY) throw new Error('FIREBASE_PRIVATE_KEY is missing');
  if (!FIREBASE_CLIENT_EMAIL) throw new Error('FIREBASE_CLIENT_EMAIL is missing');

  return {
    projectId: FIREBASE_PROJECT_ID,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: FIREBASE_CLIENT_EMAIL,
  };
};

let firebaseApp: admin.app.App | null = null;
let firebaseInitialized = false;

export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) return firebaseApp;

  try {
    console.log('🔧 Inicializando Firebase Admin...');
    const config = validateFirebaseConfig();

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        privateKey: config.privateKey,
        clientEmail: config.clientEmail,
      }),
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin inicializado com sucesso');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export const getFirebaseAuth = () => {
  if (!firebaseInitialized) {
    try {
      initializeFirebase();
    } catch {
      return null;
    }
  }
  return admin.auth();
};

// ==================== SINCRONIZAÇÃO DE USUÁRIO ====================

/**
 * Sincroniza usuário Firebase com banco de dados
 * Cria ou atualiza mapping firebase_uid → user_id
 * Retorna o user_id do banco
 */
async function syncUserWithDatabase(
  firebaseUid: string,
  email: string,
  displayName?: string
): Promise<string | null> {
  try {
    console.log(`🔄 Sincronizando usuário Firebase: ${firebaseUid} (${email})`);

    // 1. Buscar mapeamento existente
    const existingMapping = await db
      .select()
      .from(firebase_user_mapping)
      .where(eq(firebase_user_mapping.firebase_uid, firebaseUid));

    if (existingMapping.length > 0) {
      console.log(
        `✅ Mapeamento encontrado: ${firebaseUid} → ${existingMapping[0].user_id}`
      );
      return existingMapping[0].user_id;
    }

    // 2. Buscar usuário por email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    let userId: string;

    if (existingUser.length > 0) {
      // Usuário já existe - usar seu ID
      userId = existingUser[0].id;
      console.log(`✅ Usuário encontrado por email: ${email} → ${userId}`);
    } else {
      // Criar novo usuário
      const firstName = displayName?.split(' ')[0] || 'User';
      const lastName = displayName?.split(' ').slice(1).join(' ') || '';

      const newUser = await db
        .insert(users)
        .values({
          id: sql`gen_random_uuid()`,
          email: email,
          firstName: firstName,
          lastName: lastName,
          fullName: displayName || `${firstName} ${lastName}`.trim(),
          canBookServices: true,
          canDrive: false,
          canManageHotels: false,
          isAdmin: false,
          createdAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .returning();

      userId = newUser[0].id;
      console.log(`✅ Novo usuário criado: ${email} → ${userId}`);
    }

    // 3. Criar ou atualizar mapeamento
    await db.execute(
      sql`
        INSERT INTO firebase_user_mapping (firebase_uid, user_id)
        VALUES (${firebaseUid}, ${userId})
        ON CONFLICT (firebase_uid) 
        DO UPDATE SET user_id = EXCLUDED.user_id
      `
    );

    // 4. Atualizar firebase_uid na tabela users
    await db.execute(
      sql`UPDATE users SET firebase_uid = ${firebaseUid} WHERE id = ${userId}`
    );

    console.log(`✅ Sincronização completa: ${firebaseUid} → ${userId}`);
    return userId;
  } catch (error) {
    console.error('❌ Erro ao sincronizar usuário:', error);
    return null;
  }
}

// ==================== MIDDLEWARE DE VERIFICAÇÃO ====================

/**
 * Middleware para verificar e sincronizar token Firebase
 * - Valida token Firebase + expiry
 * - Sincroniza usuário com banco de dados
 * - Popula req.user com dados do banco
 * - Calcula capacidades
 */
export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const auth = getFirebaseAuth();

  if (!auth) {
    console.log('⚠️ Firebase não inicializado - pulando verificação');
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json(
      createApiError('Token de autenticação não fornecido', 'NO_AUTH_HEADER')
    );
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    res.status(401).json(createApiError('Token vazio', 'EMPTY_TOKEN'));
    return;
  }

  try {
    // 1. Verificar token com Firebase + validação de expiry
    const decodedToken = await auth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const firebaseEmail = decodedToken.email;
    
    // Validar expiry do token
    const tokenExpiry = decodedToken.exp * 1000; // converter para ms
    const now = Date.now();
    const timeUntilExpiry = tokenExpiry - now;
    
    if (timeUntilExpiry < 0) {
      console.warn(`⏰ [TOKEN EXPIRED] Token expirado há ${Math.abs(timeUntilExpiry) / 1000}s`);
      res.status(401).json(createApiError('Token expirado', 'TOKEN_EXPIRED'));
      return;
    }
    
    // Avisar se token está próximo de expirar (menos de 5 minutos)
    if (timeUntilExpiry < 5 * 60 * 1000) {
      console.warn(`⏰ [TOKEN EXPIRING SOON] Token expira em ${Math.floor(timeUntilExpiry / 1000)}s`);
    }

    if (!firebaseEmail) {
      console.error('❌ Email não disponível no token Firebase');
      res.status(400).json(createApiError('Email não disponível no token', 'NO_EMAIL'));
      return;
    }

    // 2. Sincronizar com banco de dados
    const userId = await syncUserWithDatabase(
      firebaseUid,
      firebaseEmail,
      decodedToken.name
    );

    if (!userId) {
      console.error('❌ Falha ao sincronizar usuário');
      res
        .status(500)
        .json(createApiError('Falha ao sincronizar usuário', 'SYNC_FAILED'));
      return;
    }

    // 3. Buscar usuário do banco
    const userFromDb = await db.select().from(users).where(eq(users.id, userId));

    if (userFromDb.length === 0) {
      console.error('❌ Usuário não encontrado no banco após sincronização');
      res.status(404).json(createApiError('Usuário não encontrado', 'USER_NOT_FOUND'));
      return;
    }

    const user = userFromDb[0];
    
    // Helper para converter null para undefined
    const nullToUndef = <T,>(value: T | null | undefined): T | undefined => 
      value === null ? undefined : value;

    // 4. Montar objeto AuthenticatedUser
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      uid: firebaseUid,
      email: nullToUndef(user.email),
      firstName: nullToUndef(user.firstName),
      lastName: nullToUndef(user.lastName),
      roles: (user.roles as any) || [],
      profileImageUrl: nullToUndef(user.profileImageUrl),
    };

    // 5. Adicionar capacidades ao req
    const authReq = req as AuthenticatedRequest;
    authReq.user = authenticatedUser;
    authReq.userCapabilities = {
      canBookServices: user.canBookServices ?? true,
      canDrive: user.canDrive ?? false,
      canManageHotels: user.canManageHotels ?? false,
      isAdmin: user.isAdmin ?? false,
      driverVerificationStatus: user.driverVerificationStatus,
      hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
    };

    console.log(`✅ Usuário autenticado: ${user.email} (${user.id}) | Token expira em ${Math.floor(timeUntilExpiry / 1000)}s`);
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 🔍 Logging detalhado de erros de autenticação
    console.error(`❌ [AUTH ERROR] Erro ao verificar token Firebase:`, {
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      timestamp: new Date().toISOString(),
    });

    // Tratamento específico de erros
    if (error instanceof Error) {
      if (
        errorMessage.includes('Firebase ID token has expired') ||
        errorMessage.includes('Token expired') ||
        errorMessage.includes('exp claim is in the past')
      ) {
        console.warn(`⏰ [AUTH] Token Firebase expirado detectado`);
        res.status(401).json(createApiError('Token expirado', 'TOKEN_EXPIRED'));
        return;
      }
      
      if (errorMessage.includes('Illegal argument provided') || errorMessage.includes('Invalid token')) {
        console.warn(`⚠️ [AUTH] Token Firebase inválido/malformado`);
        res.status(401).json(createApiError('Token inválido', 'INVALID_TOKEN'));
        return;
      }
      
      if (errorMessage.includes('auth/invalid-id-token')) {
        console.warn(`⚠️ [AUTH] Token não pode ser verificado (Firebase)`);
        res.status(401).json(createApiError('Token não pode ser verificado', 'UNVERIFIABLE_TOKEN'));
        return;
      }
    }

    res.status(500).json(createApiError('Erro ao verificar token', 'VERIFICATION_ERROR'));
  }
};

// ==================== MIDDLEWARE DE PERMISSÕES ====================

/**
 * Verifica se usuário tem capacidade específica
 */
export const requireCapability =
  (capability: keyof UserCapabilities) =>
  (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json(createApiError('Usuário não autenticado', 'NOT_AUTHENTICATED'));
      return;
    }

    const capabilities = authReq.userCapabilities || {
      canBookServices: authReq.user.canBookServices,
      canDrive: authReq.user.canDrive,
      canManageHotels: authReq.user.canManageHotels,
      isAdmin: authReq.user.isAdmin,
      driverVerificationStatus: authReq.user.driverVerificationStatus,
      hotelManagerVerificationStatus: authReq.user.hotelManagerVerificationStatus,
    };

    if (!capabilities[capability]) {
      res.status(403).json(
        createApiError(
          `Acesso negado. Capacidade necessária: ${capability}`,
          'CAPABILITY_DENIED'
        )
      );
      return;
    }

    next();
  };

/**
 * Verifica se usuário é admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    res.status(401).json(createApiError('Usuário não autenticado', 'NOT_AUTHENTICATED'));
    return;
  }

  if (!authReq.user?.isAdmin) {
    res.status(403).json(
      createApiError('Acesso restrito a administradores', 'ADMIN_ONLY')
    );
    return;
  }

  next();
};