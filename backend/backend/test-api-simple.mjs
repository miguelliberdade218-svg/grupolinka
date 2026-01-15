import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8000';

async function testSimple() {
  console.log('🧪 Teste simples da API v2\n');
  
  try {
    console.log('1. Testando busca de hotéis...');
    const response = await fetch(`${BASE_URL}/api/v2/hotels/search?location=Maputo&guests=2`);
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Sucesso:', result.success);
    console.log('Quantidade:', result.count || 0);
    
    if (result.data && result.data.length > 0) {
      console.log('\nPrimeiros resultados:');
      result.data.slice(0, 3).forEach((hotel, i) => {
        console.log(`${i+1}. ${hotel.hotel_name} - ${hotel.min_price_per_night} MZN`);
      });
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('💡 Dica: Certifique-se que o servidor está rodando (npm run dev)');
  }
}

testSimple();
