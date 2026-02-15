# 🚀 INÍCIO RÁPIDO - 5 MINUTOS

## ⚡ A Essência do Problema

```
BACKEND retorna:           FRONTEND procura:      RESULTADO:
{                         getBasePrice() {
  price_per_day: 5000       ❌ base_price_per_day    ❌ return 0
  ...                       ❌ basePricePerDay       ❌ Mostra 0,00
}                         }
```

## ✅ A Solução

Alterar 3 funções em 3 arquivos para procurar pelos campos REAIS do backend.

---

## 📋 O QUE FAZER (em 7 etapas)

### Arquivo 1: `EventSpaceDetailPage.tsx`

**PASSO 1** - Função `getBasePrice()` (linha ~101)
- Adicione: `if ((spaceDetails as any)?.price_per_day) { ... }`
- Código: [CODIGOS_PRONTOS_PARA_COLAR.md#1](CODIGOS_PRONTOS_PARA_COLAR.md)

**PASSO 2** - Função `getAmenities()` (linha ~265)
- Substitua com versão que tenta 5 lugares diferentes
- Código: [CODIGOS_PRONTOS_PARA_COLAR.md#2](CODIGOS_PRONTOS_PARA_COLAR.md)

**PASSO 3** - Função `getLocation()` (linha ~175)
- Substitua com versão que tenta 6 lugares diferentes
- Código: [CODIGOS_PRONTOS_PARA_COLAR.md#3](CODIGOS_PRONTOS_PARA_COLAR.md)

### Arquivo 2: `EventSpaceCard.tsx`

**PASSO 4** - Função `getBasePrice()` (linha ~51)
- Adicione: `if (spaceAny.price_per_day) { ... }`
- Código: [CODIGOS_PRONTOS_PARA_COLAR.md#4](CODIGOS_PRONTOS_PARA_COLAR.md)

**PASSO 5** - Função `getAmenities()` (linha ~76)
- Substitua com versão com 3 fallbacks
- Código: [CODIGOS_PRONTOS_PARA_COLAR.md#5](CODIGOS_PRONTOS_PARA_COLAR.md)

**PASSO 6** - Função `getLocation()` (linha ~120)
- Substitua com versão com 5 possibilidades
- Código: [CODIGOS_PRONTOS_PARA_COLAR.md#6](CODIGOS_PRONTOS_PARA_COLAR.md)

### Arquivo 3: `EventSpacesSearchPage.tsx`

**PASSO 7** - Função `convertToEventSpace()` (linha ~100)
- Altere `basePricePerDay` para incluir `price_per_day`
- Adicione `amenities` com fallback
- Código: [CODIGOS_PRONTOS_PARA_COLAR.md#7](CODIGOS_PRONTOS_PARA_COLAR.md)

---

## 🎯 Como Editar (3 passos por função)

### Step 1: Encontrar
```
Ctrl+F → escreva "getBasePrice" → Enter
```

### Step 2: Selecionar
```
Clique no começo → Arraste até o final
Toda a função fica azul
```

### Step 3: Colar
```
Ctrl+C (copiar código novo)
Ctrl+V (colar sobre o antigo)
Ctrl+S (salvar)
```

**Pronto!** A função foi corrigida.

---

## 📚 Documentação Disponível

| Doc | Tempo | Conteúdo |
|-----|-------|----------|
| [README_CORRECOES_EVENTOS.md](README_CORRECOES_EVENTOS.md) | 2 min | Índice com links |
| [SUMARIO_EXECUTIVO.md](SUMARIO_EXECUTIVO.md) | 10 min | Visão geral |
| [RESUMO_VISUAL_PROBLEMAS.md](RESUMO_VISUAL_PROBLEMAS.md) | 15 min | Antes/depois visual |
| [GUIA_PASSO_A_PASSO.md](GUIA_PASSO_A_PASSO.md) | 20 min | Tutorial completo |
| [CODIGOS_PRONTOS_PARA_COLAR.md](CODIGOS_PRONTOS_PARA_COLAR.md) | 5 min | Códigos para copiar |
| [GUIA_CORRECOES_DADOS_EVENTOS.md](GUIA_CORRECOES_DADOS_EVENTOS.md) | 30 min | Referência técnica |
| [TUTORIAL_VISUAL_EDICOES.md](TUTORIAL_VISUAL_EDICOES.md) | 15 min | Como editar em VS Code |

---

## 🧪 Teste Rápido

Depois de editar:

1. Pressione **F12** (DevTools)
2. Vá para **Console**
3. Procure por **"🔍 DEBUG"**
4. Veja se os valores mudaram

```
Antes:
basePrice: 0
amenities: []
location: "Localização não informada"

Depois:
basePrice: 5000
amenities: ['WiFi', 'AC', 'Palco']
location: "Zimpeto, Gaza"
```

**Se viu isso: ✅ SUCESSO!**

---

## 💡 Conceito-Chave

O frontend procura por VÁRIOS nomes possíveis para o MESMO campo:

```
Preço:
  price_per_day ← Backend usa este
  pricePerDay
  basePricePerDay ← Frontend procurava este
  base_price_per_day

Comodidades:
  amenities ← Backend pode usar este
  equipment.amenities ← Ou este
  amenities_list ← Ou até este

Localização:
  location ← Backend pode usar este
  locality + province ← Ou isto
  space.location ← Ou até isto
```

Solução: **Procurar por TODOS!** ✅

---

## 🚀 Fluxo Rápido

```
1. Abra VS Code
2. Abra cada arquivo
3. Use Ctrl+F para achar função
4. Copie código de CODIGOS_PRONTOS_PARA_COLAR.md
5. Cole no arquivo (Ctrl+V)
6. Salve (Ctrl+S)
7. Repita para 7 funções
8. Teste no navegador
9. PRONTO! ✅
```

**Tempo total: 20 minutos**

---

## ✨ Depois que Terminar

```
git add .
git commit -m "fix: corrigir exibição de dados de espaços"
```

E é isso! Os dados agora mostram corretamente em:
- ✅ Página de detalhes
- ✅ Página de resultados
- ✅ Cards de apresentação

---

## 🎯 Resumo em Uma Frase

> "O backend retorna `price_per_day`, mas o frontend procura `base_price_per_day`. Alterar o frontend para procurar pelo campo REAL do backend."

---

**Próximo passo?** → [GUIA_PASSO_A_PASSO.md](GUIA_PASSO_A_PASSO.md)

