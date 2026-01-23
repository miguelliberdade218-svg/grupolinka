// src/jobs/availabilityJob.ts
import PgBoss from 'pg-boss';
import { db } from '../../db'; 
import { roomTypes } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { initializeAvailability } from '../modules/hotels/roomTypeService';

// Configurações ajustadas à sua realidade
const BOSS_SCHEMA = 'pgboss'; // schema padrão do pg-boss
const MAX_DAYS_FUTURE = 730;   // 2 anos – leve e suficiente
const MAX_YEARS_FUTURE = 10;   // limite suave para alertas no frontend
const JOB_NAME = 'initialize-availability-weekly';

// Inicializa pg-boss usando a mesma DATABASE_URL do seu app
const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL!,
  schema: BOSS_SCHEMA,
  // Configurações suportadas e recomendadas
  retryLimit: 5,                // máximo de tentativas por job
  retryDelay: 1000 * 60,        // 1 minuto entre tentativas
  application_name: 'LinkA-AvailabilityJob',  // nome da app (com underscore!)
  deleteAfterSeconds: 60 * 60 * 24 * 7,  // deleta jobs concluídos após 7 dias
});

// Função principal do job
async function runAvailabilityInitialization() {
  console.log('🔄 [PG-BOSS] Iniciando pré-criação de disponibilidade (até 2 anos)');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + MAX_DAYS_FUTURE);

  // Limite suave: não ultrapassa 10 anos
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + MAX_YEARS_FUTURE);
  if (endDate > maxFutureDate) {
    endDate.setTime(maxFutureDate.getTime());
    console.log(`⚠️ Limitado a ${MAX_YEARS_FUTURE} anos no futuro`);
  }

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Busca roomTypes ativos
  const activeRoomTypes = await db
    .select({
      id: roomTypes.id,
      hotel_id: roomTypes.hotel_id,
      total_units: roomTypes.total_units,
      base_price: roomTypes.base_price,
      min_nights_default: roomTypes.min_nights_default,
    })
    .from(roomTypes)
    .where(eq(roomTypes.is_active, true));

  let totalCreated = 0;

  for (const rt of activeRoomTypes) {
    try {
      // ✅ CORREÇÃO APLICADA: Mudando de 0 para null
      // Isso faz com que a função initializeAvailability use o base_price do room_type
      const created = await initializeAvailability(
        rt.id,
        startStr,
        endStr,
        null,                          // ✅ CORREÇÃO: null em vez de 0 → usa base_price do room_type
        rt.total_units || 1,
        rt.min_nights_default || 1
      );
      totalCreated += created;
      console.log(`✅ Criados ${created} registros para roomType ${rt.id} (${rt.total_units || '?'} unid.)`);
    } catch (err) {
      console.error(`❌ Erro no roomType ${rt.id}:`, err);
      // pg-boss faz retry automático
    }
  }

  console.log(`✅ Job finalizado: ${totalCreated} registros criados no total`);
}

// Exporta para usar no app principal
export { boss, runAvailabilityInitialization, JOB_NAME };