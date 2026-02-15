# 🔧 GUIA DE CORREÇÕES - Dados Incorretos em Espaços de Eventos

## 📋 Resumo dos Problemas Identificados

1. **Preços mostrando 0,00 ou "Sob consulta"** - Campo de preço não está sendo recuperado corretamente
2. **Amenities vazias ou "N/A"** - Comodidades não estão sendo extraídas do backend
3. **Localização como "Localização não informada" ou "Localização não disponível"** - Dados de localização não estão sendo mapeados
4. **Capacidade vindo como "-" ou valores incorretos** - Campos de capacidade não estão sendo processados
5. **Detalhes vazios em página de resultados** - Dados não estão sendo propagados corretamente

---

## 🔍 ORIGEM DO PROBLEMA #1: PREÇOS ZERANDO

### Localização do Bug
- **Arquivo**: `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`
- **Linhas**: 101-116 (função `getBasePrice()`)
- **Arquivo**: `src/shared/components/event-spaces/EventSpaceCard.tsx`
- **Linhas**: 51-67 (função `getBasePrice()`)

### Causa Raiz
O backend está retornando o campo de preço com o nome `price_per_day` (snake_case), mas o frontend está procurando por:
1. `base_price_per_day` 
2. `basePricePerDay`

Quando nenhum desses campos é encontrado, o preço defaulta para `0`.

### ✅ Solução

**PASSO 1**: No arquivo `EventSpaceDetailPage.tsx`, localize a função `getBasePrice()` (por volta da linha 101)

**Procure por**:
```typescript
const getBasePrice = (): number => {
  // 1. Tentar spaceDetails.base_price_per_day (nível superior)
  if ((spaceDetails as any)?.base_price_per_day) {
    const price = parseFloat((spaceDetails as any).base_price_per_day);
    if (!isNaN(price) && price > 0) return price;
  }
```

**Substitua por**:
```typescript
const getBasePrice = (): number => {
  // 0. PRIORIDADE MÁXIMA: pricePerDay (campo REAL do backend)
  if ((spaceDetails as any)?.price_per_day) {
    const price = parseFloat((spaceDetails as any).price_per_day);
    if (!isNaN(price) && price > 0) return price;
  }
  
  // 0b. PRIORIDADE MÁXIMA: space.pricePerDay
  if ((space as any)?.price_per_day) {
    const price = parseFloat((space as any).price_per_day);
    if (!isNaN(price) && price > 0) return price;
  }
  
  // 1. Tentar spaceDetails.base_price_per_day (nível superior)
  if ((spaceDetails as any)?.base_price_per_day) {
    const price = parseFloat((spaceDetails as any).base_price_per_day);
    if (!isNaN(price) && price > 0) return price;
  }
```

**PASSO 2**: Faça o MESMO no arquivo `EventSpaceCard.tsx` (por volta da linha 51), função `getBasePrice()`:

**Adicione ANTES do "1. PRIORIDADE"**:
```typescript
  // 1. PRIORIDADE MÁXIMA: price_per_day (campo real do banco)
  if (spaceAny.price_per_day) {
    const price = parseFloat(spaceAny.price_per_day);
    if (!isNaN(price) && price > 0) {
      return price;
    }
  }
```

---

## 🔍 ORIGEM DO PROBLEMA #2: AMENITIES VAZIAS

### Localização do Bug
- **Arquivo**: `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`
- **Linhas**: 265-309 (função `getAmenities()`)
- **Arquivo**: `src/shared/components/event-spaces/EventSpaceCard.tsx`
- **Linhas**: 76-99 (função `getAmenities()`)

### Causa Raiz
O backend retorna amenities em 3 locais possíveis:
1. `data.amenities` (array direto)
2. `data.equipment.amenities` (dentro do objeto equipment)
3. `data.amenities_list` (campo alternativo)

O código atual não está verificando **TODAS** as possibilidades na ordem correta.

### ✅ Solução

**PASSO 3**: No arquivo `EventSpaceDetailPage.tsx`, localize `getAmenities()` (por volta da linha 265)

**Procure por**:
```typescript
const getAmenities = (): string[] => {
  // 1. PRIMEIRA PRIORIDADE: spaceDetails.amenities (nível superior)
  if ((spaceDetails as any)?.amenities) {
    if (Array.isArray((spaceDetails as any).amenities)) {
      if (typeof (spaceDetails as any).amenities[0] === 'string') {
        return (spaceDetails as any).amenities as string[];
      }
```

**Substitua POR** (versão melhorada):
```typescript
const getAmenities = (): string[] => {
  // 1. PRIMEIRA PRIORIDADE: spaceDetails.amenities (nível superior)
  if ((spaceDetails as any)?.amenities && Array.isArray((spaceDetails as any).amenities) && (spaceDetails as any).amenities.length > 0) {
    const amenities = (spaceDetails as any).amenities;
    if (typeof amenities[0] === 'string') {
      return amenities as string[];
    }
    if (amenities[0]?.name) {
      return amenities.map((a: any) => a.name);
    }
  }
  
  // 2. SEGUNDA PRIORIDADE: space.amenities
  if ((space as any)?.amenities && Array.isArray((space as any).amenities) && (space as any).amenities.length > 0) {
    const amenities = (space as any).amenities;
    if (typeof amenities[0] === 'string') {
      return amenities as string[];
    }
    if (amenities[0]?.name) {
      return amenities.map((a: any) => a.name);
    }
  }
  
  // 3. TERCEIRA PRIORIDADE: equipment.amenities
  if ((space as any)?.equipment?.amenities && Array.isArray((space as any).equipment.amenities) && (space as any).equipment.amenities.length > 0) {
    const equipmentAmenities = (space as any).equipment.amenities;
    if (typeof equipmentAmenities[0] === 'string') {
      return equipmentAmenities as string[];
    }
    if (equipmentAmenities[0]?.name) {
      return equipmentAmenities.map((a: any) => a.name);
    }
  }
  
  // 4. QUARTA PRIORIDADE: spaceDetailsResponse?.data?.amenities
  if ((spaceDetailsResponse as any)?.data?.amenities && Array.isArray((spaceDetailsResponse as any).data.amenities) && (spaceDetailsResponse as any).data.amenities.length > 0) {
    const amenities = (spaceDetailsResponse as any).data.amenities;
    if (typeof amenities[0] === 'string') {
      return amenities as string[];
    }
  }
  
  // 5. QUINTA PRIORIDADE: amenities_list
  if ((space as any)?.amenities_list && Array.isArray((space as any).amenities_list) && (space as any).amenities_list.length > 0) {
    return (space as any).amenities_list as string[];
  }
  
  return [];
};
```

**PASSO 4**: Faça o MESMO em `EventSpaceCard.tsx` (por volta da linha 76):

**Substitua `getAmenities()` por**:
```typescript
const getAmenities = (): string[] => {
  // 1. Tentar space.amenities
  if (space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0) {
    const amenities = space.amenities;
    if (typeof amenities[0] === 'string') {
      return amenities;
    }
    if (amenities[0]?.name) {
      return amenities.map((a: any) => a.name);
    }
  }
  
  // 2. Tentar space.equipment?.amenities
  if (space.equipment?.amenities && Array.isArray(space.equipment.amenities) && space.equipment.amenities.length > 0) {
    const equipmentAmenities = space.equipment.amenities;
    if (typeof equipmentAmenities[0] === 'string') {
      return equipmentAmenities;
    }
    if (equipmentAmenities[0]?.name) {
      return equipmentAmenities.map((a: any) => a.name);
    }
  }
  
  // 3. Tentar amenities_list
  if (spaceAny.amenities_list && Array.isArray(spaceAny.amenities_list) && spaceAny.amenities_list.length > 0) {
    return spaceAny.amenities_list;
  }
  
  return [];
};
```

---

## 🔍 ORIGEM DO PROBLEMA #3: LOCALIZAÇÃO VAZIA

### Localização do Bug
- **Arquivo**: `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`
- **Linhas**: 175-205 (função `getLocation()`)
- **Arquivo**: `src/shared/components/event-spaces/EventSpaceCard.tsx`
- **Linhas**: 120-163 (função `getLocation()`)

### Causa Raiz
Os dados de localização estão vindo do backend, mas o código não está verificando TODAS as formas possíveis:
1. O hotel pode ter a localização
2. O espaço pode ter a localização
3. A localização pode estar em `locality` + `province`
4. A localização pode estar apenas em um campo `location`

### ✅ Solução

**PASSO 5**: No arquivo `EventSpaceDetailPage.tsx`, localize `getLocation()` (por volta da linha 175)

**Procure por**:
```typescript
const getLocation = (): string => {
  // 1. Tentar localização do hotel
  if (space.hotel?.locality && space.hotel?.province) {
    return `${space.hotel.locality}, ${space.hotel.province}`;
  }
```

**Substitua POR**:
```typescript
const getLocation = (): string => {
  // 1. Tentar localização do espaço (prioridade máxima)
  if ((space as any)?.location) {
    return (space as any).location;
  }
  
  // 2. Tentar localidade + província do espaço
  if ((space as any)?.locality && (space as any)?.province) {
    return `${(space as any).locality}, ${(space as any).province}`;
  }
  
  // 3. Tentar localização do hotel
  if (hotel?.locality && hotel?.province) {
    return `${hotel.locality}, ${hotel.province}`;
  }
  
  // 4. Tentar nome do hotel + cidade
  if (hotel?.name && hotel?.locality) {
    return `${hotel.name}, ${hotel.locality}`;
  }
  
  // 5. Tentar apenas localidade do hotel
  if (hotel?.locality) {
    return hotel.locality;
  }
  
  // 6. Tentar apenas localidade do espaço
  if ((space as any)?.locality) {
    return (space as any).locality;
  }
  
  return 'Localização não disponível';
};
```

**PASSO 6**: Faça o MESMO em `EventSpaceCard.tsx` (por volta da linha 120):

**Substitua `getLocation()` por**:
```typescript
const getLocation = (): string => {
  // 1. Tentar localização direta do espaço
  if (space.location) {
    return space.location;
  }
  
  // 2. Tentar localidade + província do espaço
  if (space.locality && space.province) {
    return `${space.locality}, ${space.province}`;
  }
  
  // 3. Tentar localização do hotel
  if (space.hotel?.locality && space.hotel?.province) {
    return `${space.hotel.locality}, ${space.hotel.province}`;
  }
  
  // 4. Tentar apenas localidade do hotel
  if (space.hotel?.locality) {
    return space.hotel.locality;
  }
  
  // 5. Tentar apenas localidade do espaço
  if (space.locality) {
    return space.locality;
  }
  
  return 'Localização não informada';
};
```

---

## 🔍 ORIGEM DO PROBLEMA #4: CAPACIDADE INCORRETA

### Localização do Bug
- **Arquivo**: `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`
- **Linhas**: 217-220 (função `getCapacity()`)
- **Arquivo**: `src/shared/components/event-spaces/EventSpaceCard.tsx`

### Causa Raiz
O backend pode retornar capacidade em dois formatos:
- `capacity_min` e `capacity_max` (snake_case)
- `capacityMin` e `capacityMax` (camelCase)

### ✅ Solução

**PASSO 7**: No arquivo `EventSpaceDetailPage.tsx`, localize `getCapacity()` (por volta da linha 217)

**Procure por**:
```typescript
const getCapacity = (): { min: number; max: number } => {
  const min = (space as any)?.capacityMin || (space as any)?.capacity_min || 0;
  const max = (space as any)?.capacityMax || (space as any)?.capacity_max || min || 0;
  return { min, max };
};
```

**Substitua POR**:
```typescript
const getCapacity = (): { min: number; max: number } => {
  // Tentar extrair valores válidos
  const min = Number((space as any)?.capacityMin || (space as any)?.capacity_min || 0);
  const max = Number((space as any)?.capacityMax || (space as any)?.capacity_max || 0);
  
  // Se max for menor que min, usar max como padrão
  return { 
    min: min > 0 ? min : 0, 
    max: max > 0 ? max : min 
  };
};
```

---

## 🔍 ORIGEM DO PROBLEMA #5: DADOS NA PÁGINA DE RESULTADOS

### Localização do Bug
- **Arquivo**: `src/apps/main-app/pages/EventSpacesSearchPage.tsx`
- **Linhas**: 80-140 (função `convertToEventSpace()`)

### Causa Raiz
A função `convertToEventSpace()` não está mapeando TODOS os campos que podem vir do backend.

### ✅ Solução

**PASSO 8**: No arquivo `EventSpacesSearchPage.tsx`, localize a função `convertToEventSpace()` (por volta da linha 80)

**Encontre esta seção**:
```typescript
function convertToEventSpace(data: any): ExtendedEventSpace {
  const baseSpace: EventSpace = {
    id: data.id || '',
    hotelId: data.hotelId || data.hotel_id || data.hotel?.id || '',
    hotel_id: data.hotelId || data.hotel_id || data.hotel?.id || '',
    name: data.name || 'Espaço sem nome',
    description: data.description || null,
    capacityMin: data.capacityMin || data.capacity_min || 0,
    capacityMax: data.capacityMax || data.capacity_max || 0,
    areaSqm: data.areaSqm || data.area_sqm || null,
    basePricePerDay: data.basePricePerDay || data.base_price_per_day || '0',
```

**Substitua APENAS a linha `basePricePerDay` por**:
```typescript
    // ✅ CORREÇÃO: Adicionar suporte a price_per_day
    basePricePerDay: data.pricePerDay || data.price_per_day || data.basePricePerDay || data.base_price_per_day || '0',
```

**E adicione para AMENITIES** (procure pela linha com `equipment` e adicione antes ou depois):
```typescript
    // ✅ ADICIONADO: Amenities com fallbacks
    amenities: (Array.isArray(data.amenities) && data.amenities.length > 0) 
      ? data.amenities 
      : (Array.isArray(data.equipment?.amenities) ? data.equipment.amenities : []),
```

---

## 🔧 EXEMPLO PRÁTICO: COMO APLICAR AS CORREÇÕES

### Exemplo 1: Corrigindo Preço em EventSpaceDetailPage.tsx

**Antes:**
```typescript
if ((spaceDetails as any)?.base_price_per_day) {
  const price = parseFloat((spaceDetails as any).base_price_per_day);
  if (!isNaN(price) && price > 0) return price;
}
```

**Depois:**
```typescript
// Adiciona ANTES
if ((spaceDetails as any)?.price_per_day) {
  const price = parseFloat((spaceDetails as any).price_per_day);
  if (!isNaN(price) && price > 0) return price;
}

// Mantém o código anterior
if ((spaceDetails as any)?.base_price_per_day) {
  const price = parseFloat((spaceDetails as any).base_price_per_day);
  if (!isNaN(price) && price > 0) return price;
}
```

### Exemplo 2: Corrigindo Amenities em EventSpaceCard.tsx

**Antes:**
```typescript
const getAmenities = (): string[] => {
  if (space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0) {
    return space.amenities;
  }
  return [];
};
```

**Depois:**
```typescript
const getAmenities = (): string[] => {
  // 1. Tentar space.amenities
  if (space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0) {
    return space.amenities;
  }
  
  // 2. Tentar space.equipment?.amenities
  if (space.equipment?.amenities && Array.isArray(space.equipment.amenities) && space.equipment.amenities.length > 0) {
    return space.equipment.amenities;
  }
  
  // 3. Tentar amenities_list
  if (spaceAny.amenities_list && Array.isArray(spaceAny.amenities_list) && spaceAny.amenities_list.length > 0) {
    return spaceAny.amenities_list;
  }
  
  return [];
};
```

---

## ✅ CHECKLIST DE CORREÇÕES

- [ ] **Correção #1**: Adicionado `price_per_day` em `EventSpaceDetailPage.tsx` - `getBasePrice()`
- [ ] **Correção #2**: Adicionado `price_per_day` em `EventSpaceCard.tsx` - `getBasePrice()`
- [ ] **Correção #3**: Melhorado `getAmenities()` em `EventSpaceDetailPage.tsx` com TODAS as prioridades
- [ ] **Correção #4**: Melhorado `getAmenities()` em `EventSpaceCard.tsx` com fallbacks
- [ ] **Correção #5**: Melhorado `getLocation()` em `EventSpaceDetailPage.tsx` com TODAS as possibilidades
- [ ] **Correção #6**: Melhorado `getLocation()` em `EventSpaceCard.tsx` com TODAS as possibilidades
- [ ] **Correção #7**: Validado `getCapacity()` em `EventSpaceDetailPage.tsx`
- [ ] **Correção #8**: Adicionado `amenities` e atualizado `basePricePerDay` em `EventSpacesSearchPage.tsx`
- [ ] **Teste**: Recarregar página e verificar se os dados aparecem corretamente
- [ ] **Teste**: Verificar se preços, amenities e localização aparecem em detalhes e resultados

---

## 🧪 COMO TESTAR AS CORREÇÕES

1. **Testar Detalhes do Espaço:**
   - Ir para `http://seu-site/event-spaces/{id}`
   - Verificar se o preço aparece (não é 0 ou "Sob consulta")
   - Verificar se amenities aparecem (não é vazio)
   - Verificar se localização aparece (não é "Localização não disponível")
   - Verificar se capacidade aparece (não é "-" ou 0)

2. **Testar Página de Resultados:**
   - Fazer uma busca de espaços
   - Verificar se os cards mostram preço
   - Verificar se os cards mostram localização
   - Verificar se os cards mostram capacidade

3. **Usar Console Browser (F12):**
   - Abrir DevTools (F12)
   - Ir para Console
   - Procurar por mensagens de DEBUG com "🔍 DEBUG"
   - Verificar se os dados estão sendo extraídos corretamente

---

## 📞 DÚVIDAS FREQUENTES

**P: Por que há tantos campos diferentes?**
R: O backend pode retornar os mesmos dados em formatos diferentes (camelCase, snake_case, ou em locais diferentes). O frontend precisa verificar TODAS as possibilidades para garantir compatibilidade.

**P: Preciso editar o backend?**
R: NÃO! Essas correções são apenas no frontend. O backend já está retornando os dados corretos, apenas em locais/formatos diferentes.

**P: E se ainda não funcionar?**
R: Abra o DevTools (F12), vá para a aba Network, procure pela requisição `/api/events/spaces/{id}` ou `/api/events/spaces/search`, e verifique o JSON retornado. Procure pelos campos mencionados neste guia.

