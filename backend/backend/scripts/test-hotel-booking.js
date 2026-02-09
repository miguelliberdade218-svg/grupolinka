// backend/scripts/test-hotel-booking.js
import { db } from '../db.js';
import { hotelBookings } from '../shared/schema.js';

async function testHotelBooking() {
  try {
    console.log('🧪 TESTE: Criando reserva de hotel...');
    
    const bookingData = {
      id: 'test-id-' + Date.now(),
      hotelId: '5c52975e-fc9f-406b-8742-03104a0fe73f',
      roomTypeId: 'e1e89bdd-aa8b-46af-92c5-86246f004f2f',
      guestName: 'Teste Debug',
      guestEmail: 'debug@test.com',
      guestPhone: '841234567',
      checkIn: '2025-05-01',
      checkOut: '2025-05-03',
      adults: 2,
      children: 0,
      status: 'confirmed',
      paymentStatus: 'pending',
      basePrice: '5000.00',
      totalPrice: '10000.00',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('📦 Dados da reserva:', JSON.stringify(bookingData, null, 2));
    
    // Tentar inserir diretamente
    const result = await db.insert(hotelBookings).values(bookingData).returning();
    console.log('✅ Inserção direta bem-sucedida:', result);
    
  } catch (error) {
    console.error('❌ ERRO na inserção direta:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      stack: error.stack,
    });
  } finally {
    process.exit(0);
  }
}

testHotelBooking();