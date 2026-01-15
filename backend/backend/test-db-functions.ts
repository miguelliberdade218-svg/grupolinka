import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://linka_user:@localhost:5432/linka2_database';

async function testDirectDatabase() {
  console.log('🧪 Testando funções PostgreSQL diretamente...\n');
  
  const pool = new Pool({
    connectionString
  });

  try {
    // Teste 1: Listar todas as funções do schema
    console.log('1. Verificando funções disponíveis:');
    const functionsResult = await pool.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
        AND routine_name LIKE '%hotel%'
        OR routine_name LIKE '%search%'
        OR routine_name LIKE '%availability%'
        OR routine_name LIKE '%booking%'
      ORDER BY routine_name;
    `);
    
    console.log(`✅ ${functionsResult.rows.length} funções relacionadas a hotéis encontradas:`);
    functionsResult.rows.forEach((func: any) => {
      console.log(`   - ${func.routine_name} (${func.routine_type})`);
    });
    
    // Teste 2: Testar busca simples
    console.log('\n2. Testando busca básica:');
    try {
      const simpleSearch = await pool.query(`
        SELECT * FROM search_hotels_simple('Maputo');
      `);
      
      console.log(`✅ Busca simples: ${simpleSearch.rows.length} resultados`);
    } catch (error: any) {
      console.log('⚠️  Busca simples não disponível, tentando função completa...');
    }
    
    // Teste 3: Testar busca completa
    console.log('\n3. Testando busca completa:');
    try {
      const fullSearch = await pool.query(`
        SELECT * FROM search_hotels_smart_professional(
          search_location := 'Maputo',
          search_radius_km := 20,
          check_in_date := CURRENT_DATE + INTERVAL '1 day',
          check_out_date := CURRENT_DATE + INTERVAL '3 days',
          guests := 2,
          max_results := 3
        );
      `);
      
      console.log(`✅ Busca completa: ${fullSearch.rows.length} resultados`);
      if (fullSearch.rows.length > 0) {
        fullSearch.rows.forEach((hotel: any, i: number) => {
          console.log(`   ${i+1}. ${hotel.hotel_name} - ${hotel.distance_km}km - ${hotel.min_price_per_night} MZN`);
        });
      }
    } catch (error: any) {
      console.error('❌ Erro na busca completa:', error.message);
    }
    
    // Teste 4: Verificar dados de teste
    console.log('\n4. Verificando dados de teste:');
    
    // Ver hotéis
    const hotelsCount = await pool.query(`SELECT COUNT(*) as count FROM hotels WHERE is_active = true`);
    console.log(`   Hotéis ativos: ${hotelsCount.rows[0].count}`);
    
    // Ver room types
    const roomTypesCount = await pool.query(`SELECT COUNT(*) as count FROM room_types WHERE is_active = true`);
    console.log(`   Tipos de quarto: ${roomTypesCount.rows[0].count}`);
    
    // Ver disponibilidade
    const availabilityCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM room_availability 
      WHERE date >= CURRENT_DATE 
        AND date <= CURRENT_DATE + INTERVAL '30 days'
    `);
    console.log(`   Registros de disponibilidade (próximos 30 dias): ${availabilityCount.rows[0].count}`);
    
    console.log('\n🎉 Testes do banco completados com sucesso!');
    
  } catch (error: any) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar teste
testDirectDatabase();
