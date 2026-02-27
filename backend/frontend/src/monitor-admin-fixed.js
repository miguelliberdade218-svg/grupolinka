// MONITORAMENTO CORRIGIDO - SEM LOOP INFINITO
console.log('🎯 MONITORAMENTO CORRIGIDO ATIVADO');
console.log('='.repeat(60));

// 1. Status inicial
console.log('📊 STATUS INICIAL:');
console.log('- URL:', window.location.href);
console.log('- Token:', !!localStorage.getItem('token'));
console.log('- Capacidades:', JSON.parse(localStorage.getItem('userCapabilities') || '{}'));

// 2. Monitorar mudanças no localStorage (SEM CAUSAR LOOP)
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
  const shouldLog = key === 'token' || key === 'userCapabilities' || key === 'user';
  if (shouldLog) {
    console.log(`📝 localStorage.setItem: ${key} =`, 
      key === 'token' ? (value ? '***TOKEN***' : 'null') : 
      key === 'userCapabilities' ? JSON.parse(value) : 
      '***OUTRO***');
  }
  return originalSetItem.call(this, key, value);
};

localStorage.removeItem = function(key) {
  const shouldLog = key === 'token' || key === 'userCapabilities' || key === 'user';
  if (shouldLog) {
    console.log(`🗑️ localStorage.removeItem: ${key}`);
    console.trace('Stack trace:');
  }
  return originalRemoveItem.call(this, key);
};

// 3. Monitorar mudanças de URL
let lastHref = window.location.href;
const checkUrlChange = () => {
  if (window.location.href !== lastHref) {
    console.log(`🌐 URL mudou: ${lastHref} -> ${window.location.href}`);
    console.trace('Stack trace:');
    lastHref = window.location.href;
  }
};
setInterval(checkUrlChange, 100);

// 4. Monitorar eventos de storage
window.addEventListener('storage', (e) => {
  console.log(`📦 storage event: ${e.key}`, e.newValue ? 'alterado' : 'removido');
});

// 5. Verificar status periodicamente
let checkCount = 0;
const checkStatus = () => {
  checkCount++;
  console.log(`\n🔍 CHECK #${checkCount} (${new Date().toLocaleTimeString()}):`);
  console.log('- URL:', window.location.href);
  console.log('- Token:', !!localStorage.getItem('token'));
  
  const caps = JSON.parse(localStorage.getItem('userCapabilities') || '{}');
  console.log('- Capacidades:', caps);
  console.log('- isAdmin:', caps.isAdmin);
  
  if (!localStorage.getItem('token')) {
    console.warn('⚠️ TOKEN PERDIDO!');
  }
  
  if (caps.isAdmin !== true) {
    console.warn('⚠️ isAdmin NÃO É TRUE!');
  }
};

setInterval(checkStatus, 2000);

// 6. Instruções
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Monitoramento ativo sem loop infinito');
console.log('2. Faça login normalmente');
console.log('3. Acesse /admin');
console.log('4. Observe os logs');

console.log('\n' + '='.repeat(60));
console.log('🎯 MONITORAMENTO ATIVO');