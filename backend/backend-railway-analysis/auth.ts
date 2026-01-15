import { Router } from 'express';
import admin from 'firebase-admin';
import { z } from 'zod';
import { db } from '../db.js';
import { users } from '../shared/database-schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/service-accounts/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// Middleware to verify Firebase token
export const verifyFirebaseToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware to verify user roles
export const verifyRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userRoles = user.roles || ['client'];
      const hasPermission = roles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Registration/Login endpoint
router.post('/register', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, uid));
    
    if (existingUser) {
      return res.json({ 
        message: 'Usuário já existe', 
        user: existingUser,
        requiresRoleSetup: !existingUser.roles || existingUser.roles.length === 0 || (existingUser.roles.length === 1 && existingUser.roles[0] === 'client')
      });
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      id: uid,
      email,
      firstName: displayName?.split(' ')[0] || '',
      lastName: displayName?.split(' ').slice(1).join(' ') || '',
      profileImageUrl: photoURL,
      roles: ['client'], // Default role
      userType: 'client',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    res.json({ 
      message: 'Usuário criado com sucesso', 
      user: newUser,
      requiresRoleSetup: true // New users need to set additional roles
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get user profile
router.get('/profile', verifyFirebaseToken, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update user roles
const updateRolesSchema = z.object({
  roles: z.array(z.enum(['client', 'driver', 'hotel_manager', 'admin'])).min(1)
});

router.put('/roles', verifyFirebaseToken, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { roles } = updateRolesSchema.parse(req.body);

    // Admin role can only be assigned by existing admins
    if (roles.includes('admin')) {
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!currentUser?.roles?.includes('admin')) {
        return res.status(403).json({ error: 'Apenas administradores podem atribuir o papel de admin' });
      }
    }

    const [updatedUser] = await db.update(users)
      .set({ 
        roles,
        userType: roles.includes('admin') ? 'admin' : roles.includes('hotel_manager') ? 'hotel_manager' : roles.includes('driver') ? 'driver' : 'client',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    res.json({ 
      message: 'Roles atualizados com sucesso', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Erro ao atualizar roles:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;