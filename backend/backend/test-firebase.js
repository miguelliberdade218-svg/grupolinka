import admin from 'firebase-admin';

console.log('🧪 Testando conexão Firebase...');

try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  console.log('📋 Configuração:');
  console.log('- Project ID:', serviceAccount.projectId);
  console.log('- Email:', serviceAccount.clientEmail);
  console.log('- Key length:', serviceAccount.privateKey?.length);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('✅ Firebase conectado com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('❌ Erro ao conectar Firebase:');
  console.error('Mensagem:', error.message);
  process.exit(1);
}
