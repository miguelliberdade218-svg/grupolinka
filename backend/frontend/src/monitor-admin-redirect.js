// MONITORAMENTO DE REDIRECIONAMENTO NO ADMIN
console.log('🎯 MONITORAMENTO DE REDIRECIONAMENTO ADMIN ATIVADO');
console.log('='.repeat(60));

// 1. Monitorar mudanças no localStorage
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
  console.log(`📝 localStorage.setItem: ${key} =`, 
    key.includes('token') ? value?.substring(0, 30) + '...' : value);
  return originalSetItem.apply(this, arguments);
};

localStorage.removeItem = function(key) {
  console.log(`🗑️ localStorage.removeItem: ${key}`);
  if (key === 'token' || key === 'userCapabilities') {
    console.warn(`⚠️ ATENÇÃO: ${key} está sendo removido!`);
    console.trace('Stack trace:');
  }
  return originalRemoveItem.apply(this, arguments);
};

// 2. Monitorar mudanças de location
let lastHref = window.location.href;
const originalLocationAssign = window.location.assign;
const originalLocationReplace = window.location.replace;
const originalLocationHrefSet = Object.getOwnPropertyDescriptor(window.location, 'href').set;

window.location.assign = function(url) {
  console.log(`🔄 window.location.assign: ${url}`);
  console.trace('Stack trace:');
  return originalLocationAssign.apply(this, arguments);
};

window.location.replace = function(url) {
  console.log(`🔄 window.location.replace: ${url}`);
  console.trace('Stack trace:');
  return originalLocationReplace.apply(this, arguments);
};

Object.defineProperty(window.location, 'href', {
  set: function(url) {
    console.log(`🔄 window.location.href = ${url}`);
    console.trace('Stack trace:');
    return originalLocationHrefSet.call(this, url);
  },
  get: Object.getOwnPropertyDescriptor(window.location, 'href').get
});

// 3. Monitorar mudanças de URL
const observer = new MutationObserver(() => {
  if (window.location.href !== lastHref) {
    console.log(`🌐 URL mudou: ${lastHref} -> ${window.location.href}`);
    lastHref = window.location.href;
  }
});

observer.observe(document, { subtree: true, childList: true });

// 4. Monitorar eventos de auth
window.addEventListener('storage', (e) => {
  console.log(`📦 storage event: ${e.key}`, e.newValue ? 'alterado' : 'removido');
});

// 5. Status inicial
console.log('\n📊 STATUS INICIAL:');
console.log('- URL:', window.location.href);
console.log('- Token:', !!localStorage.getItem('token'));
console.log('- Capacidades:', JSON.parse(localStorage.getItem('userCapabilities') || '{}'));

// 6. Função para verificar status periodicamente
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

// Verificar a cada 2 segundos
setInterval(checkStatus, 2000);

// 7. Instruções
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Este script monitora todas as mudanças no localStorage e URL');
console.log('2. Verifique o console quando o redirecionamento acontecer');
console.log('3. A stack trace mostrará QUEM está causando o redirecionamento');
console.log('\nPara desativar:');
console.log('localStorage.setItem = originalSetItem;');
console.log('localStorage.removeItem = originalRemoveItem;');
console.log('observer.disconnect();');

console.log('\n' + '='.repeat(60));
console.log('🎯 MONITORAMENTO ATIVO');