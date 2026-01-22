# 🧪 GUIA DE TESTE - MODERNIZAÇÃO DA APP

## 🎯 Casos de Teste

### 1. ✅ Validação de Nome (Mínimo 3 caracteres)

**Passo 1:** Vá para Hotel Manager → Aba "Quartos"
**Passo 2:** Clique em "Novo Tipo de Quarto"
**Passo 3:** Na etapa 1, tente inserir:
- ❌ "A" (1 caractere) → Deve mostrar erro
- ❌ "JJ" (2 caracteres) → Deve mostrar erro
- ✅ "Jjj" (3 caracteres) → Deve permitir prosseguir

**Resultado Esperado:** Erro "String must contain at least 3 character(s)" do backend é capturado no frontend

---

### 2. ✅ Validação de Preço (Obrigatório e > 0)

**Passo 1:** Etapa 1 do formulário de quarto
**Passo 2:** Tente deixar preço vazio → Deve mostrar erro
**Passo 3:** Tente inserir 0 → Deve mostrar erro
**Passo 4:** Tente inserir número negativo → Deve mostrar erro
**Passo 5:** Insira 1500 → Deve permitir

**Resultado Esperado:** Validação clara antes de enviar ao backend

---

### 3. ✅ Formulário Multi-Etapa

**Passo 1:** Abra "Novo Tipo de Quarto"
**Passo 2:** Veja a progress bar (1/3)
**Passo 3:** Preencha Etapa 1:
- Nome: "Quarto Deluxe"
- Preço: 1500
- Outros campos (opcionais)

**Passo 4:** Clique "Próximo →"
**Passo 5:** Veja progress bar (2/3)
**Passo 6:** Selecione amenidades (ícones clicáveis)
**Passo 7:** Upload de imagens (opcional)
**Passo 8:** Clique "Próximo →"
**Passo 9:** Veja progress bar (3/3) com resumo
**Passo 10:** Clique "Voltar" → Volta à etapa anterior
**Passo 11:** Clique "✨ Criar Quarto" para finalizar

**Resultado Esperado:** Todas as etapas funcionam, dados são salvos

---

### 4. ✅ Upload de Imagens

**Passo 1:** Etapa 2 do formulário (Detalhes)
**Passo 2:** Clique em "Clique para fazer upload"
**Passo 3:** Selecione uma imagem do seu PC
**Passo 4:** Veja preview da imagem em grid
**Passo 5:** Clique X para remover
**Passo 6:** Adicione várias imagens (3+)
**Passo 7:** Veja "3 enviada(s)" no resumo (etapa 3)

**Resultado Esperado:** Imagens são mostradas em preview, contador atualizado

---

### 5. ✅ Amenidades com Ícones

**Passo 1:** Etapa 2 do formulário
**Passo 2:** Veja botões de amenidades com ícones:
- 🛜 WiFi
- ❄️ Ar Condicionado
- 📺 TV Flat
- 💇 Secador de Cabelo
- 🔒 Cofre

**Passo 3:** Clique em alguns (devem ficar azuis)
**Passo 4:** Clique novamente (devem desselecionar)
**Passo 5:** Veja no resumo quantas foram selecionadas

**Resultado Esperado:** Seleção visual funciona perfeitamente

---

### 6. ✅ Layout de Quartos (Tipo Booking.com)

**Passo 1:** Após criar um quarto, vá para "Lista"
**Passo 2:** Veja o card do quarto com:
- Imagem no topo (ou ícone padrão)
- ✓ Ativo | 4 uni. (badges)
- Nome do quarto
- 👥 Capacidade
- Descrição (2 linhas)
- Preço destacado com fundo azul
- Amenidades com badges
- 3 botões: Editar, Disponibilidade, Deletar

**Passo 3:** Hover sobre a imagem → Deve dar zoom suave
**Passo 4:** Hover sobre o card → Sombra aumenta

**Resultado Esperado:** Design profissional e responsivo

---

### 7. ✅ Botões de Ações Rápidas

**Passo 1:** Dashboard principal (visão geral)
**Passo 2:** Na seção "Ações Rápidas", clique:
- "Adicionar Quarto" → Deve abrir lista de quartos
- "Adicionar Espaço" → Deve abrir lista de espaços
- "Gerenciar Disponibilidade" → Toast informativo

**Resultado Esperado:** Navegação funciona corretamente

---

### 8. ✅ Espaços de Eventos (Coming Soon)

**Passo 1:** Clique em "Adicionar Espaço"
**Passo 2:** Deve abrir formulário similar ao de quartos
**Passo 3:** Etapa 1: Nome, descrição, capacidade (min/max)
**Passo 4:** Etapa 2: Preços (hora/dia/evento), amenidades
**Passo 5:** Etapa 3: Resumo e aviso de "em desenvolvimento"

**Resultado Esperado:** Formulário funciona (salvo em memória)

---

### 9. ✅ Lista de Espaços (Coming Soon)

**Passo 1:** Vá para "Aba Espaços"
**Passo 2:** Veja card "Gestão de Espaços em Desenvolvimento"
**Passo 3:** 4 sub-cards com funcionalidades futuras:
- 📍 Criar Espaços
- 📅 Calendário
- 💰 Preços
- 👥 Reservas

**Passo 4:** Botão "Criar Espaço (Em breve)" desabilitado

**Resultado Esperado:** UX profissional com expectativas claras

---

### 10. ✅ Confirmação Antes de Deletar

**Passo 1:** Na lista de quartos, clique no botão 🗑️ (Deletar)
**Passo 2:** Veja dialog de confirmação
**Passo 3:** Clique "Cancelar" → Dialog fecha
**Passo 4:** Clique 🗑️ novamente
**Passo 5:** Clique "OK" → Quarto é deletado

**Resultado Esperado:** Prevenção de deleções acidentais

---

## 📊 Checklist de Teste Completo

- [ ] Validação nome (3 caracteres)
- [ ] Validação preço (obrigatório, > 0)
- [ ] Navegação entre etapas
- [ ] Progress bar (1/3 → 2/3 → 3/3)
- [ ] Upload de imagens
- [ ] Preview de imagens
- [ ] Seleção de amenidades
- [ ] Resumo final
- [ ] Card layout responsivo
- [ ] Hover effects funcionando
- [ ] Botões de ações rápidas
- [ ] Dialog de confirmação
- [ ] Coming Soon profissional
- [ ] Sem erros no console
- [ ] Toasts de sucesso/erro

---

## 🐛 Possíveis Problemas e Soluções

### Problema: "Loader2 is not defined"
**Solução:** Verificar imports em lucide-react

### Problema: Imagens não aparecem
**Solução:** Verificar permissões de upload, tamanho máximo

### Problema: Formulário não envia
**Solução:** Abrir DevTools (F12) e ver console para erros

### Problema: Estilo errado
**Solução:** Limpar cache (Ctrl+Shift+Delete) e recarregar (F5)

---

## 🚀 Como Testar em Produção

```bash
# 1. Build do projeto
npm run build

# 2. Preview da build
npm run preview

# 3. Testar em navegador
# Abrir http://localhost:4173
```

---

## 📱 Responsividade

Testar em diferentes tamanhos:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

Usar DevTools → Toggle Device Toolbar (Ctrl+Shift+M)

---

## ✅ Testes Finais Antes de Deploy

1. [ ] Sem erros de compilação TypeScript
2. [ ] Sem warnings no console
3. [ ] Todas as imagens carregam
4. [ ] Todos os ícones mostram
5. [ ] Animações suaves (sem lag)
6. [ ] Validações funcionam
7. [ ] API requests funcionam
8. [ ] Toasts aparecem
9. [ ] Responsividade OK
10. [ ] Acessibilidade básica OK

---

**Status Final:** 🎉 PRONTO PARA TESTE
