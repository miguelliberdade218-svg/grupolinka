# 🧠 MAPA MENTAL - CORREÇÃO DE DADOS DE EVENTOS

## 🎯 PROBLEMA CENTRAL

```
                    ┌─────────────────────────────┐
                    │  DADOS NÃO APARECEM         │
                    │  CORRETAMENTE              │
                    │  (Preço, Amenities, Etc)   │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
        ┌───────────▼──────────────┐  ┌──────────▼──────────────┐
        │ BACKEND RETORNA CORRETO  │  │ FRONTEND PROCURA ERRADO │
        │ price_per_day: 5000      │  │ base_price_per_day     │
        │ amenities: [...]         │  │ basePricePerDay        │
        │ locality: "Zimpeto"      │  │ (não encontra → 0)     │
        └──────────────────────────┘  └────────────────────────┘
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
FRONTEND/
│
├── EventSpaceDetailPage.tsx ⚙️ (3 funções a corrigir)
│   ├── getBasePrice() - linha 101
│   │   └─ Adicionar: price_per_day
│   │
│   ├── getAmenities() - linha 265
│   │   └─ Procurar em 5 lugares
│   │
│   └── getLocation() - linha 175
│       └─ Procurar em 6 lugares
│
├── EventSpaceCard.tsx ⚙️ (3 funções a corrigir)
│   ├── getBasePrice() - linha 51
│   │   └─ Adicionar: price_per_day
│   │
│   ├── getAmenities() - linha 76
│   │   └─ Procurar em 3 lugares
│   │
│   └── getLocation() - linha 120
│       └─ Procurar em 5 lugares
│
└── EventSpacesSearchPage.tsx ⚙️ (1 função a corrigir)
    └── convertToEventSpace() - linha 100
        └─ Mapear campos corretos
```

---

## 🔄 FLUXO DE DADOS (Antes ❌)

```
BACKEND API
    │
    ▼
{
  price_per_day: 5000,
  amenities: ['WiFi'],
  locality: 'Zimpeto'
}
    │
    ▼
Frontend procura:
getBasePrice() ❌
    → procura base_price_per_day ❌
    → return 0
    
getAmenities() ❌
    → procura só em um lugar ❌
    → return []
    
getLocation() ❌
    → procura só em um lugar ❌
    → return 'Não informada'
    │
    ▼
PÁGINA RENDERIZADA
    Preço: 0,00 MZN ❌
    Amenities: vazio ❌
    Localização: não informada ❌
    👤 Usuário: 😞 confuso
```

---

## 🔄 FLUXO DE DADOS (Depois ✅)

```
BACKEND API
    │
    ▼
{
  price_per_day: 5000,
  amenities: ['WiFi'],
  locality: 'Zimpeto'
}
    │
    ▼
Frontend procura:
getBasePrice() ✅
    → procura price_per_day ✅
    → return 5000
    
getAmenities() ✅
    → procura em 5 lugares ✅
    → return ['WiFi', 'AC']
    
getLocation() ✅
    → procura em 6 lugares ✅
    → return 'Zimpeto, Gaza'
    │
    ▼
PÁGINA RENDERIZADA
    Preço: 5.000,00 MZN ✅
    Amenities: WiFi, AC, Palco ✅
    Localização: Zimpeto, Gaza ✅
    👤 Usuário: 😊 satisfeito
```

---

## 📊 MATRIZ DE PROBLEMAS

```
┌──────────────────┬─────────────────────┬──────────────────┐
│ Problema         │ Backend Retorna     │ Frontend Procura │
├──────────────────┼─────────────────────┼──────────────────┤
│ Preço 0,00       │ price_per_day: 5000 │ base_price_per   │
│                  │                     │ day (❌ ERRADO)   │
├──────────────────┼─────────────────────┼──────────────────┤
│ Amenities vazio  │ amenities: [...]    │ Procura em 1     │
│                  │ equipment.amenities │ lugar só (❌)     │
├──────────────────┼─────────────────────┼──────────────────┤
│ Localização vazia│ locality: "..."     │ Procura em 1     │
│                  │ province: "..."     │ lugar só (❌)     │
├──────────────────┼─────────────────────┼──────────────────┤
│ Capacidade "-"   │ capacity_min/max    │ capacityMin/Max  │
│                  │                     │ (PARCIALMENTE OK) │
└──────────────────┴─────────────────────┴──────────────────┘
```

---

## 🎯 SOLUÇÃO POR PROBLEMA

```
┌────────────────────────────────────────────────────────────┐
│ PROBLEMA #1: PREÇO 0,00                                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ANTES:                         DEPOIS:                    │
│  ─────────                      ───────                    │
│  if (base_price_per_day) ❌      if (price_per_day) ✅     │
│    return value                  if (base_price_per_day) ✅│
│                                  if (basePricePerDay) ✅   │
│  RESULTADO: 0                    RESULTADO: 5000 ✅        │
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ PROBLEMA #2: AMENITIES VAZIO                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ANTES:                         DEPOIS:                    │
│  ─────────                      ───────                    │
│  if (space.amenities) ❌         if (amenities) ✅          │
│    return amenities             if (equipment.amenities) ✅│
│                                 if (amenities_list) ✅     │
│  RESULTADO: []                  RESULTADO: ['WiFi', ...] ✅│
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ PROBLEMA #3: LOCALIZAÇÃO VAZIA                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ANTES:                         DEPOIS:                    │
│  ─────────                      ───────                    │
│  if (hotel.locality) ❌          if (space.location) ✅     │
│    return location              if (locality + province) ✅│
│                                 if (hotel data) ✅         │
│  RESULTADO: "Não informada"     RESULTADO: "Zimpeto" ✅   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 📈 PRIORIDADE DE CAMPOS

### Preço (getBasePrice)

```
Ordem de Procura:
1. price_per_day ← NOVO! MÁXIMA PRIORIDADE
2. pricePerDay
3. basePricePerDay
4. base_price_per_day
5. spaceDetailsResponse?.data?.base_price_per_day
6. return 0
```

### Amenities (getAmenities)

```
Ordem de Procura:
1. spaceDetails.amenities
2. space.amenities
3. space.equipment.amenities ← NOVO!
4. spaceDetailsResponse?.data?.amenities
5. space.amenities_list ← NOVO!
6. return []
```

### Localização (getLocation)

```
Ordem de Procura:
1. space.location ← NOVO!
2. space.locality + space.province
3. hotel.locality + hotel.province
4. hotel.name + hotel.locality
5. hotel.locality
6. space.locality
7. return 'Não disponível'
```

---

## 🔧 PADRÃO DE CORREÇÃO

```
┌────────────────────────────────────────────┐
│ PADRÃO: Procurar em Múltiplos Lugares      │
├────────────────────────────────────────────┤
│                                            │
│ getField = (): Type => {                   │
│   // 1. PRIMEIRA PRIORIDADE               │
│   if (source1?.field) return value;        │
│                                            │
│   // 2. SEGUNDA PRIORIDADE                │
│   if (source2?.field) return value;        │
│                                            │
│   // 3. TERCEIRA PRIORIDADE               │
│   if (source3?.field) return value;        │
│                                            │
│   // Mais prioridades...                   │
│                                            │
│   // Fallback final                        │
│   return defaultValue;                     │
│ }                                          │
│                                            │
└────────────────────────────────────────────┘

Aplicado a cada:
✅ getBasePrice() → 5 prioridades
✅ getAmenities() → 5 prioridades
✅ getLocation() → 6 prioridades
```

---

## 🎨 VISUALIZAÇÃO: ANTES vs DEPOIS

```
┌───────────────────────────────┐┌───────────────────────────────┐
│ ANTES ❌                       ││ DEPOIS ✅                     │
├───────────────────────────────┤├───────────────────────────────┤
│                               ││                               │
│ 💰 Preço: 0,00 MZN            ││ 💰 Preço: 5.000,00 MZN       │
│    Sob consulta               ││    Fim de semana: +12%        │
│                               ││                               │
│ 🛋️  Comodidades:              ││ 🛋️  Comodidades:             │
│    Nenhuma listada            ││    ✅ WiFi                    │
│                               ││    ✅ Ar Condicionado         │
│                               ││    ✅ Palco                   │
│                               ││    ✅ Catering                │
│                               ││                               │
│ 📍 Localização:               ││ 📍 Localização:              │
│    Não informada              ││    Zimpeto, Gaza              │
│                               ││    Hotel Teste Maputo         │
│                               ││                               │
│ 👥 Capacidade:                ││ 👥 Capacidade:               │
│    - pessoas                  ││    20–150 pessoas            │
│    - pessoas máxima           ││    Área: 500m²               │
│                               ││                               │
│ 👤 Usuário: 😞 Confuso        ││ 👤 Usuário: 😊 Satisfeito    │
│                               ││                               │
└───────────────────────────────┘└───────────────────────────────┘
```

---

## 📞 DECISÃO RÁPIDA - QUAL DOCUMENTO?

```
Pergunta: "Por onde começo?"
└─> RESPOSTA: Leia INICIO_RAPIDO.md (5 min)

Pergunta: "Qual é o problema exatamente?"
└─> RESPOSTA: Veja RESUMO_VISUAL_PROBLEMAS.md

Pergunta: "Como editar em VS Code?"
└─> RESPOSTA: Veja TUTORIAL_VISUAL_EDICOES.md

Pergunta: "Preciso dos códigos prontos"
└─> RESPOSTA: CODIGOS_PRONTOS_PARA_COLAR.md

Pergunta: "Sigo passo-a-passo completo"
└─> RESPOSTA: GUIA_PASSO_A_PASSO.md

Pergunta: "Entendo a causa técnica?"
└─> RESPOSTA: GUIA_CORRECOES_DADOS_EVENTOS.md

Pergunta: "Preciso de visão geral"
└─> RESPOSTA: SUMARIO_EXECUTIVO.md

Pergunta: "Onde estão todos os docs?"
└─> RESPOSTA: README_CORRECOES_EVENTOS.md
```

---

## ✅ CHECKLIST MENTAL

```
ANTES DE EDITAR:
☐ Li INICIO_RAPIDO.md
☐ Tenho VS Code aberto
☐ Arquivo está salvo (sem mudanças)

DURANTE EDIÇÃO:
☐ Usei Ctrl+F para achar função
☐ Selecionei toda a função (azul)
☐ Copiei código novo (Ctrl+C)
☐ Colei sobre antigo (Ctrl+V)
☐ Salvei arquivo (Ctrl+S)

DEPOIS DE EDITAR:
☐ Verifiquei erros: Ctrl+Shift+M
☐ Testei no navegador (Ctrl+Shift+R)
☐ Abri DevTools (F12)
☐ Procurei por "🔍 DEBUG"
☐ Compaei dados antes/depois
```

---

## 🚀 FLUXO RECOMENDADO

```
START
  │
  ▼
┌─────────────────────────────┐
│ 1. Ler INICIO_RAPIDO (5min) │
└──────────────┬──────────────┘
               │
               ▼
        Entendeu?
        ├─ SIM → continue
        └─ NÃO → Leia RESUMO_VISUAL
               │
               ▼
┌──────────────────────────────┐
│ 2. Abrir CODIGOS_PRONTOS_COLAR│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 3. Seguir GUIA_PASSO_A_PASSO │
│    Passo 1-7                 │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 4. Testes (F12 > Console)    │
│    Procura "🔍 DEBUG"        │
└──────────────┬───────────────┘
               │
               ▼
        Funcionou?
        ├─ SIM → ✅ SUCESSO!
        │        Make commit
        │        Deploy
        └─ NÃO → Debug
                 Ctrl+Z (desfaz)
                 Tenta novamente
                 Lê GUIA_CORRECOES
```

---

## 🎓 CONCEITO FUNDAMENTAL

```
┌─────────────────────────────────────────────────────┐
│ TIPO: Impedância de Nomenclatura                    │
│                                                     │
│ O backend e frontend usam nomes diferentes para    │
│ os mesmos campos. Solução: Procurar por TODOS.     │
│                                                     │
│ Como um tradutor:                                  │
│ - Backend fala: "price_per_day"                    │
│ - Frontend ouve: "basePricePerDay"                 │
│ - Tradutor (frontend corrigido): "Qual deles?"    │
│ - Encontra: ✅ "Ah, é este!"                       │
└─────────────────────────────────────────────────────┘
```

---

**Próximo passo?** → [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

