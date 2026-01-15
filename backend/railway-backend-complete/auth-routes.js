// ====================================
// ARQUIVO: routes/auth.js 
// DESCRIÇÃO: Rotas de autenticação para Railway
// ====================================

const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Middleware para verificar token Firebase
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Token inválido:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ===== GET /api/auth/profile =====
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log('🔍 Buscando perfil:', uid);

    // Buscar usuário na base de dados
    // Adapte esta parte para sua base de dados (PostgreSQL, MongoDB, etc)
    const user = await db.collection('users').doc(uid).get();
    
    if (!user.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = user.data();
    console.log('✅ Perfil encontrado:', userData);
    
    res.json({
      success: true,
      uid: uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      roles: userData.roles || ['client'],
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== POST /api/auth/register =====
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    console.log('📝 Registrando usuário:', { uid, email, displayName });

    // Verificar se usuário já existe
    const existingUser = await db.collection('users').doc(uid).get();
    
    if (existingUser.exists) {
      return res.json({ 
        success: true, 
        user: existingUser.data(), 
        message: 'Usuário já existe' 
      });
    }

    // Criar novo usuário
    const newUserData = {
      uid,
      email,
      displayName,
      photoURL,
      roles: ['client'], // Role padrão
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(uid).set(newUserData);
    
    console.log('✅ Usuário criado:', newUserData);
    res.json({ success: true, user: newUserData });
    
  } catch (error) {
    console.error('❌ Erro ao registrar:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PUT /api/auth/roles =====
router.put('/roles', verifyFirebaseToken, async (req, res) => {
  try {
    const { roles } = req.body;
    const uid = req.user.uid;
    
    console.log('🔧 Atualizando roles:', { uid, roles });

    // Atualizar roles do usuário
    const updateData = {
      roles,
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(uid).update(updateData);

    // Buscar usuário atualizado
    const updatedUser = await db.collection('users').doc(uid).get();
    
    console.log('✅ Roles atualizados:', updatedUser.data());
    res.json({ success: true, user: updatedUser.data() });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar roles:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;