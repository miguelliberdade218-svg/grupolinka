import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8001';

async function testAllEndpoints() {
  console.log('🧪 Testando TODOS os endpoints da API v2\n');
  
  const endpoints = [
    {
      name: 'Busca de hotéis',
      url: `${BASE_URL}/api/v2/hotels/search?location=Maputo&guests=2`,
      method: 'GET'
    },
    {
      name: 'Listar hotéis',
      url: `${BASE_URL}/api/v2/hotels?limit=2`,
      method: 'GET'
    },
    {
      name: 'Health check',
      url: `${BASE_URL}/api/health-check`,
      method: 'GET'
    },
    {
      name: 'Teste PostGIS',
      url: `${BASE_URL}/api/test-postgis`,
      method: 'GET'
    },
    {
      name: 'Sugestões localidades',
      url: `${BASE_URL}/api/locations/suggest?query=map`,
      method: 'GET'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testando: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, { method: endpoint.method });
      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Sucesso: ${data.success !== undefined ? data.success : 'N/A'}`);
      
      if (data.count !== undefined) {
        console.log(`   Quantidade: ${data.count}`);
      }
      
      if (data.success === false) {
        console.log(`   ❌ Erro: ${data.error || 'Desconhecido'}`);
      } else {
        console.log(`   ✅ OK`);
      }
      
    } catch (error) {
      console.log(`   ❌ Falha: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Testes completados!');
}

// Testar também as funções específicas
async function testHotelDetails() {
  console.log('\n🏨 Testando detalhes de hotéis...');
  
  try {
    // Primeiro buscar hotéis
    const searchResponse = await fetch(`${BASE_URL}/api/v2/hotels/search?location=Maputo&guests=2&limit=1`);
    const searchData = await searchResponse.json();
    
    if (searchData.success && searchData.data.length > 0) {
      const hotel = searchData.data[0];
      const hotelId = hotel.hotel_id;
      
      console.log(`Hotel encontrado: ${hotel.hotel_name} (ID: ${hotelId})`);
      
      // Testar endpoint de hotel por ID
      const hotelByIdResponse = await fetch(`${BASE_URL}/api/v2/hotels/${hotelId}`);
      const hotelByIdData = await hotelByIdResponse.json();
      
      console.log(`Detalhes por ID: ${hotelByIdData.success ? '✅' : '❌'}`);
      
      if (hotel.available_room_types && hotel.available_room_types.length > 0) {
        const roomType = hotel.available_room_types[0];
        
        // Testar disponibilidade
        const availabilityParams = new URLSearchParams({
          hotelId: hotelId,
          roomTypeId: roomType.room_type_id,
          checkIn: '2025-12-29',
          checkOut: '2026-01-01',
          units: '1'
        });
        
        const availabilityUrl = `${BASE_URL}/api/v2/hotels/availability?${availabilityParams}`;
        console.log(`\n📅 Testando disponibilidade: ${availabilityUrl}`);
        
        const availabilityResponse = await fetch(availabilityUrl);
        const availabilityData = await availabilityResponse.json();
        
        console.log(`Disponibilidade: ${availabilityData.success ? '✅' : '❌'}`);
        if (availabilityData.data) {
          console.log(`   Disponível: ${availabilityData.data.is_available}`);
          console.log(`   Preço total: ${availabilityData.data.total_price || 'N/A'}`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Erro nos detalhes: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTES COMPLETOS DA API v2\n');
  console.log(`📡 Servidor: ${BASE_URL}`);
  console.log(`🕐 ${new Date().toLocaleString()}\n`);
  
  await testAllEndpoints();
  await testHotelDetails();
  
  console.log('\n🏁 Todos os testes finalizados!');
}

// Executar se for o módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testAllEndpoints, testHotelDetails };
