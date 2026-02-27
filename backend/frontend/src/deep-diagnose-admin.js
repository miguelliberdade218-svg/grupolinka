// DIAGNÓSTICO PROFUNDO DO ADMIN ACCESS
console.log('🔍 DIAGNÓSTICO PROFUNDO DO ADMIN ACCESS');
console.log('='.repeat(60));

// 1. Estado atual do localStorage
console.log('📊 1. LOCALSTORAGE ESTADO ATUAL:');
const allStorage = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  try {
    const value = localStorage.getItem(key);
    allStorage[key] = key.includes('token') ? 
      (value ? value.substring(0, 30) + '...' : 'null') : 
      value;
  } catch (e) {
    allStorage[key] = 'ERROR_READING';
  }
}
console.log('Todos os itens:', allStorage);

// 2. Capacidades específicas
console.log('\n🎯 2. CAPACIDADES DO USUÁRIO:');
const capabilitiesStr = localStorage.getItem('userCapabilities');
if (capabilitiesStr) {
  try {
    const caps = JSON.parse(capabilitiesStr);
    console.log('✅ Capacidades encontradas:');
    console.log('- canBookServices:', caps.canBookServices);
    console.log('- canDrive:', caps.canDrive);
    console.log('- canManageHotels:', caps.canManageHotels);
    console.log('- isAdmin:', caps.isAdmin);
    console.log('- Objeto completo:', caps);
    
    if (caps.isAdmin) {
      console.log('🎉 USUÁRIO É ADMIN NO LOCALSTORAGE!');
    } else {
      console.log('❌ Usuário NÃO é admin no localStorage');
      console.log('💡 Verifique banco: SELECT is_admin FROM users WHERE email = \'edsondaniel8@gmail.com\'');
    }
  } catch (e) {
    console.error('❌ Erro ao parsear capacidades:', e);
  }
} else {
  console.log('⚠️ Nenhuma capacidade encontrada no localStorage');
}

// 3. Token e autenticação
console.log('\n🔑 3. AUTENTICAÇÃO:');
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
console.log('- Token presente:', !!token);
console.log('- User data presente:', !!userStr);
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('- Email:', user.email);
    console.log('- UID:', user.uid);
  } catch (e) {
    console.error('- Erro ao parsear user:', e);
  }
}

// 4. URL e navegação
console.log('\n🌐 4. NAVEGAÇÃO:');
console.log('- URL atual:', window.location.href);
console.log('- Origin:', window.location.origin);
console.log('- Pathname:', window.location.pathname);
console.log('- Hash:', window.location.hash);
console.log('- Search:', window.location.search);

// 5. Verificar se há redirecionamentos ativos
console.log('\n🔄 5. REDIRECIONAMENTOS:');
console.log('- location.href foi modificado?', window.location.href !== window.location.origin + window.location.pathname);

// 6. Testar API de capacidades diretamente
console.log('\n🌐 6. TESTAR API DIRETAMENTE:');
async function testCapabilitiesAPI() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ Nenhum token para testar API');
    return;
  }
  
  try {
    console.log('📡 Testando endpoint /api/auth/capabilities...');
    const response = await fetch('/api/auth/capabilities', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('- Status:', response.status);
    console.log('- OK?', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('- Resposta:', data);
      
      if (data.success && data.data) {
        console.log('✅ API retornou capacidades:', data.data);
        console.log('✅ isAdmin via API:', data.data.isAdmin);
        
        // Comparar com localStorage
        const localCaps = JSON.parse(localStorage.getItem('userCapabilities') || '{}');
        console.log('🔍 Comparação localStorage vs API:');
        console.log('- localStorage isAdmin:', localCaps.isAdmin);
        console.log('- API isAdmin:', data.data.isAdmin);
        console.log('- São iguais?', localCaps.isAdmin === data.data.isAdmin);
      }
    } else {
      console.error('❌ Erro na API:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

// 7. Verificar event listeners de redirecionamento
console.log('\n🎯 7. EVENT LISTENERS:');
console.log('- beforeunload listeners:', window._beforeunloadListeners || 'Nenhum');
console.log('- unload listeners:', window._unloadListeners || 'Nenhum');

// 8. Instruções de correção
console.log('\n🔧 8. INSTRUÇÕES DE CORREÇÃO:');
console.log('\nSE O PROBLEMA PERSISTIR:');
console.log('1. Execute no console:');
console.log('   localStorage.removeItem(\'userCapabilities\');');
console.log('   location.reload();');
console.log('\n2. Verifique se há múltiplas requisições à API:');
console.log('   - Abra aba Network no DevTools');
console.log('   - Filtre por "capabilities"');
console.log('   - Verifique se há múltiplas chamadas 401/403');
console.log('\n3. Verifique o backend:');
console.log('   psql postgresql://linka_user:@localhost:5432/linka2_database -c \"SELECT email, is_admin FROM users WHERE email = \'edsondaniel8@gmail.com\';\"');
console.log('\n4. Forçar logout/login completo:');
console.log('   localStorage.clear();');
console.log('   sessionStorage.clear();');
console.log('   location.href = \'/login\';');

// Executar teste da API
testCapabilitiesAPI();

console.log('\n' + '='.repeat(60));
console.log('🔍 DIAGNÓSTICO COMPLETO');