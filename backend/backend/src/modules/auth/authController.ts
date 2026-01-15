import { Router, Request, Response, NextFunction } from "express";
import { authStorage } from "../../shared/authStorage";
import { type AuthenticatedRequest, verifyFirebaseToken } from "../../../src/shared/firebaseAuth";

const router = Router();

// Obter dados do usuário autenticado
router.get('/user', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.user?.uid;
    const userEmail = authReq.user?.claims?.email;
    
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    // Verificar se usuário existe na base de dados
    let user = await authStorage.getUser(userId);
    
    if (!user) {
      // Criar usuário automaticamente se não existir
      user = await authStorage.upsertUser({
        id: userId,
        email: userEmail || null,
        firstName: authReq.user?.displayName?.split(' ')[0] || null,
        lastName: authReq.user?.displayName?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: null
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: [user.userType], // Converter userType para array de roles
      isVerified: user.isVerified || false,
      profileImageUrl: user.profileImageUrl,
      registrationCompleted: user.registrationCompleted || false,
      needsRoleSelection: !user.registrationCompleted
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Endpoint tradicional de registro com role específico
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'client' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email e senha são obrigatórios" 
      });
    }

    // TODO: Implementar criação no Firebase Auth aqui
    console.log(`📝 Registro solicitado: ${email} com role: ${role}`);
    
    res.status(201).json({
      success: true,
      message: "Registro realizado com sucesso",
      user: { 
        id: "temp-id", 
        email, 
        role: role 
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Erro ao realizar registro" 
    });
  }
});

// Configurar roles do usuário durante signup
router.post('/setup-user-roles', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { uid, email, displayName, photoURL, roles } = req.body;
    const userId = uid || authReq.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }
    
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "Pelo menos um role deve ser selecionado" });
    }

    // Criar/atualizar usuário com dados do Firebase
    let user = await authStorage.upsertUser({
      id: userId,
      email: email,
      firstName: displayName?.split(' ')[0] || null,
      lastName: displayName?.split(' ').slice(1).join(' ') || null,
      profileImageUrl: photoURL || null
    });
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles,
        userType: user.userType,
        profileImageUrl: user.profileImageUrl,
        isVerified: user.isVerified || false,
        registrationCompleted: true
      }
    });
  } catch (error) {
    console.error('Erro ao configurar roles:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;