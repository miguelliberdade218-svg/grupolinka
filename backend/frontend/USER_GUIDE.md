# 📖 GUIA DE USO - APP DE HOTÉIS MODERNIZADA

## 🎯 Fluxo Principal

### 1️⃣ Login e Seleção de Hotel

```
Login Firebase
    ↓
Dashboard de Hotéis
    ├─ Nenhum hotel → "Criar Hotel" ou "Selecionar Hotel"
    └─ Hotel selecionado → Dashboard completo
```

---

### 2️⃣ Criar Novo Hotel

1. Clique em **"Criar Hotel"** (se nenhum hotel selecionado)
2. Preencha informações:
   - ✅ Nome*
   - ✅ Email*
   - ✅ Endereço*
   - ✅ Localidade*
   - Telefone
   - Horário check-in/check-out
   - Descrição
3. Clique **"✨ Criar Hotel"**
4. Hotel salvo em localStorage como `activeHotelId`
5. Redireciona para Dashboard

---

### 3️⃣ Dashboard Principal

Mostra:
- Estatísticas (reservas, receita, ocupação)
- Ações rápidas (Adicionar Quarto, Espaço, Disponibilidade)
- Abas: Quartos, Espaços, Reviews

---

## 🛏️ GERENCIAR QUARTOS

### ✅ Criar Novo Tipo de Quarto

**Acesso:**
- Dashboard → Aba "Quartos" → Botão "Novo Tipo de Quarto"
- ou Ações Rápidas → "Adicionar Quarto"

**Formulário (3 Etapas):**

#### **Etapa 1: Informações Básicas**
- **Nome*** (mín. 3 caracteres) - ex: "Quarto Deluxe com Vista"
- **Preço Base*** (MZN) - ex: 1500
- **Capacidade** - quantas pessoas máximo
- **Ocupação Base** - ocupação padrão
- **Unidades** - quantas unidades disponíveis
- **Mínimo de Noites** - ex: 1
- **Descrição** - características principais

#### **Etapa 2: Detalhes**
- **Amenidades** - clique nos ícones (WiFi, AC, TV, etc)
- **Preço Extra Adulto** - valor adicional por adulto
- **Preço Extra Criança** - valor adicional por criança
- **Fotos** - clique para upload, adicione múltiplas fotos

#### **Etapa 3: Confirmação**
- Revise todos os dados
- Clique **"✨ Criar Quarto"**
- Toast de sucesso

**Após Criação:**
- Quarto aparece na lista com card profissional
- Pronto para receber reservas

---

### 📋 Listar Quartos

Mostra cards com:
- Imagem (ou ícone padrão)
- Status (Ativo/Inativo)
- Unidades disponíveis
- Nome
- Capacidade
- Preço destacado
- Amenidades (com badge "+X mais")
- Botões: Editar, Disponibilidade, Deletar

**Filtros (em desenvolvimento):**
- Por status
- Por capacidade
- Por preço

---

### ✏️ Editar Quarto

**Passo 1:** Clique botão "Editar" no card
**Passo 2:** Mesmo formulário de criação (em desenvolvimento)
**Passo 3:** Faça alterações
**Passo 4:** Clique "Atualizar Quarto"

---

### 🗑️ Deletar Quarto

**Passo 1:** Clique botão "🗑️" no card
**Passo 2:** Confirme no dialog
**Passo 3:** Quarto é deletado
**Passo 4:** Toast de sucesso

---

### 📅 Gerenciar Disponibilidade

**Passo 1:** Clique botão "Disponibilidade" no card
**Passo 2:** Abre calendário (em desenvolvimento)
**Passo 3:** Bloquear/desbloquear datas
**Passo 4:** Preços dinâmicos (por data)

---

## 🎪 GERENCIAR ESPAÇOS DE EVENTOS

### ✅ Criar Novo Espaço

**Acesso:**
- Dashboard → Aba "Espaços" → Botão "Novo Espaço"
- ou Ações Rápidas → "Adicionar Espaço"

**Formulário (3 Etapas):**

#### **Etapa 1: Informações Básicas**
- **Nome*** - ex: "Salão Principal"
- **Descrição** - características
- **Capacidade Mínima** - ex: 10 pessoas
- **Capacidade Máxima** - ex: 500 pessoas
- **Localização** - ex: "Andar 2, perto da recepção"

#### **Etapa 2: Preços e Amenidades**
- **Preço por Hora** (opcional)
- **Preço por Dia** (opcional)
- **Preço por Evento** (opcional)
- **Amenidades** - separadas por vírgula
- **Fotos** (opcional)

#### **Etapa 3: Confirmação**
- Revise os dados
- Clique **"✨ Criar Espaço"**
- Mensagem: "em desenvolvimento no backend"

---

### 📋 Listar Espaços

**Status Atual:** Coming Soon (profissionalmente apresentado)

Mostra:
- Card com "Gestão de Espaços em Desenvolvimento"
- 4 sub-cards com funcionalidades futuras
- Aviso: dados em desenvolvimento no backend
- Botão "Criar Espaço (Em breve)" desabilitado

**Quando Backend Pronto:**
- Mesma interface profissional dos quartos
- Cards com imagens, capacidade, preços
- Botões: Editar, Reservas, Deletar

---

## 📊 DASHBOARD

### Aba "Resumo"

**Seções:**

1. **Estatísticas Principais**
   - Total Reservas
   - Receita Total
   - Taxa Ocupação
   - Reviews Média

2. **Ações Rápidas**
   - Adicionar Quarto → Vai para aba Quartos
   - Adicionar Espaço → Vai para aba Espaços
   - Gerenciar Disponibilidade → Calendário (em dev)

3. **Gráficos** (em desenvolvimento)
   - Ocupação por mês
   - Receita por tipo de quarto
   - Reviews por nota

---

### Aba "Quartos"

- ✅ **Listar** quartos com cards profissionais
- ✅ **Criar** novos tipos de quarto
- ✅ **Editar** (em desenvolvimento)
- ✅ **Deletar** com confirmação
- ✅ **Disponibilidade** (em desenvolvimento)
- ✅ **Promoções** (em desenvolvimento)

---

### Aba "Espaços"

- 📅 **Listar** espaços (em desenvolvimento no backend)
- 📅 **Criar** novos espaços
- 📅 **Gerenciar** reservas
- 📅 **Reviews** de clientes

---

### Aba "Reviews"

- ⭐ **Ver** avaliações de hóspedes
- ⭐ **Responder** reviews
- ⭐ **Estatísticas** (nota média, tendência)

---

## 🔧 CONFIGURAÇÕES

### Editar Hotel

**Passo 1:** Clique botão "Editar" (header do dashboard)
**Passo 2:** Mesmo formulário de criação
**Passo 3:** Faça alterações
**Passo 4:** Clique "Atualizar Hotel"

---

## 🔐 Autenticação

- ✅ Login com Firebase
- ✅ Token salvo em localStorage (`token`)
- ✅ API injeta Authorization header automaticamente
- ✅ Logout via menu do usuário (em desenvolvimento)

---

## 📱 Responsividade

- ✅ Desktop (1920x1080) - Interface completa
- ✅ Tablet (768x1024) - Layout adaptado
- ✅ Mobile (375x667) - Stack vertical

**Tips:**
- Usar DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
- Testar em navegador real (Android/iPhone)

---

## 🎨 Interface Visual

### Cores Principais
- **Azul:** Quartos (botões, badges, accents)
- **Roxo:** Espaços de eventos
- **Verde:** Status ativo, sucesso
- **Vermelho:** Erros, delete
- **Amarelo:** Destaques, featured

### Componentes
- ✅ Gradientes suaves
- ✅ Hover effects elegantes
- ✅ Animações de transição
- ✅ Backdrop blur em modais
- ✅ Icones Lucide React
- ✅ Badges coloridas
- ✅ Progress bars

---

## 🚨 Validações

### Nome
- ✅ Obrigatório
- ✅ Mínimo 3 caracteres
- ✅ Mensagem de erro clara

### Preço
- ✅ Obrigatório
- ✅ Deve ser > 0
- ✅ Aceita decimais (ex: 1500.50)

### Capacidade
- ✅ Número inteiro positivo
- ✅ Capacidade máx > mín

### Datas
- ✅ Check-out > check-in (em desenvolvimento)

---

## 💡 Dicas

1. **Criar múltiplos tipos de quartos** - Oferça variedade
2. **Adicionar fotos atrativas** - Aumenta conversão
3. **Descrever bem as amenidades** - Clientes informados
4. **Manter preços realistas** - Competitividade
5. **Responder reviews** - Melhora reputação

---

## 🆘 Suporte

### Erros Comuns

**Erro: "String must contain at least 3 character(s)"**
- Seu nome tem menos de 3 caracteres
- Solução: Digite pelo menos 3 caracteres

**Erro: "Dados inválidos"**
- Algum campo está em formato errado
- Solução: Verifique todos os campos obrigatórios (*)

**Erro: "401 Token não fornecido"**
- Sessão expirada
- Solução: Faça login novamente

**Erro: "Espaços de eventos indisponíveis"**
- Backend ainda implementando
- Solução: Use a aba de Quartos por enquanto

---

## 📞 Contato

Para reportar bugs ou sugestões:
- 📧 Email: [seu email]
- 🐙 GitHub: [seu repo]
- 💬 Discord: [seu servidor]

---

**Última Atualização:** 18 de Janeiro de 2026
**Status:** ✅ Pronto para Uso
