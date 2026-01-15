import pg from 'pg';
const { Client } = pg;

async function checkHotelColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔍 Verificando colunas da tabela hotels...');
    
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'hotels' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Colunas da tabela hotels:');
    console.log('=' .repeat(50));
    res.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    console.log('=' .repeat(50));
    console.log(`Total: ${res.rows.length} colunas`);
    
    // Verificar também a tabela hotels no schema public
    const res2 = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'hotels' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    if (res2.rows.length > 0) {
      console.log('\n📊 Colunas da tabela public.hotels:');
      console.log('=' .repeat(50));
      res2.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkHotelColumns();