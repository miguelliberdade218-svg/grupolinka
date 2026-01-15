const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testEndpoints() {
  console.log('🚀 Testando endpoints de Hotéis e Event Spaces...\n');

  try {
    // 1. Testar health check
    console.log('1. Testando Health Check...');
    const health = await axios.get(`${API_BASE}/health-check`);
    console.log('✅ Health Check:', health.data.status);

    // 2. Testar listagem de hotéis
    console.log('\n2. Testando listagem de hotéis...');
    try {
      const hotels = await axios.get(`${API_BASE}/hotels`);
      console.log(`✅ Hotéis encontrados: ${hotels.data.data?.length || 0}`);
    } catch (error) {
      console.log('⚠️  Listagem de hotéis:', error.response?.data || error.message);
    }

    // 3. Testar listagem de event spaces
    console.log('\n3. Testando listagem de event spaces...');
    try {
      const eventSpaces = await axios.get(`${API_BASE}/event-spaces`);
      console.log(`✅ Event Spaces encontrados: ${eventSpaces.data.data?.length || 0}`);
    } catch (error) {
      console.log('⚠️  Listagem de event spaces:', error.response?.data || error.message);
    }

    // 4. Testar PostGIS
    console.log('\n4. Testando PostGIS...');
    try {
      const postgis = await axios.get(`${API_BASE}/test-postgis`);
      console.log(`✅ PostGIS: ${postgis.data.postgis}`);
    } catch (error) {
      console.log('⚠️  PostGIS:', error.response?.data || error.message);
    }

    // 5. Testar sugestões de localização
    console.log('\n5. Testando sugestões de localização...');
    try {
      const suggestions = await axios.get(`${API_BASE}/locations/suggest?query=map`);
      console.log(`✅ Sugestões encontradas: ${suggestions.data.data?.length || 0}`);
    } catch (error) {
      console.log('⚠️  Sugestões:', error.response?.data || error.message);
    }

    console.log('\n🎯 Testes completos!');
    console.log('\n📋 Endpoints disponíveis:');
    console.log('- GET /api/hotels - Listar hotéis');
    console.log('- GET /api/event-spaces - Listar event spaces');
    console.log('- GET /api/test-postgis - Testar PostGIS');
    console.log('- GET /api/locations/suggest - Sugestões de localização');
    console.log('- GET /api/health-check - Health check completo');
    console.log('\n🔧 Para testar endpoints específicos:');
    console.log('curl http://localhost:8000/api/hotels');
    console.log('curl http://localhost:8000/api/event-spaces');
    console.log('curl "http://localhost:8000/api/locations/suggest?query=maputo"');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    console.log('\n⚠️  Verifique se o servidor está rodando:');
    console.log('cd backend && npm run dev');
  }
}

// Executar testes
testEndpoints().catch(console.error);