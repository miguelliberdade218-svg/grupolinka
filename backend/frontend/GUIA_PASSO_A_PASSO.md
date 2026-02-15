# 🚀 GUIA PASSO-A-PASSO PARA IMPLEMENTAR CORREÇÕES

## 📝 Pré-requisitos
- ✅ VS Code aberto com o projeto
- ✅ Terminal aberto (Ctrl + `)
- ✅ Conhecimento básico de VS Code (Find, Replace)

---

## ✏️ PASSO 1: Corrigir getBasePrice() em EventSpaceDetailPage.tsx

### Localização
`src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`

### Instruções

1. **Pressione Ctrl+F** para abrir Find
2. **Procure por**: `const getBasePrice = (): number => {`
3. **Navegue até a primeira ocorrência** (deve estar por volta da linha 101)
4. **Selecione toda a função** (desde `const getBasePrice...` até o `};` correspondente)
   - Dica: Clique no início, depois Shift+Click no fim
5. **Copie o código novo da seção "1️⃣ EventSpaceDetailPage.tsx - Função getBasePrice()"** do arquivo `CODIGOS_PRONTOS_PARA_COLAR.md`
6. **Cole sobre o código anterior** (Ctrl+V)
7. **Salve o arquivo** (Ctrl+S)

**Resultado esperado:**
```typescript
const getBasePrice = (): number => {
  // 0. PRIORIDADE MÁXIMA: price_per_day
  if ((spaceDetails as any)?.price_per_day) {
    ...
  }
  // Resto do código
}
```

---

## ✏️ PASSO 2: Corrigir getAmenities() em EventSpaceDetailPage.tsx

### Localização
`src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`

### Instruções

1. **Pressione Ctrl+F** para abrir Find
2. **Procure por**: `const getAmenities = (): string[] => {`
3. **Navegue até a ocorrência** (deve estar por volta da linha 265)
4. **Selecione toda a função**
5. **Copie o código novo da seção "2️⃣ EventSpaceDetailPage.tsx - Função getAmenities()"**
6. **Cole sobre o código anterior**
7. **Salve o arquivo** (Ctrl+S)

**Resultado esperado:**
```typescript
const getAmenities = (): string[] => {
  // 1. PRIMEIRA PRIORIDADE: spaceDetails.amenities
  if ((spaceDetails as any)?.amenities && Array.isArray(...)) {
    ...
  }
  // Resto do código com 5 prioridades
}
```

---

## ✏️ PASSO 3: Corrigir getLocation() em EventSpaceDetailPage.tsx

### Localização
`src/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage.tsx`

### Instruções

1. **Pressione Ctrl+F** para abrir Find
2. **Procure por**: `const getLocation = (): string => {`
3. **Navegue até a ocorrência** (deve estar por volta da linha 175)
4. **Selecione toda a função**
5. **Copie o código novo da seção "3️⃣ EventSpaceDetailPage.tsx - Função getLocation()"**
6. **Cole sobre o código anterior**
7. **Salve o arquivo** (Ctrl+S)

**Resultado esperado:**
```typescript
const getLocation = (): string => {
  // 1. Tentar localização do espaço (prioridade máxima)
  if ((space as any)?.location) {
    ...
  }
  // Resto do código com 6 prioridades
}
```

---

## ✏️ PASSO 4: Corrigir getBasePrice() em EventSpaceCard.tsx

### Localização
`src/shared/components/event-spaces/EventSpaceCard.tsx`

### Instruções

1. **Abra o arquivo** `src/shared/components/event-spaces/EventSpaceCard.tsx`
2. **Pressione Ctrl+F** para abrir Find
3. **Procure por**: `const getBasePrice = (): number => {`
4. **Navegue até a ocorrência** (deve estar por volta da linha 51)
5. **Selecione toda a função**
6. **Copie o código novo da seção "4️⃣ EventSpaceCard.tsx - Função getBasePrice()"**
7. **Cole sobre o código anterior**
8. **Salve o arquivo** (Ctrl+S)

**Resultado esperado:**
```typescript
const getBasePrice = (): number => {
  // 1. PRIORIDADE MÁXIMA: price_per_day
  if (spaceAny.price_per_day) {
    ...
  }
  // Resto do código
}
```

---

## ✏️ PASSO 5: Corrigir getAmenities() em EventSpaceCard.tsx

### Localização
`src/shared/components/event-spaces/EventSpaceCard.tsx`

### Instruções

1. **Pressione Ctrl+F** para abrir Find
2. **Procure por**: `const getAmenities = (): string[] => {`
3. **Navegue até a ocorrência** (deve estar por volta da linha 76)
4. **Selecione toda a função**
5. **Copie o código novo da seção "5️⃣ EventSpaceCard.tsx - Função getAmenities()"**
6. **Cole sobre o código anterior**
7. **Salve o arquivo** (Ctrl+S)

**Resultado esperado:**
```typescript
const getAmenities = (): string[] => {
  // 1. Tentar space.amenities
  if (space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0) {
    ...
  }
  // Resto do código com fallbacks
}
```

---

## ✏️ PASSO 6: Corrigir getLocation() em EventSpaceCard.tsx

### Localização
`src/shared/components/event-spaces/EventSpaceCard.tsx`

### Instruções

1. **Pressione Ctrl+F** para abrir Find
2. **Procure por**: `const getLocation = (): string => {`
3. **Navegue até a ocorrência** (deve estar por volta da linha 120)
4. **Selecione toda a função**
5. **Copie o código novo da seção "6️⃣ EventSpaceCard.tsx - Função getLocation()"**
6. **Cole sobre o código anterior**
7. **Salve o arquivo** (Ctrl+S)

**Resultado esperado:**
```typescript
const getLocation = (): string => {
  // 1. Tentar localização direta do espaço
  if (space.location) {
    ...
  }
  // Resto do código com 6 prioridades
}
```

---

## ✏️ PASSO 7: Atualizar convertToEventSpace() em EventSpacesSearchPage.tsx

### Localização
`src/apps/main-app/pages/EventSpacesSearchPage.tsx`

### Instruções

1. **Abra o arquivo** `src/apps/main-app/pages/EventSpacesSearchPage.tsx`
2. **Pressione Ctrl+F** para abrir Find
3. **Procure por**: `basePricePerDay: data.basePricePerDay || data.base_price_per_day || '0',`
4. **Quando encontrar a linha, clique nela**
5. **Selecione APENAS esta linha**
6. **Substitua por** (você pode copiar desta linha):
   ```typescript
   basePricePerDay: data.pricePerDay || data.price_per_day || data.basePricePerDay || data.base_price_per_day || '0',
   ```
7. **Agora procure por**: `amenities: data.amenities || data.equipment?.amenities || [],`
8. **Se encontrar, clique na linha**
9. **Se NÃO encontrar**, procure pela linha anterior:
   ```typescript
   equipment: data.equipment || {},
   ```
   e adicione DEPOIS dela:
   ```typescript
   amenities: (Array.isArray(data.amenities) && data.amenities.length > 0) 
     ? data.amenities 
     : (Array.isArray(data.equipment?.amenities) ? data.equipment.amenities : []),
   ```
10. **Salve o arquivo** (Ctrl+S)

**Resultado esperado:**
```typescript
basePricePerDay: data.pricePerDay || data.price_per_day || data.basePricePerDay || data.base_price_per_day || '0',
amenities: (Array.isArray(data.amenities) && data.amenities.length > 0) 
  ? data.amenities 
  : (Array.isArray(data.equipment?.amenities) ? data.equipment.amenities : []),
```

---

## 🧪 PASSO 8: Testar as Correções

### Teste 1: Verificar se há erros de compilação

1. **Verifique a aba de Problemas do VS Code**
2. **Pressione Ctrl+Shift+M** para abrir a aba de Problemas
3. **Se houver erros vermelhos, revise o código colado**

### Teste 2: Recarregar a página

1. **Abra o navegador** na página de detalhes de um espaço
   - URL: `http://localhost:5173/event-spaces/{id}`
2. **Pressione Ctrl+Shift+R** para recarregar (bypass de cache)
3. **Verifique:**
   - ✅ Preço aparece (não é 0,00)
   - ✅ Amenities aparecem (não está vazio)
   - ✅ Localização aparece (não é "não informada")
   - ✅ Capacidade aparece (não é "-")

### Teste 3: Abrir DevTools

1. **Pressione F12** para abrir DevTools
2. **Vá para a aba Console**
3. **Procure por mensagens com "🔍 DEBUG"**
4. **Verifique os valores extraídos**

### Teste 4: Página de Resultados

1. **Faça uma busca de espaços**
2. **URL**: `http://localhost:5173/search-event-spaces`
3. **Verifique se os cards mostram:**
   - ✅ Preço
   - ✅ Localização
   - ✅ Capacidade
   - ✅ Amenities (primeiras 3-4)

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro: "Cannot find 'getBasePrice'"

**Causa:** Você não encontrou a função correta.

**Solução:**
1. Procure por `getBasePrice` sem o `const`
2. Ou procure por `getBasePrice =`
3. Ou procure por `function getBasePrice`

### Erro: "Unexpected token"

**Causa:** O código foi colado incorretamente ou há chaves faltando.

**Solução:**
1. Pressione Ctrl+Z para desfazer
2. Tente novamente
3. Verifique se o código começa com `const` e termina com `};`

### Dados ainda não aparecem

**Causa:** Mudanças não foram detectadas pelo Vite.

**Solução:**
1. Pressione Ctrl+Shift+R** no navegador
2. Ou feche e reabra a aba
3. Ou reinicie o servidor Vite (Ctrl+C no terminal e `npm run dev`)

### Mensagem de erro na console

**Solução:**
1. Abra DevTools (F12)
2. Vá para Network
3. Procure pela requisição de espaço
4. Verifique se o JSON contém os campos esperados
5. Compare com o que o código está procurando

---

## ✅ CHECKLIST FINAL

Marque cada passo conforme completa:

- [ ] ✅ PASSO 1: `getBasePrice()` em EventSpaceDetailPage.tsx
- [ ] ✅ PASSO 2: `getAmenities()` em EventSpaceDetailPage.tsx
- [ ] ✅ PASSO 3: `getLocation()` em EventSpaceDetailPage.tsx
- [ ] ✅ PASSO 4: `getBasePrice()` em EventSpaceCard.tsx
- [ ] ✅ PASSO 5: `getAmenities()` em EventSpaceCard.tsx
- [ ] ✅ PASSO 6: `getLocation()` em EventSpaceCard.tsx
- [ ] ✅ PASSO 7: Atualizar convertToEventSpace() em EventSpacesSearchPage.tsx
- [ ] ✅ PASSO 8: Todos os arquivos salvos (Ctrl+S)
- [ ] ✅ Nenhum erro na aba de Problemas
- [ ] ✅ Página de detalhes mostra dados corretos
- [ ] ✅ Página de resultados mostra dados corretos
- [ ] ✅ DevTools Console mostra mensagens DEBUG corretas

---

## 📞 SE TIVER DÚVIDAS

1. **Consulte os 3 arquivos de suporte:**
   - `GUIA_CORRECOES_DADOS_EVENTOS.md` - Explicação detalhada
   - `CODIGOS_PRONTOS_PARA_COLAR.md` - Códigos prontos
   - `RESUMO_VISUAL_PROBLEMAS.md` - Visualização dos problemas

2. **Verifique o DevTools:**
   - Console: Procure por mensagens DEBUG
   - Network: Verifique o JSON retornado
   - Elements: Inspecione o HTML renderizado

3. **Undo é seu amigo:**
   - Pressione Ctrl+Z para desfazer qualquer mudança
   - Sem medo de errar!

---

## 🎉 PRÓXIMOS PASSOS

Depois de implementar as correções:

1. ✅ Testar em múltiplos espaços
2. ✅ Testar em múltiplos navegadores
3. ✅ Verificar performance (DevTools > Performance)
4. ✅ Fazer commit no Git: `git commit -m "fix: corrigir exibição de dados de espaços de eventos"`
5. ✅ Deploy para produção (se aplicável)

**Parabéns! Você corrigiu os dados dos espaços de eventos! 🎊**

