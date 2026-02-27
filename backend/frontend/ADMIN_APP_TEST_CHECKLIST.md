# ✅ CHECKLIST DE TESTES - ADMIN APP

## 🧪 TESTES ANTES DE DEPLOY

### 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

- [ ] Fazer login como user não-admin redireciona para `/login`
- [ ] Fazer login como admin redireciona para `/admin/dashboard`
- [ ] Token Firebase armazenado em localStorage
- [ ] Flag `isAdmin` correto no localStorage
- [ ] Logout remove token e redireciona para `/login`
- [ ] Token expirado redireciona automaticamente para `/login`
- [ ] Acessar `/admin/*` sem token redireciona para `/login`

---

### 📊 DASHBOARD

- [ ] Dashboard carrega sem erros
- [ ] Stats aparecem com valores numéricos
- [ ] Botão "Atualizar" funciona e refresca dados
- [ ] Spinner aparece enquanto carrega
- [ ] Quick action cards navegam para páginas corretas
- [ ] Todos os ícones aparecem corretamente
- [ ] Texto em português está correto

---

### 👥 GESTÃO DE USUÁRIOS

- [ ] Lista de usuários carrega
- [ ] Paginação funciona (próximo/anterior)
- [ ] Filtro por tipo funciona (motorista, hotel, admin, cliente)
- [ ] Filtro por status funciona
- [ ] Busca por nome funciona
- [ ] Busca por email funciona
- [ ] Combinar múltiplos filtros funciona
- [ ] Tabela exibe todos os campos corretamente
- [ ] Badges de tipo mostram ícones corretos
- [ ] Badges de status mostram cores corretas
- [ ] Datas formatadas em português

---

### ✅ FILA DE VERIFICAÇÕES

- [ ] Fila carrega e mostra motoristas pendentes
- [ ] Fila carrega e mostra gestores de hotel pendentes
- [ ] Filtro "Todos" mostra ambos
- [ ] Filtro "Motoristas" mostra só motoristas
- [ ] Filtro "Gestores de Hotel" mostra só gestores
- [ ] Clicar "Aprovar" abre modal
- [ ] Modal de aprovação pede observações (opcionais)
- [ ] Clicar "Rejeitar" abre modal
- [ ] Modal de rejeição pede motivo (obrigatório)
- [ ] Não deixa rejeitar sem motivo
- [ ] Confirmação remove item da fila
- [ ] Toast de sucesso aparece
- [ ] Cancelar fecha modal sem perda de dados

---

### 🏨 GESTÃO DE HOTÉIS

- [ ] Lista de hotéis carrega
- [ ] Avaliações mostram com estrelas
- [ ] Número de reviews exibe corretamente
- [ ] Status ativo/inativo mostra cor correta
- [ ] Filtro por status funciona
- [ ] Busca por nome funciona
- [ ] Busca por endereço funciona
- [ ] Botão "Suspender" funciona para ativos
- [ ] Botão "Ativar" funciona para inativos
- [ ] Após ação, lista refresca automaticamente
- [ ] Datas formatadas em português

---

### ⚠️ GESTÃO DE RECLAMAÇÕES

- [ ] Reclamações carregam
- [ ] Filtro por status funciona
- [ ] Filtro por prioridade funciona
- [ ] Cores de prioridade corretas (urgente=vermelho, alta=laranja, etc)
- [ ] Clicar "Visualizar" abre modal
- [ ] Modal mostra detalhes completos
- [ ] Pode mudar para "Investigando"
- [ ] Pode mudar para "Resolvido" (com resolução opcional)
- [ ] Pode mudar para "Descartado"
- [ ] Resolução obrigatória quando finaliza
- [ ] Tab de status atualiza após ação
- [ ] Paginação funciona

---

### 💳 GESTÃO DE PAGAMENTOS

- [ ] Lista de pagamentos carrega
- [ ] Filtro por status funciona
- [ ] Filtro por tipo de booking funciona
- [ ] Montantes formatados com moeda
- [ ] Referência truncada corretamente
- [ ] Pagamentos pendentes mostram botão "Confirmar"
- [ ] Pagamentos pagos mostram botão "Visualizar"
- [ ] Clicar "Confirmar" abre modal
- [ ] Modal mostra cálculo de taxa
- [ ] Permite adicionar notas
- [ ] Confirma pagamento com sucesso
- [ ] Datas em português

---

### 💰 GESTÃO DE TAXAS

- [ ] Taxas carregam por serviço
- [ ] Mostra taxa atual em grande
- [ ] Data de ativação exibida
- [ ] Clicar "Editar Taxa" abre modal
- [ ] Modal mostra taxa atual
- [ ] Valida percentagem (0-100)
- [ ] Permite adicionar motivo
- [ ] Alerta sobre impacto da mudança
- [ ] Atualização com sucesso
- [ ] Refresca após atualização

---

### 📋 LOG DE AUDITORIA

- [ ] Logs carregam
- [ ] Timeline mostra todas as ações admin
- [ ] Ícones de ação aparecem
- [ ] Cores de ação aparecem
- [ ] Metadados mostram corretamente
- [ ] Datas e horas em português
- [ ] Filtro por admin funciona
- [ ] Paginação funciona
- [ ] Pode scroll vertical em timeline longa

---

### 🎨 UI/UX

#### Layout
- [ ] Sidebar aparece em desktop
- [ ] Sidebar colapsável em mobile
- [ ] Menu mobile toca/clica para abrir
- [ ] Menu mobile fecha ao selecionar items
- [ ] Overlay mobile escurece quando menu aberto
- [ ] Header exibe correctamente em todos os tamanhos
- [ ] Logo/título alinhado corretamente

#### Responsividade
- [ ] Desktop: layout em 1920px, 1440px, 1024px
- [ ] Tablet: layout em 768px, 834px
- [ ] Mobile: layout em 375px, 390px, 428px
- [ ] Tabelas scrollam horizontalmente em mobile
- [ ] Modais redimensionam mantendo conteúdo legível
- [ ] Botões acessíveis e clicáveis em touch

#### Feedback
- [ ] Toast de sucesso aparece e desaparece
- [ ] Toast de erro mostra mensagem
- [ ] Loading spinner aparece enquanto carrega
- [ ] Buttons desabilitam enquanto carregam
- [ ] Confirmações em modais são claras

---

### 🔍 DADOS E VALIDAÇÕES

- [ ] Não deixa submeter formulário vazio
- [ ] Valida percentagens como números
- [ ] Valida emails se necessário
- [ ] Valida datas se necessário
- [ ] Mostra erro claro em validação falha
- [ ] Não deixa confirmar ações sem dados requeridos

---

### 🌐 INTEGRAÇÃO COM BACKEND

- [ ] Conexão a localhost:8000 funciona
- [ ] CORS configurado corretamente
- [ ] Token no header Authorization funciona
- [ ] Erros 401 redirecionam para login
- [ ] Erros 403 mostram "Acesso negado"
- [ ] Erros 500 mostram mensagem amigável
- [ ] Timeouts tratados graciosamente

---

### ⚡ PERFORMANCE

- [ ] Página dashboard carrega em <2s
- [ ] Listagens carregam em <3s
- [ ] Paginação muda página rapidamente
- [ ] Não há memory leaks (F12 → Memory)
- [ ] Console não mostra warning ou errors
- [ ] Animações suaves (60fps)
- [ ] Scrolling suave em listas longas

---

### 🔐 SEGURANÇA

- [ ] Não mostra IDs completos de transações
- [ ] Montantes não mostrados sem autorização
- [ ] Logs de auditoria registram todas ações
- [ ] Sem dados sensíveis em URLs
- [ ] Sem dados sensíveis em localStorage (excepto token)
- [ ] XSS não possível em inputs
- [ ] CSRF token incluído se necessário

---

### 🌍 INTERNACIONALIZAÇÃO

- [ ] Todos os textos em português
- [ ] Datas em formato pt-PT (DD/MM/YYYY)
- [ ] Horas em formato 24h
- [ ] Montantes usam , como decimal
- [ ] Números formatados com . para milhares (R$ 1.000,00)

---

### ♿ ACESSIBILIDADE

- [ ] Todos inputs têm labels
- [ ] Labels associados corretamente
- [ ] Keyboard navigation funciona (Tab)
- [ ] Focus states visíveis
- [ ] Cores com suficiente contraste
- [ ] Alt text em imagens/ícones importantes
- [ ] Mensagens de erro claras

---

## 🧬 TESTES DE FUNCIONALIDADES ESPECÍFICAS

### Aprovação de Motorista
```
1. Ir a /admin/capabilities
2. Clicar "Aprovar" para motorista
3. Preencher observações (opcional)
4. Clicar "Confirmar Aprovação"
5. Ver toast de sucesso
6. Verificar que motorista desaparece da lista
7. Verificar em backend que driverVerificationStatus='verified'
```

### Histórico de Ações
```
1. Fazer várias ações admin (aprovar, rejeitar, atualizar taxa)
2. Ir a /admin/audit
3. Verificar que todas ações aparecem em timeline
4. Verificar metadados estão corretos
5. Filtrar por admin específico
6. Verificar que filtra corretamente
```

### Paginação
```
1. Ir a página com lista grande (ex: /admin/users)
2. Clicar "Próximo"
3. Verificar que página muda
4. Clicar "Anterior"
5. Verificar que volta
6. Ir para última página
7. Verificar que "Próximo" desabilita
```

### Filtros Combinados
```
1. Filtrar usuários por: tipo=motorista, status=pending, search="João"
2. Verificar que resultados combinam todos filtros
3. Limpar um filtro
4. Verificar que resultados se atualizam
```

---

## 📋 CHECKLIST FINAL ANTES DE DEPLOY

- [ ] Nenhum console.log de debug deixado
- [ ] Nenhum console.error ou warning
- [ ] Todos os links navegam corretamente
- [ ] Todas as imagens/ícones carregam
- [ ] Todos os componentes estão tipados (TypeScript)
- [ ] Sem any types desnecessários
- [ ] Código formatado com prettier
- [ ] Sem dead code ou imports inutilizados
- [ ] Variáveis de ambiente configuradas
- [ ] .env não commitado
- [ ] Build sem erros (npm run build)
- [ ] Preview do build funciona (npm run preview)
- [ ] Tested em pelo menos: Chrome, Firefox, Safari
- [ ] Tested em desktop, tablet, mobile

---

## 🐛 BUGS CONHECIDOS (Se algum)

- [ ] (Nenhum conhecido no momento)

---

## 📝 NOTAS

- Adicione aqui qualquer observação durante testes
- Documente qualquer comportamento inesperado
- Registre performance issues se encontrar

---

**Teste completo esperado: ~2-3 horas**
**Última atualização: 24 de Fevereiro de 2026**
