// src/examples/event-spaces-example.ts
// Exemplo de uso do módulo de espaços de eventos

import { eventSpaceService } from '@/services/eventSpaceService';

// Exemplo 1: Criar um espaço de evento
export async function createExampleEventSpace(hotelId: string) {
  try {
    const eventSpaceData = {
      hotelId: hotelId, // ✅ hotelId como camelCase
      name: 'Salão Principal',
      description: 'Espaço elegante para eventos corporativos e sociais',
      capacity_min: 50,
      capacity_max: 300,
      price_per_hour: '500.00',
      price_per_day: '2500.00',
      price_per_event: '5000.00',
      space_type: 'conference',
      natural_light: true,
      has_stage: true,
      loading_access: true,
      insurance_required: false,
      alcohol_allowed: true,
      approval_required: true,
      includes_catering: false,
      includes_furniture: true,
      includes_cleaning: true,
      includes_security: false,
      is_active: true,
      is_featured: true,
      amenities: ['Projetor', 'Sonorização', 'WiFi', 'Ar Condicionado'],
      event_types: ['conference', 'meeting', 'wedding', 'party'],
      images: [],
      weekend_surcharge_percent: 20
    };

    console.log('📤 Criando espaço de evento...');
    const response = await eventSpaceService.createEventSpace(eventSpaceData);
    
    if (response.success && response.data) {
      console.log('✅ Espaço criado com sucesso:', response.data);
      return response.data;
    } else {
      console.error('❌ Erro ao criar espaço:', response.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

// Exemplo 2: Buscar espaços do hotel
export async function getHotelEventSpaces(hotelId: string) {
  try {
    console.log('🔍 Buscando espaços do hotel...');
    const response = await eventSpaceService.getEventSpacesByHotel(hotelId);
    
    if (response.success && response.data) {
      console.log(`✅ Encontrados ${response.data.length} espaços:`);
      response.data.forEach((space, index) => {
        console.log(`  ${index + 1}. ${space.name} (${space.capacity_min}-${space.capacity_max} pessoas)`);
      });
      return response.data;
    } else {
      console.error('❌ Erro ao buscar espaços:', response.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    return [];
  }
}

// Exemplo 3: Formatar preço
export function formatPriceExample() {
  const price1 = '500.00';
  const price2 = 2500;
  const price3 = null;
  
  console.log('💰 Exemplos de formatação de preço:');
  console.log(`  ${price1} → ${eventSpaceService.formatPrice(price1)}`);
  console.log(`  ${price2} → ${eventSpaceService.formatPrice(price2)}`);
  console.log(`  ${price3} → ${eventSpaceService.formatPrice(price3)}`);
}

// Exemplo 4: Verificar saúde do módulo
export async function checkEventSpacesHealth() {
  try {
    console.log('🏥 Verificando saúde do módulo...');
    const response = await eventSpaceService.healthCheck();
    
    if (response.success) {
      console.log('✅ Módulo de espaços de eventos está saudável');
      return true;
    } else {
      console.error('❌ Problema no módulo:', response.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar saúde:', error);
    return false;
  }
}

// Executar exemplos (comentado para não executar automaticamente)
/*
async function runExamples() {
  const hotelId = 'hotel-123'; // Substituir por ID real
  
  console.log('🚀 Iniciando exemplos do módulo de espaços de eventos\n');
  
  // 1. Verificar saúde
  await checkEventSpacesHealth();
  
  // 2. Formatar preços
  formatPriceExample();
  
  // 3. Buscar espaços existentes
  await getHotelEventSpaces(hotelId);
  
  // 4. Criar novo espaço (descomentar para testar)
  // await createExampleEventSpace(hotelId);
  
  console.log('\n✅ Exemplos concluídos!');
}

// Descomentar para executar
// runExamples();
*/