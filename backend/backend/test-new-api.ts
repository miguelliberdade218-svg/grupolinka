import { Pool } from 'pg';
import fetch from 'node-fetch';

const connectionString = process.env.DATABASE_URL || 'postgresql://linka_user:@localhost:5432/linka2_database';

async function testDatabaseFunctions() {
  console.log('🧪 Testando novo sistema de hotéis diretamente no banco...\n');
  
  const pool = new Pool({
    connectionString
  });

  try {
    // Teste 1: Buscar hotéis
    console.log('1. Testando busca de hotéis:');
    const searchResult = await pool.query(`
      SELECT * FROM search_hotels_smart_professional(
        search_location := 'Maputo',
        check_in_date := '2025-12-29',
        check_out_date := '2026-01-01',
        guests := 2,
        max_results := 5
      );
    `);
    
    console.log(`✅ Encontrados ${searchResult.rows.length} hotéis`);
    searchResult.rows.forEach((hotel: any, i: number) => {
      console.log(`   ${i+1}. ${hotel.hotel_name} - ${hotel.min_price_per_night} MZN`);
    });
    
    // Teste 2: Verificar disponibilidade
    console.log('\n2. Testando disponibilidade:');
    if (searchResult.rows.length > 0) {
      const hotel = searchResult.rows[0];
      const roomTypes = hotel.available_room_types;
      
      if (roomTypes && roomTypes.length > 0) {
        const roomType = roomTypes[0];
        
        const availabilityResult = await pool.query(`
          SELECT * FROM check_hotel_availability_detailed(
            p_hotel_id := $1::uuid,
            p_room_type_id := $2::uuid,
            p_check_in := '2025-12-29',
            p_check_out := '2026-01-01',
            p_units := 1
          );
        `, [hotel.hotel_id, roomType.room_type_id]);
        
        if (availabilityResult.rows[0]?.is_available) {
          console.log(`✅ Disponível! Preço total: ${availabilityResult.rows[0].total_price} MZN`);
        } else {
          console.log('❌ Não disponível');
          console.log('   Motivo:', availabilityResult.rows[0]?.message);
        }
      }
    }
    
    // Teste 3: Funções administrativas
    console.log('\n3. Testando funções administrativas:');
    
    // Obter estatísticas de um hotel
    if (searchResult.rows.length > 0) {
      const statsResult = await pool.query(`
        SELECT * FROM get_hotel_stats($1::uuid);
      `, [searchResult.rows[0]?.hotel_id]);
      
      if (statsResult.rows[0]) {
        console.log('✅ Estatísticas obtidas com sucesso');
        console.log('   - Total bookings:', statsResult.rows[0].total_bookings);
        console.log('   - Total revenue:', statsResult.rows[0].total_revenue);
      }
    }
    
    console.log('\n🎉 Testes de banco de dados passaram!');
    
  } catch (error: any) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

async function testAPIEndpoints() {
  console.log('\n🧪 Testando endpoints da API v2...\n');
  
  const BASE_URL = 'http://localhost:3000';
  
  try {
    // Teste 1: Buscar hotéis
    console.log('1. Testando busca de hotéis via API:');
    const searchUrl = `${BASE_URL}/api/v2/hotels/search?location=Maputo&guests=2`;
    
    console.log('   URL:', searchUrl);
    const searchResponse = await fetch(searchUrl);
    const searchResult = await searchResponse.json();
    
    console.log('   Status:', searchResponse.status);
    
    if (searchResult.success) {
      console.log(`✅ Sucesso! Encontrados ${searchResult.count} hotéis`);
      if (searchResult.data && searchResult.data.length > 0) {
        const hotel = searchResult.data[0];
        console.log(`   Primeiro hotel: ${hotel.hotel_name}`);
        console.log(`   Preço min: ${hotel.min_price_per_night} MZN`);
      }
    } else {
      console.log(`❌ Erro: ${searchResult.error}`);
    }
    
    // Teste 2: Obter todos os hotéis
    console.log('\n2. Testando obter todos os hotéis:');
    const allHotelsUrl = `${BASE_URL}/api/v2/hotels?limit=3`;
    const allHotelsResponse = await fetch(allHotelsUrl);
    const allHotelsResult = await allHotelsResponse.json();
    
    console.log('   Status:', allHotelsResponse.status);
    
    if (allHotelsResult.success) {
      console.log(`✅ Sucesso! ${allHotelsResult.count} hotéis listados`);
    } else {
      console.log(`❌ Erro: ${allHotelsResult.error}`);
    }
    
    // Teste 3: Health check
    console.log('\n3. Testando health check:');
    const healthUrl = `${BASE_URL}/api/health-check`;
    const healthResponse = await fetch(healthUrl);
    const healthResult = await healthResponse.json();
    
    if (healthResult.success) {
      console.log('✅ API saudável!');
      console.log('   Serviços:', Object.keys(healthResult.services).join(', '));
    }
    
    console.log('\n🎉 Testes da API completados!');
    
  } catch (error: any) {
    console.error('❌ Erro durante os testes da API:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTES COMPLETOS DO SISTEMA DE HOTÉIS v2\n');
  
  // Primeiro testar funções do banco
  await testDatabaseFunctions();
  
  // Depois testar API
  await testAPIEndpoints();
  
  console.log('\n🏁 Todos os testes finalizados!');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
