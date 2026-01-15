# INSTRUÇÕES PARA MIGRAÇÃO DE CONTROLE MANUAL DE PAGAMENTOS

## 📋 PRÉ-REQUISITOS

1. **Backup do banco de dados** (CRÍTICO):
   ```bash
   pg_dump linka2_database > backup_pre_migracao_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verificar estrutura atual**:
   ```sql
   -- Conectar ao banco
   psql -d linka2_database
   
   -- Verificar tabela payments
   \d payments
   
   -- Verificar colunas
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'payments' 
   ORDER BY ordinal_position;
   
   -- Verificar tipo da coluna users.id
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'id';
   ```

## 🚀 EXECUTAR MIGRAÇÃO

### Opção 1: Executar diretamente no psql
```bash
# Conectar ao banco
psql -d linka2_database

# Executar migração
\i backend/migracao_final.sql
```

### Opção 2: Executar via linha de comando
```bash
psql -d linka2_database -f backend/migracao_final.sql
```

## 🔍 VERIFICAÇÃO PÓS-MIGRAÇÃO

1. **Verificar estrutura atualizada**:
   ```sql
   -- Verificar colunas adicionadas
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'payments' 
   ORDER BY ordinal_position;
   
   -- Verificar se as colunas foram adicionadas:
   -- ✓ referenceNumber (TEXT)
   -- ✓ proofImageUrl (TEXT)
   -- ✓ confirmedBy (uuid)
   -- ✓ confirmationDate (TIMESTAMP)
   -- ✓ paymentType (TEXT)
   -- ✓ isManualPayment (BOOLEAN)
   ```

2. **Verificar funções criadas**:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname IN ('confirm_manual_payment', 'register_manual_payment_simple', 'get_pending_payments');
   ```

3. **Verificar constraints**:
   ```sql
   SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu 
     ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = 'payments';
   ```

## 🧪 TESTAR O SISTEMA

### Teste 1: Registrar pagamento manual
```sql
-- Substitua com IDs reais do seu banco
SELECT register_manual_payment_simple(
    'id-da-reserva-aqui',      -- UUID de uma reserva existente
    'id-do-usuario-aqui',      -- UUID de um usuário existente
    'bank_transfer',           -- Método de pagamento
    100.00                     -- Valor (opcional, usa valor da reserva se NULL)
);
```

### Teste 2: Confirmar pagamento
```sql
-- Use o payment_id retornado no teste anterior
SELECT confirm_manual_payment(
    'id-do-pagamento-aqui',    -- UUID do pagamento criado
    'id-do-usuario-aqui'       -- UUID do usuário que está confirmando
);
```

### Teste 3: Listar pagamentos pendentes
```sql
SELECT get_pending_payments(10, 0);
```

## 🛠️ SOLUÇÃO DE PROBLEMAS

### Problema 1: Erro de tipo incompatível
```
ERROR: foreign key constraint "payments_confirmedBy_fkey" cannot be implemented
DETAIL: Key columns "confirmedBy" of the referencing table and "id" of the referenced table are of incompatible types: uuid and text.
```

**Solução**:
```sql
-- Verificar tipo da coluna users.id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- Se users.id for TEXT, executar:
ALTER TABLE payments ALTER COLUMN "confirmedBy" TYPE TEXT;
```

### Problema 2: Colunas já existem
```
NOTICE: column "referenceNumber" of relation "payments" already exists
```

**Solução**: O script já verifica se as colunas existem, então é seguro.

### Problema 3: Constraints já existem
```
ERROR: constraint "payments_paymentMethod_check" already exists
```

**Solução**: O script remove constraints existentes antes de criar novas.

## 📊 ESTRUTURA FINAL DA TABELA PAYMENTS

Após a migração, a tabela `payments` terá estas colunas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | ID único do pagamento |
| bookingId | uuid | ID da reserva |
| userId | uuid | ID do usuário |
| serviceType | service_type | Tipo de serviço (ride/accommodation/event) |
| subtotal | numeric(10,2) | Subtotal |
| platformFee | numeric(10,2) | Taxa da plataforma |
| discountAmount | numeric(10,2) | Valor do desconto |
| total | numeric(10,2) | Valor total |
| paymentMethod | text | Método de pagamento (bank_transfer, cash, etc) |
| paymentStatus | status | Status do pagamento |
| paymentReference | text | Referência do pagamento |
| paidAt | timestamp | Data do pagamento |
| createdAt | timestamp | Data de criação |
| updatedAt | timestamp | Data de atualização |
| **referenceNumber** | text | **NOVO: Número de referência manual** |
| **proofImageUrl** | text | **NOVO: URL do comprovante** |
| **confirmedBy** | uuid | **NOVO: Usuário que confirmou** |
| **confirmationDate** | timestamp | **NOVO: Data de confirmação** |
| **paymentType** | text | **NOVO: Tipo (deposit/partial/final/full)** |
| **isManualPayment** | boolean | **NOVO: Indica se é pagamento manual** |

## 🔄 FLUXO DE TRABALHO MANUAL

1. **Cliente faz reserva** → Sistema cria booking com status 'pending'
2. **Cliente paga manualmente** (transferência, dinheiro, etc.)
3. **Cliente envia comprovante** (via app/email/whatsapp)
4. **Manager registra pagamento**:
   ```sql
   SELECT register_manual_payment_simple(booking_id, user_id, 'bank_transfer', NULL);
   ```
5. **Manager confirma pagamento** (após verificar comprovante):
   ```sql
   SELECT confirm_manual_payment(payment_id, manager_id);
   ```
6. **Sistema automaticamente**:
   - Atualiza status do pagamento para 'paid'
   - Atualiza status da reserva para 'confirmed'
   - Gera número de recibo
   - Registra data de confirmação

## 📞 SUPORTE

Em caso de problemas:
1. Restaure o backup: `psql -d linka2_database -f backup_pre_migracao.sql`
2. Verifique logs do PostgreSQL
3. Consulte a documentação do script de migração

## ✅ RESUMO DO QUE FOI IMPLEMENTADO

- ✅ Removidas funções de pagamento online
- ✅ Removidas tabelas de gateway
- ✅ Adicionadas colunas para controle manual
- ✅ Atualizada constraint de paymentMethod
- ✅ Criadas funções para controle manual
- ✅ Criados índices para performance
- ✅ Sistema 100% manual pronto para uso

**Pronto para Moçambique!** 🎉
```