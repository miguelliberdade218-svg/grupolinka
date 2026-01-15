// Teste simples para verificar a API de hotéis
const fetch = require('node-fetch');

async function testHotelsAPI() {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🧪 Testando API de hotéis...');
  
  try {
    // Teste 1: Health check
    console.log('\n1. Testando health check...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    
    // Teste 2: Listar hotéis
    console.log('\n2. Testando listagem de hotéis...');
    const hotelsResponse = await fetch(`${baseUrl}/api/hotels`);
    const hotelsData = await hotelsResponse.json();
    
    if (hotelsData.success) {
      console.log(`✅ Hotéis encontrados: ${hotelsData.data?.length || 0}`);
      console.log('📊 Paginação:', hotelsData.pagination);
      
      if (hotelsData.data && hotelsData.data.length > 0) {
        // Teste 3: Buscar hotel específico
        const firstHotel = hotelsData.data[0];
        console.log(`\n3. Testando busca de hotel específico (ID: ${firstHotel.id})...`);
        
        const hotelResponse = await fetch(`${baseUrl}/api/hotels/${firstHotel.id}`);
        const hotelData = await hotelResponse.json();
        
        if (hotelData.success) {
          console.log(`✅ Hotel encontrado: ${hotelData.data.name}`);
          console.log(`📍 Localidade: ${hotelData.data.locality}, ${hotelData.data.province}`);
          console.log(`⭐ Rating: ${hotelData.data.rating}`);
          console.log(`🛏️  Tipos de quarto: ${hotelData.data.roomTypes?.length || 0}`);
        } else {
          console.log('❌ Erro ao buscar hotel:', hotelData.message);
        }
      }
    } else {
      console.log('❌ Erro ao listar hotéis:', hotelsData.message);
    }
    
    // Teste 4: Testar PostGIS
    console.log('\n4. Testando PostGIS...');
    const postgisResponse = await fetch(`${baseUrl}/api/test-postgis`);
    const postgisData = await postgisResponse.json();
    
    if (postgisData.success) {
      console.log(`✅ PostGIS ativo: ${postgisData.postgis}`);
      console.log(`📏 Distância testada: ${postgisData.distanceTest?.meters || 0} metros`);
    } else {
      console.log('❌ PostGIS inativo:', postgisData.message);
    }
    
    // Teste 5: Testar sugestões de localização
    console.log('\n5. Testando sugestões de localização...');
    const suggestionsResponse = await fetch(`${baseUrl}/api/locations/suggest?query=map`);
    const suggestionsData = await suggestionsResponse.json();
    
    if (suggestionsData.success) {
      console.log(`✅ Sugestões encontradas: ${suggestionsData.totalResults}`);
      if (suggestionsData.data && suggestionsData.data.length > 0) {
        console.log('📍 Primeira sugestão:', suggestionsData.data[0].name);
      }
    } else {
      console.log('❌ Erro nas sugestões:', suggestionsData.error);
    }
    
    console.log('\n🎉 Todos os testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log('💡 Verifique se o servidor está rodando na porta 8000');
    console.log('💡 Execute: npm run dev ou node index.ts');
  }
}

// Executar teste
testHotelsAPI();