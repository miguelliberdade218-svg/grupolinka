const { exec } = require('child_process');
const fs = require('fs');

// Script SQL para corrigir os problemas
const sqlScript = `
-- 1. Verificar e remover constraint existente
DO $$
BEGIN
    -- Remover constraint específica se existir
    PERFORM 1 FROM pg_constraint WHERE conname = 'payments_paymenttype_check';
    IF FOUND THEN
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT payments_paymenttype_check';
        RAISE NOTICE 'Constraint payments_paymenttype_check removida';
    END IF;
END $$;

-- 2. Adicionar constraint correta
ALTER TABLE payments 
ADD CONSTRAINT payments_paymenttype_check 
CHECK (paymenttype IN ('deposit', 'partial', 'final', 'full'));

-- 3. Corrigir dados existentes
-- Primeiro: Atualizar paymenttype para 'full' onde estiver NULL ou vazio
UPDATE payments 
SET paymenttype = 'full'
WHERE paymenttype IS NULL OR paymenttype = '';

-- Segundo: Atualizar ismanualpayment para true onde for false ou NULL
UPDATE payments 
SET ismanualpayment = true
WHERE ismanualpayment = false OR ismanualpayment IS NULL;

-- Terceiro: Corrigir paymentMethod para métodos manuais
UPDATE payments 
SET "paymentMethod" = CASE 
    WHEN "paymentMethod" IN ('stripe', 'paypal', 'credit_card_online') THEN 'credit_card'
    WHEN "paymentMethod" IN ('mpesa', 'mobile_payment') THEN 'mobile_money'
    WHEN "paymentMethod" IS NULL OR "paymentMethod" = '' THEN 'bank_transfer'
    ELSE "paymentMethod"
END
WHERE "paymentMethod" IS NOT NULL;

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_payments_ismanualpayment ON payments(ismanualpayment);
CREATE INDEX IF NOT EXISTS idx_payments_paymenttype ON payments(paymenttype);
CREATE INDEX IF NOT EXISTS idx_payments_confirmationdate ON payments(confirmationdate);

-- 5. Verificação
SELECT '✅ Correções aplicadas!' as status;
SELECT 'Total registros:' as info, COUNT(*) as valor FROM payments;
SELECT 'paymenttype = full:' as info, COUNT(*) as valor FROM payments WHERE paymenttype = 'full';
SELECT 'ismanualpayment = true:' as info, COUNT(*) as valor FROM payments WHERE ismanualpayment = true;
SELECT 'Métodos manuais:' as info, COUNT(*) as valor FROM payments WHERE "paymentMethod" IN ('bank_transfer', 'cash', 'mobile_money', 'check', 'credit_card', 'debit_card', 'other');
`;

// Salvar script em arquivo temporário
fs.writeFileSync('temp_correcao.sql', sqlScript);

console.log('Executando correções no banco de dados...');

// Executar com psql (ajuste o comando conforme necessário)
exec('psql -d linka2_database -f temp_correcao.sql', (error, stdout, stderr) => {
    if (error) {
        console.error('Erro ao executar psql:', error);
        console.log('Tentando método alternativo...');
        
        // Método alternativo: usar o cliente PostgreSQL via Node.js
        const { Client } = require('pg');
        const client = new Client({
            connectionString: process.env.DATABASE_URL || 'postgresql://linka_user:@localhost:5432/linka2_database'
        });
        
        client.connect()
            .then(() => {
                console.log('Conectado ao banco de dados');
                return client.query(sqlScript);
            })
            .then((result) => {
                console.log('✅ Correções aplicadas com sucesso!');
                console.log('Resultados:', result);
                client.end();
            })
            .catch(err => {
                console.error('Erro ao aplicar correções:', err);
                client.end();
            });
    } else {
        console.log('✅ Correções aplicadas com sucesso!');
        console.log('Saída:', stdout);
        if (stderr) console.log('Erros:', stderr);
        
        // Remover arquivo temporário
        fs.unlinkSync('temp_correcao.sql');
    }
});