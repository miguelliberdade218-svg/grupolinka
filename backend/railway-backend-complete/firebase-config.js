// ====================================
// ARQUIVO: config/firebase.js
// DESCRIÇÃO: Configuração Firebase Admin para Railway
// ====================================

const admin = require('firebase-admin');

// Configuração Firebase Admin
// IMPORTANTE: Adicionar estas variáveis no Railway:
// - FIREBASE_PROJECT_ID
// - FIREBASE_PRIVATE_KEY 
// - FIREBASE_CLIENT_EMAIL

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    
    console.log('✅ Firebase Admin inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
    throw error;
  }
}

// Inicializar Firestore (se usar como base de dados)
const db = admin.firestore();

module.exports = { admin, db };