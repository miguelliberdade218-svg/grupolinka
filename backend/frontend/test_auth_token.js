// Teste para verificar se o token está sendo salvo e recuperado corretamente

console.log('🔍 Testando sistema de autenticação...');

// Simular localStorage
const mockLocalStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value;
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Substituir localStorage global para teste
global.localStorage = mockLocalStorage;

// Testar chaves possíveis
const testKeys = ['firebaseToken', 'firebase_token', 'auth_token', 'token', 'authToken'];

console.log('📋 Chaves testadas:', testKeys);

// Teste 1: Token salvo como 'firebaseToken'
console.log('\n✅ Teste 1: Token salvo como "firebaseToken"');
localStorage.setItem('firebaseToken', 'eyJhbGciOiJSUzI1NiIs...mock-token...');
for (const key of testKeys) {
  const token = localStorage.getItem(key);
  if (token) {
    console.log(`   ✅ Token encontrado com chave: ${key} (${token.substring(0, 20)}...)`);
    break;
  }
}

// Teste 2: Token salvo como 'firebase_token'
console.log('\n✅ Teste 2: Token salvo como "firebase_token"');
localStorage.clear();
localStorage.setItem('firebase_token', 'eyJhbGciOiJSUzI1NiIs...mock-token-2...');
for (const key of testKeys) {
  const token = localStorage.getItem(key);
  if (token) {
    console.log(`   ✅ Token encontrado com chave: ${key} (${token.substring(0, 20)}...)`);
    break;
  }
}

// Teste 3: Nenhum token encontrado
console.log('\n❌ Teste 3: Nenhum token encontrado');
localStorage.clear();
let found = false;
for (const key of testKeys) {
  const token = localStorage.getItem(key);
  if (token) {
    console.log(`   ✅ Token encontrado com chave: ${key}`);
    found = true;
    break;
  }
}
if (!found) {
  console.log('   ❌ Nenhum token encontrado (comportamento esperado)');
}

// Teste 4: Verificar conteúdo do localStorage
console.log('\n📊 Teste 4: Conteúdo do localStorage');
localStorage.clear();
localStorage.setItem('firebaseToken', 'eyJhbGciOiJSUzI1NiIs...test-token...');
localStorage.setItem('user', JSON.stringify({ id: '123', email: 'test@example.com' }));
localStorage.setItem('userCapabilities', JSON.stringify({ canBookServices: true }));

console.log('   Conteúdo atual:');
for (const key in localStorage.store) {
  console.log(`   - ${key}: ${localStorage.getItem(key)?.substring(0, 30)}...`);
}

console.log('\n🎯 Testes concluídos!');
console.log('\n📝 Recomendações:');
console.log('1. Verifique se o token está sendo salvo como "firebaseToken" no useAuth.ts');
console.log('2. A função getAuthToken() deve procurar por "firebaseToken" primeiro');
console.log('3. Certifique-se de que o token não está vazio ou undefined');
console.log('4. Verifique se o usuário está realmente autenticado antes de tentar reservar');