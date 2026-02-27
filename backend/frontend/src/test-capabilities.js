// Script para testar capacidades do usuário
console.log('🔍 Testando capacidades do usuário...');

// Verificar localStorage
try {
  const token = localStorage.getItem('token');
  const capabilitiesStr = localStorage.getItem('userCapabilities');
  
  console.log('📊 Status do localStorage:');
  console.log('- Token presente:', !!token);
  console.log('- Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');
  console.log('- Capacidades presentes:', !!capabilitiesStr);
  
  if (capabilitiesStr) {
    try {
      const capabilities = JSON.parse(capabilitiesStr);
      console.log('🎯 Capacidades do usuário:');
      console.log('- canBookServices:', capabilities.canBookServices);
      console.log('- canDrive:', capabilities.canDrive);
      console.log('- canManageHotels:', capabilities.canManageHotels);
      console.log('- isAdmin:', capabilities.isAdmin);
      console.log('- Objeto completo:', capabilities);
      
      // Verificar se é admin
      if (capabilities.isAdmin) {
        console.log('✅ USUÁRIO É ADMIN!');
        console.log('🔗 Acesse: http://localhost:5173/admin');
      } else {
        console.log('❌ Usuário NÃO é admin');
        console.log('💡 Execute no banco de dados:');
        console.log('UPDATE users SET is_admin = true, roles = array_append(roles, \'admin\') WHERE email = \'edsondaniel8@gmail.com\';');
      }
    } catch (error) {
      console.error('❌ Erro ao parsear capacidades:', error);
    }
  } else {
    console.log('⚠️ Nenhuma capacidade encontrada no localStorage');
    console.log('💡 Faça logout e login novamente para carregar capacidades');
  }
  
  // Verificar também o campo isAdmin separado (para compatibilidade)
  const isAdminFlag = localStorage.getItem('isAdmin');
  console.log('\n🔍 Campo isAdmin separado:');
  console.log('- isAdmin flag:', isAdminFlag);
  
} catch (error) {
  console.error('❌ Erro ao testar capacidades:', error);
}

// Instruções
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Se o usuário NÃO é admin, execute no banco:');
console.log('   psql postgresql://linka_user:@localhost:5432/linka2_database -c \"UPDATE users SET is_admin = true, roles = array_append(roles, \'admin\') WHERE email = \'edsondaniel8@gmail.com\';\"');
console.log('\n2. Faça logout e login novamente');
console.log('\n3. Execute este script novamente para verificar');