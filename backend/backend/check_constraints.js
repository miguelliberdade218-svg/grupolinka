import { db } from './db.js';
import { sql } from 'drizzle-orm';

async function checkConstraints() {
  try {
    console.log('🔍 Verificando constraints da tabela hotelBookings...');
    
    const result = await db.execute(sql`
      SELECT 
        tc.table_name, 
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
      ORDER BY tc.constraint_type, tc.constraint_name;
    `);
    
    console.log('📊 Constraints encontradas:');
    console.table(result.rows);
    
    // Verificar se há check constraints
    const checkConstraints = await db.execute(sql`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'hotelBookings'
        AND c.contype = 'c';
    `);
    
    console.log('\n✅ Check constraints:');
    console.table(checkConstraints.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkConstraints();