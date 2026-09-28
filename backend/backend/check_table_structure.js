const { db } = require('./db.js');
const { sql } = require('drizzle-orm');

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela hotelBookings...');
    
    const result = await db.execute(sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'hotelBookings' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estrutura da tabela hotelBookings:');
    console.table(result.rows);
    
    // Verificar constraints
    const constraints = await db.execute(sql`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'hotelBookings'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    console.log('\n🔗 Constraints da tabela hotelBookings:');
    console.table(constraints.rows);
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();