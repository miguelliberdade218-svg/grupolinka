// Script para forçar atualização de capacidades
console.log('🔄 FORÇANDO ATUALIZAÇÃO DE CAPACIDADES');
console.log('='.repeat(50));

// 1. Remover capacidades antigas
localStorage.removeItem('userCapabilities');
console.log('✅ Capacidades antigas removidas');

// 2. Verificar token
try {
  const token = localStorage.getItem('token');
  console.log('🔑 Token presente:', !!token);
  
  if (!token) {
    console.log('❌ Nenhum token encontrado. Faça login primeiro.');
    return;
  }
  
  // 3. Fazer requisição para obter capacidades
  console.log('🌐 Buscando capacidades do backend...');
  
  fetch('/api/auth/capabilities', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Status da resposta:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 Dados recebidos:', data);
    
    if (data.success && data.data) {
      // Salvar no localStorage
      localStorage.setItem('userCapabilities', JSON.stringify(data.data));
      console.log('✅ Capacidades salvas no localStorage:', data.data);
      
      // Verificar se é admin
      if (data.data.isAdmin) {
        console.log('🎉 USUÁRIO É ADMIN!');
        console.log('🔗 Acesse: /admin');
      } else {
        console.log('⚠️ Usuário NÃO é admin');
        console.log('💡 Execute no banco:');
        console.log('UPDATE users SET is_admin = true WHERE email = \'edsondaniel8@gmail.com\';');
      }
    } else {
      console.log('❌ Erro ao obter capacidades:', data);
    }
  })
  .catch(error => {
    console.error('❌ Erro na requisição:', error);
  });
  
} catch (error) {
  console.error('❌ Erro geral:', error);
}

// 4. Instruções
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Execute este script no console do navegador');
console.log('2. Verifique se as capacidades foram atualizadas');
console.log('3. Tente acessar /admin novamente');
console.log('\nPara executar manualmente:');
console.log('\n// Verificar capacidades');
console.log('const caps = JSON.parse(localStorage.getItem(\'userCapabilities\') || \'{}\');');
console.log('console.log(\'isAdmin:\', caps.isAdmin);');
console.log('\n// Forçar logout/login');
console.log('localStorage.clear();');
console.log('location.reload();');