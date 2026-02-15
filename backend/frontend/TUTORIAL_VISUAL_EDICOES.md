# 🎓 TUTORIAL VISUAL - COMO ENCONTRAR E EDITAR FUNÇÕES

## 📌 Introdução

Este guia mostra EXATAMENTE como encontrar e editar cada função usando VS Code.

---

## 🔎 PARTE 1: COMO PROCURAR POR UMA FUNÇÃO

### Passo 1: Abrir a Função Find
```
Pressione: Ctrl+F

Resultado: Uma caixa aparece no canto superior direito
```

### Passo 2: Digitar o Nome da Função
```
Caixa de busca: getBasePrice = (): number => {

Resultado: VS Code destaca todas as ocorrências
```

### Passo 3: Navegar para a Função
```
Se houver múltiplas: Use ↑ e ↓ para navegar
               Ou clique em "Previous/Next" na caixa de busca
```

### Passo 4: Fechar a Busca
```
Pressione: Escape
```

---

## ✂️ PARTE 2: COMO SELECIONAR UMA FUNÇÃO

### Método 1: Clique + Arraste (Simples)

```
1. Posicione mouse no começo de "const"
2. Clique e segure
3. Arraste até o "}" final da função
4. Solte o mouse

Resultado: Função inteira selecionada (azul/destaque)
```

### Método 2: Duplo Clique + Shift+End (Avançado)

```
1. Duplo-clique em "getBasePrice"
2. Pressione Shift+End múltiplas vezes
3. Até chegar ao "}" final

Resultado: Função inteira selecionada
```

### Método 3: Encontrar Colchetes (Recomendado)

```
1. Clique depois de "=> {"
2. Pressione Ctrl+Shift+\ (vai para colchete correspondente)
3. Pressione Shift+Home (seleciona até o começo)
4. Depois Shift+End (seleciona até o final)

Resultado: Função inteira selecionada com precisão
```

---

## 📋 PARTE 3: COPIAR E COLAR

### Copiar o Código

```
1. Função já está selecionada (azul)
2. Pressione: Ctrl+C
3. O código está copiado (invisível, mas está lá)
```

### Colar sobre o Código Antigo

```
1. Com a função antiga selecionada
2. Pressione: Ctrl+V
3. O código antigo é substituído pelo novo
4. Salve: Ctrl+S
```

---

## 👁️ EXEMPLO PRÁTICO #1: Corrigir Preço em EventSpaceDetailPage.tsx

### Situação Inicial

Você vê no arquivo:
```typescript
  const getBasePrice = (): number => {
    // 1. Tentar spaceDetails.base_price_per_day (nível superior)
    if ((spaceDetails as any)?.base_price_per_day) {
      const price = parseFloat((spaceDetails as any).base_price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    // ... mais código
    
    return 0;
  };
```

### PASSO 1: Abrir Find

```
┌─────────────────────────────────────────────┐
│ VS Code                                     │
│                                             │
│ Pressione: Ctrl+F                          │
│                                             │
│ ┌────────────────────────────────────────┐ │
│ │ 🔍 getBasePrice = (): number => {      │ │  ← Caixa de busca aparece
│ │ 1/2 Next                               │ │
│ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### PASSO 2: Procurar a Função

```
A caixa de busca procura e destaca:

Linha 101: const getBasePrice = (): number => {
                       ^^^^^^^
                    (destacado em amarelo)
```

### PASSO 3: Clicar no Começo da Função

```
Arquivo:
  98  |
  99  |  const getWeekendSurcharge = (): number => {
 100  |    ...
 101  |  const getBasePrice = (): number => {
         ^
       (clique aqui - antes de "const")
```

### PASSO 4: Selecionar até o Final

```
Opção A - Arrastar:
  101  |  const getBasePrice = (): number => {
         ▲ (clique + arraste)
  102  |    ...
  ...  |    ...
  116  |  };
         ▲ (até aqui)

Resultado: Toda a função fica azul
```

### PASSO 5: Copiar

```
Pressione: Ctrl+C

(Invisível, mas o código está copiado)
```

### PASSO 6: Colar o Código Novo

```
Com a seleção ainda azul:

Pressione: Ctrl+V

Resultado: O código antigo some
           O código novo aparece
```

### Resultado Final

```typescript
  const getBasePrice = (): number => {
    // 0. PRIORIDADE MÁXIMA: price_per_day (campo REAL do backend)
    if ((spaceDetails as any)?.price_per_day) {
      const price = parseFloat((spaceDetails as any).price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    // ... resto do código
    
    return 0;
  };
```

✅ **FEITO!**

---

## 👁️ EXEMPLO PRÁTICO #2: Corrigir Amenities em EventSpaceCard.tsx

### Situação Inicial

Você está no arquivo: `EventSpaceCard.tsx`

Vê a função (por volta da linha 76):
```typescript
  const getAmenities = (): string[] => {
    if (space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0) {
      return space.amenities;
    }
    return [];
  };
```

### PASSO 1-3: Encontrar a Função

```
Ctrl+F → escreva "const getAmenities" → Enter
```

### PASSO 4: Selecionar (Visual)

```
Visualmente no arquivo, você vê:

  76  │ const getAmenities = (): string[] => {
       └─────────────────────────────────────
  77  │   if (space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0) {
  78  │     return space.amenities;
  79  │   }
  80  │   return [];
  81  │ };
       ─────────────────────────────────────┘

(Clique no "c" de "const" na linha 76)
(Arraste até o "}" na linha 81)
```

### PASSO 5-6: Copiar e Colar

```
Ctrl+C → Ctrl+V → Pronto!
```

### Resultado Final

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
    // ... resto com fallbacks
    
    return [];
  };
```

✅ **FEITO!**

---

## 🖱️ PARTE 4: DICAS DE SELEÇÃO

### Dica 1: Usar Shift+Click

```
Situação: Você selecionou até a linha 50

Agora quer estender até linha 60:

Pressione e segure: Shift
Clique na linha 60

Resultado: Seleção estendida até linha 60
```

### Dica 2: Usar Ctrl+Shift+End

```
Situação: Você selecionou a primeira linha

Pressione: Ctrl+Shift+End

Resultado: Seleção até o final do arquivo
(depois você deseleciona o que não precisa)
```

### Dica 3: Usar Ctrl+Shift+L

```
Situação: Você tem uma palavra selecionada

Pressione: Ctrl+Shift+L

Resultado: Seleciona TODAS as ocorrências da palavra
```

---

## ⌨️ PARTE 5: ATALHOS IMPORTANTES

| Atalho | Ação | Uso |
|--------|------|-----|
| Ctrl+F | Abrir Find | Procurar função |
| Ctrl+H | Abrir Replace | Substituir código |
| Escape | Fechar Find/Replace | Voltar ao editor |
| Ctrl+C | Copiar | Cópia de código |
| Ctrl+V | Colar | Cola de código |
| Ctrl+Z | Undo | Desfazer mudança |
| Ctrl+Shift+Z | Redo | Refazer mudança |
| Ctrl+S | Salvar | Salva arquivo |
| Ctrl+Shift+\| | Ir para colchete | Achar colchete correspondente |

---

## 🛠️ PARTE 6: VERIFICAR SE FUNCIONOU

### Depois de Editar e Salvar

```
1. Olhe o círculo branco no nome do arquivo
   ⚪ = sem salvar
   (nada) = salvo
   
2. Abra a aba de Problemas: Ctrl+Shift+M
   - Se houver ❌ vermelho, algo está errado
   - Se não houver, está OK
   
3. Procure por "getBasePrice" para verificar
   - Ctrl+F → getBasePrice
   - Verifique se tem "price_per_day" no topo
```

### Exemplo de Erro (Não Assustar!)

```
Se você vir:
  ❌ Missing closing brace '}'

Significa: Você copiou incompleto

Solução:
  Ctrl+Z (desfaz)
  Tenta novamente com mais cuidado
```

---

## 🎯 CHECKLIST VISUAL

Depois de CADA edição, verifique:

- [ ] Função foi encontrada (Ctrl+F)
- [ ] Função foi selecionada completamente (azul)
- [ ] Código foi colado (Ctrl+V)
- [ ] Arquivo foi salvo (Ctrl+S)
- [ ] Nenhuma mensagem de erro vermelha (Ctrl+Shift+M)
- [ ] Próxima função pronta para editar

---

## 📊 TEMPO ESTIMADO POR FUNÇÃO

| Função | Arquivo | Tempo |
|--------|---------|-------|
| getBasePrice() | EventSpaceDetailPage | 2 min |
| getAmenities() | EventSpaceDetailPage | 3 min |
| getLocation() | EventSpaceDetailPage | 3 min |
| getBasePrice() | EventSpaceCard | 2 min |
| getAmenities() | EventSpaceCard | 2 min |
| getLocation() | EventSpaceCard | 2 min |
| convertToEventSpace() | EventSpacesSearchPage | 2 min |
| **TOTAL** | **3 arquivos** | **~16 min** |

---

## ✨ DICAS PRO

### Dica 1: Usar Find & Replace para Múltiplas Mudanças

```
Pressione: Ctrl+H

Caixa 1 (Find): getBasePrice = (): number => {
Caixa 2 (Replace): [seu novo código]

Clique em Replace ou Replace All
```

### Dica 2: Usar Split Editor para Comparar

```
Clique em um arquivo com Shift pressionado
Arquivo abre em split screen
Veja o código antigo de um lado, novo do outro
```

### Dica 3: Usar Minimap

```
No lado direito, você vê um minimap
Mostra onde você está no arquivo
Ajuda a visualizar a estrutura
```

---

## 🎓 EXERCÍCIO PRÁTICO

Se você é iniciante, faça este exercício primeiro:

1. **Abra EventSpaceDetailPage.tsx**
2. **Pressione Ctrl+F**
3. **Procure: "const getBasePrice"**
4. **Veja a função completa (não edite nada ainda)**
5. **Clique no começo de "const"**
6. **Arraste até o "}" final**
7. **Veja a seleção ficar azul**
8. **Solte o mouse**
9. **Copie: Ctrl+C**
10. **Pressione Escape para desfazer a seleção**
11. **Cole em um bloco de notas: Ctrl+V**
12. **Veja se o código apareceu no bloco de notas**

Se tudo funcionou: **Parabéns! Você sabe como copiar código!** ✅

Agora já pode fazer as edições reais.

---

## 🚀 PRÓXIMO PASSO

Quando tiver confiança:

1. Siga o [GUIA_PASSO_A_PASSO.md](GUIA_PASSO_A_PASSO.md)
2. Use o [CODIGOS_PRONTOS_PARA_COLAR.md](CODIGOS_PRONTOS_PARA_COLAR.md)
3. Edite os 3 arquivos
4. Teste no navegador

**Você consegue! 💪**

