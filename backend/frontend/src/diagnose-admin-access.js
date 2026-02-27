// Script de diagnóstico para acesso admin
console.log('🔍 DIAGNÓSTICO DE ACESSO ADMIN');
console.log('='.repeat(50));

// 1. Verificar localStorage
try {
  console.log('📊 1. LOCALSTORAGE:');
  
  const token = localStorage.getItem('token');
  const capabilitiesStr = localStorage.getItem('userCapabilities');
  const userStr = localStorage.getItem('user');
  
  console.log('- Token presente:', !!token);
  console.log('- Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');
  console.log('- userCapabilities presente:', !!capabilitiesStr);
  console.log('- user presente:', !!userStr);
  
  if (capabilitiesStr) {
    try {
      const capabilities = JSON.parse(capabilitiesStr);
      console.log('\n🎯 CAPACIDADES:');
      console.log('- canBookServices:', capabilities.canBookServices);
      console.log('- canDrive:', capabilities.canDrive);
      console.log('- canManageHotels:', capabilities.canManageHotels);
      console.log('- isAdmin:', capabilities.isAdmin);
      console.log('- Objeto completo:', capabilities);
      
      if (capabilities.isAdmin) {
        console.log('✅ USUÁRIO É ADMIN NO LOCALSTORAGE!');
      } else {
        console.log('❌ Usuário NÃO é admin no localStorage');
      }
    } catch (error) {
      console.error('❌ Erro ao parsear capacidades:', error);
    }
  }
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('\n👤 DADOS DO USUÁRIO:');
      console.log('- Email:', user.email);
      console.log('- UID:', user.uid);
    } catch (error) {
      console.error('❌ Erro ao parsear user:', error);
    }
  }
} catch (error) {
  console.error('❌ Erro ao verificar localStorage:', error);
}

// 2. Verificar URL atual
console.log('\n🌐 2. URL ATUAL:');
console.log('- URL completa:', window.location.href);
console.log('- Origin:', window.location.origin);
console.log('- Pathname:', window.location.pathname);
console.log('- Hostname:', window.location.hostname);

// 3. Verificar getCurrentDomains
console.log('\n🔗 3. DOMÍNIOS:');
try {
  // Tentar importar dinamicamente
  import('/src/shared/utils/constants.ts').then(module => {
    if (module.getCurrentDomains) {
      const domains = module.getCurrentDomains();
      console.log('- Domínios:', domains);
      console.log('- Domínio atual:', window.location.origin);
      console.log('- É domínio admin?', domains.admin === window.location.origin);
    }
  }).catch(error => {
    console.log('- Não foi possível importar getCurrentDomains:', error.message);
  });
} catch (error) {
  console.log('- Erro ao verificar domínios:', error.message);
}

// 4. Verificar hasCapability
console.log('\n🔐 4. HAS CAPABILITY:');
try {
  import('/src/shared/lib/firebaseConfig.ts').then(module => {
    if (module.hasCapability) {
      console.log('- hasCapability("isAdmin"):', module.hasCapability('isAdmin'));
      console.log('- hasCapability("canDrive"):', module.hasCapability('canDrive'));
      console.log('- hasCapability("canManageHotels"):', module.hasCapability('canManageHotels'));
    }
  }).catch(error => {
    console.log('- Não foi possível importar hasCapability:', error.message);
  });
} catch (error) {
  console.log('- Erro ao verificar hasCapability:', error.message);
}

// 5. Instruções
console.log('\n📋 5. INSTRUÇÕES:');
console.log('\nSe o usuário NÃO é admin no localStorage:');
console.log('1. Execute no banco:');
console.log('   psql postgresql://linka_user:@localhost:5432/linka2_database -c \"UPDATE users SET is_admin = true WHERE email = \'edsondaniel8@gmail.com\';\"');
console.log('\n2. Limpe localStorage e faça login novamente:');
console.log('   localStorage.clear();');
console.log('   location.reload();');
console.log('\n3. Execute este diagnóstico novamente');

console.log('\n🔍 6. VERIFICAÇÃO MANUAL:');
console.log('Execute no console:');
console.log('\n// Verificar capacidades');
console.log('const caps = JSON.parse(localStorage.getItem(\'userCapabilities\') || \'{}\');');
console.log('console.log(\'isAdmin:\', caps.isAdmin);');
console.log('\n// Forçar atualização');
console.log('localStorage.removeItem(\'userCapabilities\');');
console.log('location.reload();');

console.log('\n' + '='.repeat(50));
console.log('🔍 DIAGNÓSTICO COMPLETO');