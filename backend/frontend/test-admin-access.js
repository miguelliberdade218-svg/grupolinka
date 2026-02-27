// Script para testar acesso admin
console.log('🔍 Testando acesso admin...');

// Verificar localStorage
console.log('📦 localStorage:');
console.log('  token:', localStorage.getItem('token') ? '✅ Presente' : '❌ Ausente');
console.log('  user:', localStorage.getItem('user') ? '✅ Presente' : '❌ Ausente');
console.log('  userCapabilities:', localStorage.getItem('userCapabilities') ? '✅ Presente' : '❌ Ausente');

// Verificar usuário atual
const userStr = localStorage.getItem('user');
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('👤 Usuário atual:', user.email);
    console.log('  UID:', user.uid);
  } catch (error) {
    console.error('❌ Erro ao parsear usuário:', error);
  }
}

// Verificar capacidades
const capsStr = localStorage.getItem('userCapabilities');
if (capsStr) {
  try {
    const caps = JSON.parse(capsStr);
    console.log('🎯 Capacidades:', caps);
    console.log('  isAdmin:', caps.isAdmin ? '✅ Sim' : '❌ Não');
  } catch (error) {
    console.error('❌ Erro ao parsear capacidades:', error);
  }
}

// Testar endpoint de capacidades
async function testCapabilitiesEndpoint() {
  console.log('🌐 Testando endpoint /api/auth/capabilities...');
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('❌ Nenhum token disponível para testar');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/capabilities', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Resposta do servidor:');
    console.log('  Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados recebidos:', data);
    } else {
      console.log('❌ Erro na resposta');
      const errorText = await response.text();
      console.log('  Detalhes:', errorText);
    }
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error);
  }
}

// Executar teste
testCapabilitiesEndpoint();