import os

filepath = '/mnt/c/Users/User/Downloads/LinkA/linka-fullstack-mainzip/linka-fullstack-main/backend/backend/src/modules/hotels/hotelBookingService.ts'
backup = filepath + '.bak'

# Make backup
import shutil
shutil.copy2(filepath, backup)
print('Backup criado:', backup)

with open(filepath, 'r') as f:
    content = f.read()

# Find the checkOutBooking function and add the commission hook
old_text = '''if (updated) {
      await createBookingLog(
        bookingId,
        "check_out",
        performedBy || "system",
        `Check-out realizado`,
        { 
          timestamp: new Date().toISOString(),
          performedBy: performedBy || 'system'
        }
      );
      
      return updated;'''

new_text = '''if (updated) {
      await createBookingLog(
        bookingId,
        "check_out",
        performedBy || "system",
        `Check-out realizado`,
        { 
          timestamp: new Date().toISOString(),
          performedBy: performedBy || 'system'
        }
      );

      // 🆕 GANCHO AUTOMATICO: Criar comissao para o hotel (nao bloqueante)
      console.log(`🔗 [HOTEL-BOOKING] Gatilho: criando comissao para hotel booking ${bookingId}`);
      providerPaymentService.createHotelCommission(bookingId).catch((error: any) => {
        console.error('❌ [HOTEL-BOOKING] Erro ao criar comissao (nao critico):', error.message);
      });
      
      return updated;'''

if old_text in content:
    content = content.replace(old_text, new_text, 1)
    with open(filepath, 'w') as f:
        f.write(content)
    print('✅ Substituicao feita com sucesso!')
else:
    print('❌ Texto nao encontrado no arquivo!')
    # Debug
    count = content.count('if (updated)')
    print('Encontradas', count, 'ocorrencias de "if (updated)"')
    idx = content.find('if (updated)')
    if idx >= 0:
        print('Primeira ocorrencia na posicao', idx)
        print('Contexto:', repr(content[idx:idx+500]))