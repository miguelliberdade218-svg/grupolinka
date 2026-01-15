import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./shared/schema";

// Para PostgreSQL, usamos a URL de conexão do .env
const connectionString = process.env.DATABASE_URL || 'postgresql://linka_user:@localhost:5432/linka2_database';

console.log('🔧 [PostgreSQL] Conectando ao banco:', connectionString);

// Criar conexão PostgreSQL
const sql = postgres(connectionString, { 
  max: 10, // Número máximo de conexões
  idle_timeout: 30, // Tempo máximo de inatividade
  connect_timeout: 30 // Tempo máximo de conexão
});

export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development' // Log queries em desenvolvimento
});

console.log('✅ [PostgreSQL] Conexão estabelecida com sucesso!');