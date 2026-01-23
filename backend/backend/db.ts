// ===== CARREGAMENTO DO .env NO TOPO (obrigatório!) =====
import 'dotenv/config'; // Carrega .env ANTES de qualquer uso de process.env

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./shared/schema";

// Debug forte para confirmar .env
console.log('DEBUG DB [dotenv carregado] - DATABASE_URL:', 
  process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.replace(/:.*@/, ':****@') 
    : 'NÃO ENCONTRADA NO .env! Verifique arquivo .env e dotenv import'
);

// Validação obrigatória
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL não definida no .env');
  process.exit(1); // Para o servidor se .env estiver errado
}

const connectionString = process.env.DATABASE_URL;

console.log('🔧 [PostgreSQL] Conectando ao banco:', 
  connectionString.replace(/:.*@/, ':****@') // mascara senha no log
);

// Cria pool PostgreSQL com boas práticas
const sql = postgres(connectionString, { 
  max: 20,                    // Máximo de conexões simultâneas
  idle_timeout: 30,           // Fecha conexões inativas após 30s
  connect_timeout: 10,        // Timeout de conexão
  // SSL para produção (Railway, etc.)
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  // Debug queries em dev
  debug: process.env.NODE_ENV === 'development',
});

export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development' 
    ? true 
    : false, // Mostra queries no console em dev
});

console.log('✅ [PostgreSQL] Conexão estabelecida com sucesso!');