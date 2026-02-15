# 🧪 Guia de Testes Manuais - Booking de Espaços de Eventos

## 🎯 Objetivo
Validar todas as 4 correções implementadas no sistema de booking.

---

## ✅ TESTE 1: Página de Confirmação (404 Resolvido)

### Pré-requisitos
- App rodando em `http://localhost:5000`
- Espaço de evento criado e com ID válido

### Passo a Passo

#### 1.1 Fazer uma reserva completa
```
1. Ir para http://localhost:5000/event-spaces/search
2. Procurar por um espaço de evento
3. Clicar em "Reservar" ou "Book"
4. Preencher os dados:
   - Check-in: 15/02/2026
   - Check-out: 17/02/2026
   - Participantes: 100
5. Prosseguir para Passo 2
6. Preencher dados do organizador:
   - Nome: João Silva
   - Email: joao@example.com
   - Telefone: +258 84 123 4567
   - Título do evento: Conferência de Tecnologia
   - Tipo de evento: Conference
   - Descrição: Conferência anual da empresa
7. Clicar "Enviar Solicitação"
```

#### 1.2 Verificar redirecionamento
```
Resultado esperado:
✅ Toast de sucesso: "Solicitação de reserva enviada com sucesso!"
✅ Redireciona para: /event-spaces/{id}/booking-confirmation?bookingId={id}&email=...
✅ Página carrega SEM 404
✅ Exibe detalhes da reserva
```

#### 1.3 Verificar DevTools
```
Abrir F12 → Console
Procurar por logs:
- "📥 Processando resposta de evento:"
- "✅ Dados do evento processados:"
- Sem erros de parâmetros

Verificar Network tab:
- Request para /api/events/bookings/{id} → 200 OK
- Resposta com dados da reserva
```

### ❌ Se Falhar
```
Erro esperado: "404 Page Not Found"
Causa: Parâmetros não sendo extraídos corretamente
Solução:
1. Limpar cache (Ctrl+Shift+Delete)
2. Recarregar página (Ctrl+F5)
3. Verificar que AppRouter.tsx tem a rota:
   <Route path="/event-spaces/:id/booking-confirmation">
```

---

## ✅ TESTE 2: Filtragem de Tipos de Evento

### Pré-requisitos
- Espaço com restrições de tipos configuradas
- DevTools aberto (F12)

### Passo a Passo

#### 2.1 Verificar se backend retorna allowedEventTypes
```javascript
// No Console (F12):
// Fazer uma requisição direta
fetch('/api/events/spaces/{space-id}')
  .then(r => r.json())
  .then(d => {
    console.log('allowedEventTypes:', d.data.space.allowedEventTypes);
  });

// Resultado esperado:
// allowedEventTypes: ["wedding", "conference", "gala"]
// OU
// allowedEventTypes: [] (se vazio, backend não está enviando)
```

#### 2.2 Ir para formulário de booking
```
1. Ir para /event-spaces/{id}/book
2. Abrir DevTools → Console
3. Procurar pelos logs:
```

#### 2.3 Verificar Logs de Debug
```
Procurar no Console por:
🔍 allowedEventTypes do espaço: [...]
🎯 Tipos permitidos pelo espaço (backend): [...]
✅ Tipos filtrados para exibição: [...]

Cenário 1 - OK (tipos restritos):
🔍 allowedEventTypes do espaço: ["wedding", "conference"]
🎯 Tipos permitidos pelo espaço (backend): ["wedding", "conference"]
✅ Tipos filtrados para exibição: ["wedding", "conference"]

Cenário 2 - PROBLEMA (backend não retorna):
⚠️ Espaço sem restrições de tipo - mostrando todos
```

#### 2.4 Verificar Seleção no Formulário
```
Passo 2 do formulário → Campo "Tipo de Evento"
Clicar na lista dropdown

Se CORRETO:
- Aparecem apenas os tipos permitidos (ex: 3-5 tipos)
- Com caixa azul: "Tipos de eventos permitidos para este espaço"

Se INCORRETO:
- Aparecem TODOS os 18 tipos de eventos
- Sem caixa azul de restrição
```

### 📊 Diagnóstico
```
Verificar qual é o problema:

┌─ Log mostra: ⚠️ Espaço sem restrições
│  └─ Problema: Backend não retorna allowedEventTypes
│     Solução: Ir para backend/admin, configurar tipos permitidos
│
└─ Log mostra: ✅ Tipos filtrados
   ├─ Se filtro correto no formulário
   │  └─ ✅ FUNCIONA CORRETAMENTE
   │
   └─ Se aparecem TODOS os tipos
      └─ Problema: UI não está usando array filtrado
         Solução: Verificar linha 600+ EventSpaceBookingPage
```

---

## ✅ TESTE 3: Surcharge de Fim de Semana

### Pré-requisitos
- Espaço com weekendSurchargePercent > 0 (ex: 30%)
- Preço base configurado (ex: 1000 MZN)

### Passo a Passo

#### 3.1 Fazer booking com datas incluindo fim de semana
```
1. Ir para /event-spaces/{id}/book
2. Selecionar datas:
   - Check-in: Quinta-feira 13/02/2026
   - Check-out: Domingo 16/02/2026
   
   Isso cria:
   Qui 13 - normal
   Sex 14 - FIM DE SEMANA ✅
   Sab 15 - FIM DE SEMANA ✅
   Dom 16 - FIM DE SEMANA ✅
   
   Total: 3 noites, 2 noites de fim de semana
```

#### 3.2 Verificar Resumo da Reserva (no sidebar)
```
Procurar pela seção "Resumo da Reserva":

✅ Preço por noite: 1.000,00 MZN +30% em fins de semana
✅ Subtotal (3 noites): 3.000,00 MZN
✅ Adicional fim de semana (em caixa âmbar):
   - 2 noites × 30% = 600,00 MZN
✅ Total estimado: 3.600,00 MZN

Cálculo:
basePrice = 1.000
weekendNights = 2
surchargePercent = 30%
weekendSurcharge = 1.000 × (30/100) × 2 = 600
Total = 3.000 + 600 = 3.600 ✅
```

#### 3.3 Verificar Console
```
Abrir F12 → Console
Não deve haver erros sobre:
- "weekendNights é undefined"
- "formatCurrency error"
- "weekendSurchargeAmount is NaN"
```

### 📊 Diagnóstico
```
Se APARECER Adicional:
├─ ✅ Valores corretos
│  └─ Sucesso! Teste passou
│
└─ ❌ Valores incorretos (ex: 0,00 MZN)
   └─ Problema: Cálculo retornando 0
      Verificar:
      1. weekendSurchargePercent > 0?
      2. weekendNights > 0?
      3. basePrice > 0?

Se NÃO APARECER Adicional:
├─ weekendNights = 0 (sem fim de semana na seleção)
│  └─ Resultado correto! Não há surcharge
│
├─ space.weekendSurchargePercent = 0
│  └─ Espaço não tem surcharge configurado
│
└─ Caixa inteira não aparece
   └─ Verificar linhas 720-760 EventSpaceBookingPage
      Confirmação: condicional on line 720?
```

---

## ✅ TESTE 4: Proteção de Dados de Contato

### Pré-requisitos
- Reservas de hotel já existentes com diferentes statuses
- Acesso direto à página de confirmação

### Passo a Passo

#### 4.1 Acessar Confirmação com Status "Pendente"
```
Assumindo que temos uma reserva com:
- ID: abc123
- Status: pending
- Hotel: Test Hotel
- Email: contact@hotel.com
- Telefone: +258 84 123 4567

1. Acessar: http://localhost:5000/bookings/hotel/abc123/confirmation
```

#### 4.2 Verificar que Contato está OCULTO
```
Resultado esperado:

❌ Telefone NÃO aparece
❌ Email NÃO aparece

✅ Em vez disso, aparecer:
"⚠️ Os dados de contato estarão disponíveis após a 
   confirmação da reserva."

Seção "Próximos Passos":
❌ "📞 Em caso de dúvidas, contacte o hotel: +258 84..."
✅ "⚠️ Os dados de contato estarão disponíveis após 
      a confirmação da sua reserva."
```

#### 4.3 Acessar Confirmação com Status "Confirmado"
```
Se temos uma reserva com:
- Status: confirmed

1. Acessar página de confirmação
```

#### 4.4 Verificar que Contato está VISÍVEL
```
Resultado esperado:

✅ Telefone APARECE: +258 84 123 4567
✅ Email APARECE: contact@hotel.com

Seção "Próximos Passos":
✅ "📞 Em caso de dúvidas, contacte o hotel: +258 84 123 4567."
❌ Mensagem de aviso NÃO aparece
```

#### 4.5 Testar Diferentes Statuses
```
Criar/acessar reservas com cada status:

❌ OCULTAR CONTATO:
- "pending"
- "pending_confirmation"
- "pending_approval"
- "cancelled"
- "rejected"

✅ MOSTRAR CONTATO:
- "confirmed"
- "checked_in"
- "checked_out"
- "in_progress"
- "completed"

Verificar cada um!
```

### 🔒 Verificação de Segurança
```javascript
// Abrir DevTools → Console
// Verificar qual status trigga a visibilidade

// Você pode forçar um teste alterando o status no mock:
// (APENAS PARA TESTE - não fazer em produção)
```

---

## 📋 Tabela de Checagem Rápida

### Teste 1: 404 Resolvido
```
[ ] Fazer reserva completa
[ ] Redireciona para /event-spaces/{id}/booking-confirmation
[ ] Página carrega sem erro 404
[ ] Dados da reserva aparecem corretamente
[ ] Console não tem erros de parâmetros
```

### Teste 2: Event Types Filtrados
```
[ ] Abrir /event-spaces/{id}/book
[ ] Verificar logs de debug no console
[ ] Se log mostra ⚠️ sem restrições = backend OK, dados vazios
[ ] Se log mostra ✅ tipos filtrados = funcionando
[ ] Verificar que dropdown mostra apenas tipos permitidos
```

### Teste 3: Surcharge
```
[ ] Selecionar datas com fim de semana (Sab/Dom)
[ ] Aparecer caixa "Adicional fim de semana" em cor âmbar
[ ] Valor calculado estar correto
[ ] Total incluir o surcharge
[ ] Sem erros de cálculo no console
```

### Teste 4: Contato Protegido
```
[ ] Status "pending" → Contato OCULTO
[ ] Status "confirmed" → Contato VISÍVEL
[ ] Mensagem de aviso aparecer quando oculto
[ ] Email e telefone seguirem a regra
[ ] Testar todos os 10 statuses
```

---

## 🚨 Problemas Conhecidos

### Problema: Event Types Ainda Mostrando Todos
```
Causa: Backend retorna allowedEventTypes vazio
Solução:
1. Verificar no banco se `allowed_event_types` tem dados
2. Verificar query API `/api/events/spaces/{id}`
3. Se vazio, adicionar dados manualmente:
   UPDATE event_spaces 
   SET allowed_event_types = '["wedding","conference","gala"]'
   WHERE id = '{space-id}';
```

### Problema: Surcharge Aparece como 0,00
```
Causa: weekendSurchargePercent = 0 ou não configurado
Solução:
1. Verificar se espaço tem surcharge configurado
2. Atualizar se necessário:
   UPDATE event_spaces 
   SET weekend_surcharge_percent = 30
   WHERE id = '{space-id}';
```

### Problema: Contato Aparece para Status "Pending"
```
Causa: Função canShowContactInfo não está sendo usada
Solução:
1. Verificar linhas 650-670 e 868-874 BookingConfirmationPage.tsx
2. Confirmar que condicionais estão em lugar
3. Limpar cache e recarregar
```

---

## 📞 Logs Esperados no Console

```javascript
// TESTE 1 - Confirmação
"📥 Processando resposta de evento:"
"✅ Dados do evento processados:"
"🔍 Buscando reserva de evento:"

// TESTE 2 - Event Types
"🔍 allowedEventTypes do espaço: [...]"
"🎯 Tipos permitidos pelo espaço (backend): [...]"
"✅ Tipos filtrados para exibição: [...]"

// Ou se vazio:
"⚠️ Espaço sem restrições de tipo - mostrando todos"

// TESTE 3 - Surcharge
// Sem erros, apenas cálculos silenciosos

// TESTE 4 - Contato
// Sem erros, apenas lógica de visibilidade silenciosa
```

---

## ✅ Teste de Conclusão

Após passar em TODOS os testes:

```bash
✅ Teste 1: Confirmação (404 Resolvido)
✅ Teste 2: Event Types Filtrados (ou investigado)
✅ Teste 3: Surcharge Mostrando
✅ Teste 4: Contato Protegido

📝 Preencher relatório:
- Quantos passos passaram: 4/4
- Problemas encontrados: Nenhum
- Recomendações: Deploy para produção
```

---

## 🚀 Próximo Passo

Se todos os testes passarem:
```
1. Commit das mudanças
2. Deploy para staging
3. Teste final com dados reais
4. Deploy para produção
5. Comunicar ao usuário: "Sistema de booking corrigido ✅"
```

Se algum teste falhar:
```
1. Consultar CORRECOES_BOOKING_FINAL_2026.md
2. Verificar logs no console (F12)
3. Confirmar dados no backend
4. Reexecutar teste após correção
5. Documento será atualizado com achados
```

---

**Guia criado em**: Janeiro 2026
**Versão**: 1.0
**Status**: Pronto para Testes
