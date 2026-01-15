import { sql } from 'drizzle-orm';
import { db } from './db';

async function corrigirPagamentos() {
    console.log('🚀 Iniciando correção do sistema de pagamentos manuais...');
    
    try {
        // 1. Verificar e remover constraint existente
        console.log('1. Verificando constraints existentes...');
        
        const constraints = await db.execute(sql`
            SELECT conname 
            FROM pg_constraint c 
            JOIN pg_class t ON t.oid = c.conrelid 
            WHERE t.relname = 'payments' AND conname LIKE '%paymenttype%'
        `);
        
        if (constraints.rows.length > 0) {
            console.log(`   Encontradas ${constraints.rows.length} constraints para remover:`);
            for (const row of constraints.rows) {
                const constraintName = row.conname;
                console.log(`   - Removendo constraint: ${constraintName}`);
                await db.execute(sql`ALTER TABLE payments DROP CONSTRAINT ${sql.raw(constraintName)}`);
            }
        } else {
            console.log('   Nenhuma constraint problemática encontrada.');
        }
        
        // 2. Adicionar constraint correta
        console.log('2. Adicionando constraint payments_paymenttype_check...');
        await db.execute(sql`
            ALTER TABLE payments 
            ADD CONSTRAINT payments_paymenttype_check 
            CHECK (paymenttype IN ('deposit', 'partial', 'final', 'full'))
        `);
        console.log('   ✅ Constraint criada com sucesso!');
        
        // 3. Corrigir dados existentes
        console.log('3. Corrigindo dados existentes...');
        
        // 3.1 Atualizar paymenttype para 'full'
        const result1 = await db.execute(sql`
            UPDATE payments 
            SET paymenttype = 'full'
            WHERE paymenttype IS NULL OR paymenttype = ''
            RETURNING id
        `);
        console.log(`   ✅ paymenttype atualizados: ${result1.rows.length} registros`);
        
        // 3.2 Atualizar ismanualpayment para true
        const result2 = await db.execute(sql`
            UPDATE payments 
            SET ismanualpayment = true
            WHERE ismanualpayment = false OR ismanualpayment IS NULL
            RETURNING id
        `);
        console.log(`   ✅ ismanualpayment atualizados: ${result2.rows.length} registros`);
        
        // 3.3 Corrigir paymentMethod
        const result3 = await db.execute(sql`
            UPDATE payments 
            SET "paymentMethod" = CASE 
                WHEN "paymentMethod" IN ('stripe', 'paypal', 'credit_card_online') THEN 'credit_card'
                WHEN "paymentMethod" IN ('mpesa', 'mobile_payment') THEN 'mobile_money'
                WHEN "paymentMethod" IS NULL OR "paymentMethod" = '' THEN 'bank_transfer'
                ELSE "paymentMethod"
            END
            WHERE "paymentMethod" IS NOT NULL
            RETURNING id
        `);
        console.log(`   ✅ paymentMethod atualizados: ${result3.rows.length} registros`);
        
        // 4. Criar índices
        console.log('4. Criando índices...');
        
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payments_ismanualpayment ON payments(ismanualpayment)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payments_paymenttype ON payments(paymenttype)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payments_confirmationdate ON payments(confirmationdate)`);
        
        console.log('   ✅ Índices criados/verificados');
        
        // 5. Verificação final
        console.log('5. Verificando resultados...');
        
        const stats = await db.execute(sql`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN paymenttype = 'full' THEN 1 END) as tipo_full,
                COUNT(CASE WHEN ismanualpayment = true THEN 1 END) as manuais_true,
                COUNT(CASE WHEN "paymentMethod" IN ('bank_transfer', 'cash', 'mobile_money', 'check', 'credit_card', 'debit_card', 'other') THEN 1 END) as metodos_corrigidos
            FROM payments
        `);
        
        const statsRow = stats.rows[0];
        console.log(`   📊 Total de registros: ${statsRow.total}`);
        console.log(`   📊 paymenttype = 'full': ${statsRow.tipo_full}`);
        console.log(`   📊 ismanualpayment = true: ${statsRow.manuais_true}`);
        console.log(`   📊 Métodos manuais: ${statsRow.metodos_corrigidos}`);
        
        // Verificar constraint
        const constraintCheck = await db.execute(sql`
            SELECT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'payments_paymenttype_check'
            ) as constraint_exists
        `);
        
        if (constraintCheck.rows[0].constraint_exists) {
            console.log('   ✅ Constraint payments_paymenttype_check existe');
        } else {
            console.log('   ❌ Constraint payments_paymenttype_check NÃO existe');
        }
        
        console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('\nPróximos passos:');
        console.log('1. Testar função: SELECT get_pending_payments(5, 0);');
        console.log('2. Verificar dados: SELECT * FROM payments;');
        
    } catch (error) {
        console.error('❌ Erro durante a correção:', error);
        process.exit(1);
    }
}

// Executar a correção
corrigirPagamentos();