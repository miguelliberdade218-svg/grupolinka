# 🚀 QUICK START - Link-A Frontend Reorganizado

**Tempo de leitura**: 5 minutos  
**Versão**: 1.0  
**Status**: ✅ Pronto para usar

---

## 📦 O QUE MUDOU?

### Antes ❌
```
❌ admin-app com hotel management misturado
❌ Dados apenas mockados
❌ Sem integração com API
❌ Componentes desorganizados
```

### Depois ✅
```
✅ hotels-app centralizado para tudo de hotéis + eventos
✅ Dados em tempo real da API
✅ Serviços reutilizáveis
✅ Componentes bem estruturados
```

---

## ⚡ COMEÇAR EM 5 MINUTOS

### 1️⃣ Entender a Estrutura (2 min)

```
📁 hotels-app/
├── 🎨 components/
│   ├── room-types/RoomTypesManagement.tsx  ← Lista quartos
│   ├── event-spaces/EventSpacesManagement.tsx ← Lista eventos
├── 📄 pages/
│   └── hotel-management/HotelManagerDashboard.tsx ← Dashboard
```

### 2️⃣ Importar um Serviço (1 min)

```tsx
// Seu componente
import { hotelService } from '@/services/hotelService';

// Usar
const response = await hotelService.getHotelById('hotel-id');
```

### 3️⃣ Ver Exemplo (1 min)

```tsx
// Abrir SERVICE_USAGE_GUIDE.md
// Encontrar seção "HOTELSERVICE - Gerenciamento de Hotéis"
// Copiar exemplo desejado
// Colar no seu componente
```

### 4️⃣ Testar (1 min)

```bash
npm run dev
# Abrir http://localhost:5173/hotels/manage
# Verificar se carrega dados
```

---

## 🔑 CONCEITOS CHAVE

### 1. Services Retornam Sempre `{ success, data, error }`

```tsx
const response = await hotelService.getHotelById('id');

if (response.success) {
  console.log(response.data);      // Dados aqui
} else {
  console.error(response.error);   // Erro aqui
}
```

### 2. Sempre Use Try-Catch

```tsx
try {
  const response = await hotelService.searchHotels();
} catch (error) {
  console.error('Erro de rede:', error);
}
```

### 3. Implemente Loading States

```tsx
const [loading, setLoading] = useState(false);

const load = async () => {
  setLoading(true);
  const response = await hotelService.getHotelById('id');
  setLoading(false);
};
```

---

## 📚 ONDE ENCONTRAR TUDO

| Documento | Conteúdo | Tempo |
|-----------|----------|-------|
| [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) | O que foi feito | 10 min |
| [RESTRUCTURING_PLAN.md](./RESTRUCTURING_PLAN.md) | Arquitetura completa | 15 min |
| [SERVICE_USAGE_GUIDE.md](./SERVICE_USAGE_GUIDE.md) | 50+ exemplos práticos | 30 min |
| [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) | Progresso e próximos passos | 10 min |

---

## 💡 EXEMPLOS RÁPIDOS

### Buscar Hotéis

```tsx
const response = await hotelService.searchHotels({
  locality: 'Maputo',
  province: 'Gaza'
});

console.log(`Encontrados ${response.count} hotéis`);
```

### Criar Room Type

```tsx
const response = await hotelService.createRoomType('hotel-id', {
  name: 'Quarto Standard',
  capacity: 2,
  base_price: '2500',
  total_units: 10,
  base_occupancy: 2
});
```

### Listar Reservas

```tsx
const response = await hotelService.getBookingsByHotel('hotel-id', ['confirmed']);

console.log(`${response.count} reservas confirmadas`);
```

### Criar Evento

```tsx
const response = await eventSpaceService.createEventBooking('space-id', {
  organizer_name: 'João',
  organizer_email: 'joao@email.com',
  event_title: 'Conferência',
  event_type: 'Conferência',
  start_datetime: '2026-03-15T09:00:00Z',
  end_datetime: '2026-03-15T18:00:00Z',
  expected_attendees: 250
});
```

---

## ✅ CHECKLIST HOJE

- [ ] Ler este ficheiro (5 min)
- [ ] Ler EXECUTIVE_SUMMARY.md (10 min)
- [ ] Executar `npm run dev`
- [ ] Navegar para `/hotels/manage`
- [ ] Verificar se carrega dados
- [ ] Abrir console (F12) para ver se há erros
- [ ] Se OK → Ir para FASE 2 (Formulários)

---

## 🐛 SE TIVER ERRO

### Erro: "Cannot find module @/services/hotelService"
```
Solução: Verificar se o ficheiro existe em src/services/
```

### Erro: "Cannot read property 'data' of undefined"
```
Solução: Verificar if response.success antes de usar response.data
```

### Erro: "API request failed"
```
Solução: Verificar se backend está a correr em localhost:8000
Executar no terminal do backend: npm run dev
```

### Erro: "401 Unauthorized"
```
Solução: Verificar se Firebase token está correto
Ver SERVICE_USAGE_GUIDE.md seção "Padrões & Boas Práticas"
```

---

## 🎯 O QUE VEM A SEGUIR

### FASE 2 (Próxima Semana)
- [ ] Criar `RoomTypeForm.tsx` (formulário CRUD)
- [ ] Criar `EventSpaceForm.tsx` (formulário CRUD)
- [ ] Validações com Zod
- [ ] Upload de imagens

### FASE 3 (Semana Seguinte)
- [ ] Pagamentos integrados
- [ ] Calendários (react-big-calendar)
- [ ] Relatórios
- [ ] Analytics

### FASE 4 (Semana Final)
- [ ] Testes unitários
- [ ] Otimização de performance
- [ ] Deploy
- [ ] Monitoramento

---

## 🆘 PRECISA DE AJUDA?

### Documentação
1. Abrir [SERVICE_USAGE_GUIDE.md](./SERVICE_USAGE_GUIDE.md)
2. Encontrar a seção desejada
3. Copiar o exemplo
4. Adaptar para seu caso

### Estrutura
1. Abrir [RESTRUCTURING_PLAN.md](./RESTRUCTURING_PLAN.md)
2. Ver diagrama de pastas
3. Entender arquitetura

### Status
1. Abrir [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)
2. Ver o que já foi feito
3. Saber próximos passos

---

## 📞 RESUMO

| Pergunta | Resposta |
|----------|----------|
| Onde estão os serviços? | `src/services/hotelService.ts` e `eventSpaceService.ts` |
| Como usar? | `import { hotelService } from '@/services/hotelService'` |
| Tem exemplos? | Sim! Ver `SERVICE_USAGE_GUIDE.md` |
| Como testar? | `npm run dev` → `/hotels/manage` |
| Que mudou? | Tudo centralizado em hotels-app com API real |
| Próximo passo? | Ler EXECUTIVE_SUMMARY.md (10 min) |

---

## 🎊 VOCÊ CONSEGUIU!

Agora tem:
- ✅ 2 serviços completos com 60+ métodos
- ✅ 3 componentes integrados com API
- ✅ 1 dashboard funcional
- ✅ 4 documentações detalhadas
- ✅ 42 endpoints do backend cobertos

**Próximo**: Implementar FASE 2 (Formulários CRUD)

---

**Criado**: 18 Janeiro 2026  
**Versão**: 1.0 Quick Start  
**Tempo Total**: ~2-3 semanas para tudo pronto
