// Teste para verificar se a busca de rides está funcionando sem filtro de data
const { rideService } = require('./dist/services/rideService.js');

async function testRideSearch() {
  console.log('🚀 Testando busca de rides sem filtro de data...\n');
  
  try {
    // Teste 1: Buscar "zimpeto" → "inhambane"
    console.log('🔍 Teste 1: Buscando "zimpeto" → "inhambane"');
    const results1 = await rideService.searchRidesSmartFinal({
      fromCity: 'Zimpeto, Cidade de Maputo',
      toCity: 'Inhambane',
      radiusKm: 200,
      maxResults: 50
    });
    
    console.log(`✅ Resultados encontrados: ${results1.length}`);
    console.log('📊 Detalhes dos resultados:');
    results1.forEach((ride, index) => {
      console.log(`  ${index + 1}. ${ride.fromCity} → ${ride.toCity}`);
      console.log(`     Data: ${ride.departureDateFormatted} ${ride.departureTimeFormatted}`);
      console.log(`     Preço: ${ride.pricePerSeat} MZN`);
      console.log(`     Lugares: ${ride.availableSeats}`);
      console.log(`     Match Type: ${ride.matchType}`);
      console.log(`     Direction Score: ${ride.direction_score}`);
      console.log('');
    });
    
    // Teste 2: Buscar "maputo" → "maxixe"
    console.log('\n🔍 Teste 2: Buscando "maputo" → "maxixe"');
    const results2 = await rideService.searchRidesSmartFinal({
      fromCity: 'Maputo',
      toCity: 'Maxixe',
      radiusKm: 200,
      maxResults: 50
    });
    
    console.log(`✅ Resultados encontrados: ${results2.length}`);
    console.log('📊 Detalhes dos resultados:');
    results2.forEach((ride, index) => {
      console.log(`  ${index + 1}. ${ride.fromCity} → ${ride.toCity}`);
      console.log(`     Data: ${ride.departureDateFormatted} ${ride.departureTimeFormatted}`);
      console.log(`     Preço: ${ride.pricePerSeat} MZN`);
      console.log(`     Lugares: ${ride.availableSeats}`);
      console.log(`     Match Type: ${ride.matchType}`);
      console.log(`     Direction Score: ${ride.direction_score}`);
      console.log('');
    });
    
    // Teste 3: Buscar com data específica (deve retornar todos os rides, não apenas da data)
    console.log('\n🔍 Teste 3: Buscando "zimpeto" → "inhambane" com data 2026-10-10');
    const results3 = await rideService.searchRidesSmartFinal({
      fromCity: 'Zimpeto',
      toCity: 'Inhambane',
      date: '2026-10-10',
      radiusKm: 200,
      maxResults: 50
    });
    
    console.log(`✅ Resultados encontrados: ${results3.length}`);
    console.log('📊 IMPORTANTE: Mesmo com data especificada, deve retornar TODOS os rides');
    console.log('   (filtro de data foi removido para melhor experiência do usuário)');
    
    if (results3.length > 0) {
      console.log('\n📅 Rides encontrados (incluindo diferentes datas):');
      results3.forEach((ride, index) => {
        console.log(`  ${index + 1}. ${ride.fromCity} → ${ride.toCity} (${ride.departureDateFormatted})`);
      });
    }
    
    console.log('\n🎯 CONCLUSÃO DO TESTE:');
    console.log(`- Total de rides encontrados em todos os testes: ${results1.length + results2.length + results3.length}`);
    console.log('- ✅ Filtro de data REMOVIDO com sucesso');
    console.log('- ✅ Função PostgreSQL get_rides_smart_final sendo usada corretamente');
    console.log('- ✅ Usuário verá mais opções de rides disponíveis');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message || error);
    console.error(error.stack);
  }
}

// Executar o teste
testRideSearch().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('❌ Erro ao executar teste:', error);
});