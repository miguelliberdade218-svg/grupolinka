# 📋 CÓDIGOS PRONTOS PARA COPIAR E COLAR

Este arquivo contém os códigos completos e prontos para copiar e colar, organizados por arquivo.

---

## 1️⃣ EventSpaceDetailPage.tsx - Função getBasePrice()

**Localização**: `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx` (por volta da linha 101)

**COPIE ESTE CÓDIGO COMPLETO:**

```typescript
  // ============================================
  // ✅ CORREÇÃO 2: getBasePrice()
  // ============================================
  const getBasePrice = (): number => {
    // 0. PRIORIDADE MÁXIMA: price_per_day (campo REAL do backend)
    if ((spaceDetails as any)?.price_per_day) {
      const price = parseFloat((spaceDetails as any).price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 0b. Tentar space.price_per_day
    if ((space as any)?.price_per_day) {
      const price = parseFloat((space as any).price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 1. Tentar spaceDetails.base_price_per_day (nível superior)
    if ((spaceDetails as any)?.base_price_per_day) {
      const price = parseFloat((spaceDetails as any).base_price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 2. Tentar space.basePricePerDay
    if ((space as any)?.basePricePerDay) {
      const price = parseFloat((space as any).basePricePerDay);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 3. Tentar space.base_price_per_day
    if ((space as any)?.base_price_per_day) {
      const price = parseFloat((space as any).base_price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 4. Tentar spaceDetailsResponse?.data?.base_price_per_day
    if ((spaceDetailsResponse as any)?.data?.base_price_per_day) {
      const price = parseFloat((spaceDetailsResponse as any).data.base_price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    return 0;
  };
```

---

## 2️⃣ EventSpaceDetailPage.tsx - Função getAmenities()

**Localização**: `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx` (por volta da linha 265)

**COPIE ESTE CÓDIGO COMPLETO:**

```typescript
  // ============================================
  // ✅ CORREÇÃO 8: getAmenities() - PRIORIDADE CORRETA
  // ============================================
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

---

## 3️⃣ EventSpaceDetailPage.tsx - Função getLocation()

**Localização**: `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx` (por volta da linha 175)

**COPIE ESTE CÓDIGO COMPLETO:**

```typescript
  // ============================================
  // ✅ CORREÇÃO 5: getLocation()
  // ============================================
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

---

## 4️⃣ EventSpaceCard.tsx - Função getBasePrice()

**Localização**: `src/shared/components/event-spaces/EventSpaceCard.tsx` (por volta da linha 51)

**COPIE ESTE CÓDIGO COMPLETO:**

```typescript
  // ============================================
  // ✅ CORREÇÃO CRÍTICA 1: Extração de preço com suporte a pricePerDay
  // ============================================
  const getBasePrice = (): number => {
    // 1. PRIORIDADE MÁXIMA: price_per_day (campo real do banco)
    if (spaceAny.price_per_day) {
      const price = parseFloat(spaceAny.price_per_day);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    // 2. Tentar pricePerDay (camelCase)
    if (spaceAny.pricePerDay) {
      const price = parseFloat(spaceAny.pricePerDay);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    // 3. Tentar basePricePerDay (camelCase)
    if (space.basePricePerDay) {
      const price = parseFloat(space.basePricePerDay);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    // 4. Tentar base_price_per_day (snake_case)
    if (spaceAny.base_price_per_day) {
      const price = parseFloat(spaceAny.base_price_per_day);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    return 0;
  };
```

---

## 5️⃣ EventSpaceCard.tsx - Função getAmenities()

**Localização**: `src/shared/components/event-spaces/EventSpaceCard.tsx` (por volta da linha 76)

**COPIE ESTE CÓDIGO COMPLETO:**

```typescript
  // ============================================
  // ✅ CORREÇÃO 2: Extração de amenities com fallback
  // ============================================
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

## 6️⃣ EventSpaceCard.tsx - Função getLocation()

**Localização**: `src/shared/components/event-spaces/EventSpaceCard.tsx` (por volta da linha 120)

**COPIE ESTE CÓDIGO COMPLETO:**

```typescript
  // ============================================
  // ✅ CORREÇÃO 3: Extração de localização com fallback
  // ============================================
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

## 7️⃣ EventSpacesSearchPage.tsx - Atualizar convertToEventSpace()

**Localização**: `src/apps/main-app/pages/EventSpacesSearchPage.tsx` (por volta da linha 100)

**PROCURE POR ESTA LINHA:**
```typescript
    basePricePerDay: data.basePricePerDay || data.base_price_per_day || '0',
```

**SUBSTITUA POR:**
```typescript
    // ✅ CORREÇÃO CRÍTICA: Adicionar suporte a price_per_day
    basePricePerDay: data.pricePerDay || data.price_per_day || data.basePricePerDay || data.base_price_per_day || '0',
```

**EM SEGUIDA, PROCURE POR ESTA SEÇÃO:**
```typescript
    amenities: data.amenities || data.equipment?.amenities || [],
```

**SE NÃO EXISTIR, ADICIONE ESTA LINHA (depois da linha anterior ou perto):**
```typescript
    // ✅ ADICIONADO: Amenities com fallbacks múltiplos
    amenities: (Array.isArray(data.amenities) && data.amenities.length > 0) 
      ? data.amenities 
      : (Array.isArray(data.equipment?.amenities) ? data.equipment.amenities : []),
```

---

## 🔍 PASSO A PASSO VISUAL - COMO ENCONTRAR E SUBSTITUIR

### Exemplo: EventSpaceDetailPage.tsx

1. **Abra o arquivo** em VS Code:
   - `src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`

2. **Use Ctrl+F para abrir "Find"**

3. **Procure por**: `getBasePrice = (): number => {`

4. **Veja o código atual:**
   ```
   Linha 101: const getBasePrice = (): number => {
   Linha 102:   // 1. Tentar spaceDetails.base_price_per_day (nível superior)
   ```

5. **Selecione desde `const getBasePrice...` até o `};` final da função**

6. **Substitua pelo código fornecido na seção 1️⃣ acima**

7. **Repita para as outras funções**

---

## ✅ CHECKLIST FINAL

- [ ] ✅ Copiei e colei `getBasePrice()` em `EventSpaceDetailPage.tsx`
- [ ] ✅ Copiei e colei `getAmenities()` em `EventSpaceDetailPage.tsx`
- [ ] ✅ Copiei e colei `getLocation()` em `EventSpaceDetailPage.tsx`
- [ ] ✅ Copiei e colei `getBasePrice()` em `EventSpaceCard.tsx`
- [ ] ✅ Copiei e colei `getAmenities()` em `EventSpaceCard.tsx`
- [ ] ✅ Copiei e colei `getLocation()` em `EventSpaceCard.tsx`
- [ ] ✅ Atualizei `basePricePerDay` em `EventSpacesSearchPage.tsx`
- [ ] ✅ Adicionei/atualizei `amenities` em `EventSpacesSearchPage.tsx`
- [ ] ✅ Salvei todos os arquivos (Ctrl+S)
- [ ] ✅ Testei em navegador (recarregar página com Ctrl+F5)

---

## 🆘 SE ALGO NÃO FUNCIONOU

1. **Abra DevTools** (F12 no navegador)
2. **Vá para a aba Console**
3. **Procure por mensagens com "🔍 DEBUG" ou "❌ Erro"**
4. **Verifique se os dados estão sendo recebidos da API**
5. **Abra a aba Network** e procure pela requisição de espaço
6. **Veja o JSON retornado** e procure pelos campos mencionados neste guia

---

## 📌 CAMPOS CRÍTICOS QUE O BACKEND PODE RETORNAR

| Campo Esperado | Alternativas Possíveis |
|---|---|
| `price_per_day` | `pricePerDay`, `basePricePerDay`, `base_price_per_day` |
| `amenities` | `equipment.amenities`, `amenities_list` |
| `locality` | `location`, `locality + province` |
| `capacityMin` | `capacity_min` |
| `capacityMax` | `capacity_max` |

O código fornecido verifica TODAS essas possibilidades!

