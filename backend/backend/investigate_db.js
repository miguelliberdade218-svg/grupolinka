const { db } = require('./db');
const { hotels, paymentReferences, users } = require('./shared/schema');
const { eq, sql } = require('drizzle-orm');

async function investigateDatabase() {
  try {
    console.log('=== INVESTIGAÇÃO DO BANCO DE DADOS ===\n');
    
    // 1. HOTÉIS
    console.log('1. HOTÉIS:');
    const hotelsCount = await db.select({ count: sql`COUNT(*)` }).from(hotels);
    console.log('   Total de hotéis:', hotelsCount[0].count);
    
    const activeHotels = await db.select({ count: sql`COUNT(*)` }).from(hotels).where(sql`is_active = true`);
    console.log('   Hotéis ativos:', activeHotels[0].count);
    
    const inactiveHotels = await db.select({ count: sql`COUNT(*)` }).from(hotels).where(sql`is_active = false`);
    console.log('   Hotéis inativos:', inactiveHotels[0].count);
    
    // Listar alguns hotéis
    const hotelList = await db.select({
      id: hotels.id,
      name: hotels.name,
      is_active: hotels.is_active,
      created_at: hotels.created_at
    }).from(hotels).limit(5);
    
    console.log('   Primeiros 5 hotéis:');
    hotelList.forEach((hotel, i) => {
      console.log(`   ${i+1}. ${hotel.name} (ID: ${hotel.id}) - Ativo: ${hotel.is_active} - Criado: ${hotel.created_at}`);
    });
    
    // 2. PAGAMENTOS PENDENTES
    console.log('\n2. PAGAMENTOS PENDENTES:');
    const pendingPayments = await db.select({ 
      count: sql`COUNT(*)`, 
      total: sql`COALESCE(SUM(gross_amount), 0)` 
    }).from(paymentReferences).where(sql`status = 'pending'`);
    
    console.log('   Quantidade de pagamentos pendentes:', pendingPayments[0].count);
    console.log('   Valor total pendente:', pendingPayments[0].total);
    
    // Listar detalhes dos pagamentos pendentes
    const paymentDetails = await db.select({ 
      id: paymentReferences.id,
      gross_amount: paymentReferences.gross_amount,
      status: paymentReferences.status,
      reference_number: paymentReferences.reference_number,
      created_at: paymentReferences.created_at
    }).from(paymentReferences).where(sql`status = 'pending'`).limit(5);
    
    console.log('   Primeiros 5 pagamentos pendentes:');
    paymentDetails.forEach((payment, i) => {
      console.log(`   ${i+1}. ID: ${payment.id} - Valor: ${payment.gross_amount} - Referência: ${payment.reference_number} - Criado: ${payment.created_at}`);
    });
    
    // 3. VERIFICAÇÕES PENDENTES
    console.log('\n3. VERIFICAÇÕES PENDENTES:');
    
    // Motoristas pendentes
    const pendingDrivers = await db.select({ 
      count: sql`COUNT(*)` 
    }).from(users).where(sql`driver_verification_status = 'pending'`);
    console.log('   Motoristas pendentes:', pendingDrivers[0].count);
    
    // Gestores de hotel pendentes
    const pendingHotelManagers = await db.select({ 
      count: sql`COUNT(*)` 
    }).from(users).where(sql`hotel_manager_verification_status = 'pending'`);
    console.log('   Gestores de hotel pendentes:', pendingHotelManagers[0].count);
    
    // Total de verificações pendentes
    const totalPendingVerifications = await db.select({ 
      count: sql`COUNT(*)` 
    }).from(users).where(sql`driver_verification_status = 'pending' OR hotel_manager_verification_status = 'pending'`);
    console.log('   Total verificações pendentes:', totalPendingVerifications[0].count);
    
    // 4. ESTATÍSTICAS GERAIS
    console.log('\n4. ESTATÍSTICAS GERAIS:');
    
    const totalUsers = await db.select({ count: sql`COUNT(*)` }).from(users);
    console.log('   Total de usuários:', totalUsers[0].count);
    
    const totalAdmins = await db.select({ count: sql`COUNT(*)` }).from(users).where(sql`is_admin = true`);
    console.log('   Total de admins:', totalAdmins[0].count);
    
    const totalDrivers = await db.select({ count: sql`COUNT(*)` }).from(users).where(sql`can_drive = true`);
    console.log('   Total de motoristas:', totalDrivers[0].count);
    
    const totalClients = await db.select({ count: sql`COUNT(*)` }).from(users).where(sql`can_book_services = true`);
    console.log('   Total de clientes:', totalClients[0].count);
    
    console.log('\n=== INVESTIGAÇÃO CONCLUÍDA ===');
    
  } catch (error) {
    console.error('Erro durante a investigação:', error);
  } finally {
    process.exit(0);
  }
}

investigateDatabase();