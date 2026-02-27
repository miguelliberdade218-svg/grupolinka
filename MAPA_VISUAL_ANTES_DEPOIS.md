╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║              MAPA VISUAL: ANTES vs DEPOIS (TRANSFORMAÇÃO)                      ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════
📊 ARQUITETURA DE AUTENTICAÇÃO
═══════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────┐         ┌─────────────────────────────┐
│      ❌ ANTES (PROBLEMA)     │         │      ✅ DEPOIS (SOLUÇÃO)     │
└─────────────────────────────┘         └─────────────────────────────┘

FRONTEND                                 FRONTEND
┌──────────────┐                        ┌──────────────────────┐
│ signup.tsx   │   ×3 formulários       │                      │
│ drivers-...  │   duplicados           │  SignupFlow.tsx      │
│ hotels-...   │   código repetido      │  (1 componente)      │
└──────────────┘                        └──────────────────────┘
      ↓                                         ↓
      ↓                                         ↓
FIREBASE                                 FIREBASE
┌────────────────────────┐               ┌──────────────────────┐
│ User {                 │               │ User {               │
│   uid: "firebase123"   │ ✔ Token       │   uid: "firebase123" │
│   email: "a@b.com"     │               │   email: "a@b.com"   │
│ }                      │               │ }                    │
└────────────────────────┘               └──────────────────────┘
      ↓                                         ↓
      ❌ PROBLEMA                              ↓
      idas e vindas                    MIDDLEWARE
      sem sincronização                ┌──────────────────────┐
                                       │ syncUserWithDatabase │
BACKEND                                │ firebase123 →        │
┌──────────────────────────┐           │ user_id_db ✔         │
│ Recebe token Firebase    │           └──────────────────────┘
│ uid: "firebase123"       │                  ↓
│                          │                  ↓
│ Procura no DB:           │                  ↓
│ users.firebase_uid?      │          BACKEND
│ ❌ NÃO ENCONTRADO        │          ┌──────────────────────┐
│                          │          │ Firebase UID =       │
│ Fallback:                │          │ "firebase123"        │
│ users.email = email?     │          │                      │
│ ⚠️  Pode falhar!          │          │ Busca no DB:         │
│                          │          │ users.firebase_uid = │
│                          │          │ "firebase123" ✔      │
└──────────────────────────┘          │ ✅ ENCONTRADO!        │
      ↓                                │                      │
      ↓                                │ Retorna capacidades  │
AdminRouteGuard                        │ { isAdmin: true }    │
┌──────────────────────────┐           └──────────────────────┘
│ /api/auth/capabilities   │                  ↓
│ ❌ "Token inválido"      │                  ↓
│ Força relogin!           │          AdminRouteGuard
└──────────────────────────┘          ┌──────────────────────┐
                                      │ /api/auth/capabilities
                                      │ ✅ { isAdmin: true }  │
                                      │ ✅ Funciona!         │
                                      └──────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
🔄 FLUXO DE DADOS
═══════════════════════════════════════════════════════════════════════════════════

❌ ANTES: Firebase UID × Database User ID = Desincronização

    Firebase Auth               PostgreSQL DB
    ┌─────────────┐            ┌──────────────┐
    │ user001     │─┐  ❌      │ firebase_uid │
    │ uid:abc123  │ │  MISMATCH│ (vazio!)     │
    │             │ │          │ user_id:123  │
    └─────────────┘ │          │              │
                    │          └──────────────┘
    Sistema:        └─→ "Qual é o mapeamento?"
    🤔 Precisa de encontrar user por email, depois recalcular tudo


✅ DEPOIS: Firebase UID = Direct Map = Sincronização Automática

    Firebase Auth               PostgreSQL DB (users table)
    ┌─────────────┐            ┌────────────────────┐
    │ user001     │            │ firebase_uid:      │
    │ uid:abc123  │─────✔──────→│   "abc123"         │◀─ Index rápido!
    │             │   SYNC      │ user_id: "456"     │
    └─────────────┘   (auto)    │ can_drive: true    │
                                │ is_admin: true     │
    Middleware:                 └────────────────────┘
    1. Recebe token com uid
    2. Lookup: WHERE firebase_uid = "abc123"
    3. ✅ Encontra instantaneamente
    4. Popula req.user

═══════════════════════════════════════════════════════════════════════════════════
🎯 FLUXO DE SIGNUP (Comparação)
═══════════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────────────┐
│ ❌ ANTES: 3 Formulários Separados (Código Repetido 75%)                      │
└──────────────────────────────────────────────────────────────────────────────┘

CLIENTE SIGNUP                  MOTORISTA SIGNUP              GESTOR HOTEL
┌──────────────┐               ┌──────────────┐              ┌──────────────┐
│ Email/Google │               │ Email/Google │              │ Email/Google │
│ Nome         │               │ Nome         │              │ Nome         │
│ Telefone     │               │ Telefone     │              │ Empresa      │
│              │               │ Carta ID     │              │ NUIT         │
│              │               │ Veículo      │              │ Endereço     │
│              │               │ Experiência  │              │ Telefone     │
│ ✓ CRIAR      │               │ Documentos   │              │ Documentos   │
│ Salva:       │               │              │              │              │
│ can_book=T   │               │ ✓ CRIAR      │              │ ✓ CRIAR      │
│              │               │ Salva:       │              │ Salva:       │
│              │               │ can_drive=P  │              │ can_manage=P │
└──────────────┘               │              │              │              │
  (30 linhas)                  └──────────────┘              └──────────────┘
                                 (140 linhas)                  (150 linhas)
  
  ❌ Código repetido entre 3 componentes
  ❌ Lógica de validação diferente em cada um
  ❌ Erros de sincronização podem ocorrer


┌──────────────────────────────────────────────────────────────────────────────┐
│ ✅ DEPOIS: 1 Componente Wizard (DRY - Don't Repeat Yourself)                │
└──────────────────────────────────────────────────────────────────────────────┘

SIGNUP UNIFICADO - 6 PASSOS
┌────────────────────────────────────────────────────────────────────┐
│ PASSO 1: Escolher Tipo de Usuário                                  │
│ ┌──────────┬──────────┬──────────────────┐                         │
│ │  Cliente │ Motorista│ Gestor de Hotel  │                         │
│ └──────────┴──────────┴──────────────────┘                         │
│                                                                      │
│ PASSO 2: Escolher Método Autenticação                              │
│ ┌──────────┬──────────┐                                            │
│ │  Google  │  Email   │                                            │
│ └──────────┴──────────┘                                            │
│                                                                      │
│ PASSO 3: Dados Básicos (TODOS)                                     │
│ ┌─────────────────────┐                                            │
│ │ Nome Completo       │                                            │
│ │ Email               │                                            │
│ │ Telefone            │                                            │
│ │ [Tipo de Conta]     │◄── Apenas para não-Cliente               │
│ │   ( ) Individual                                                 │
│ │   ( ) Empresa                                                    │
│ └─────────────────────┘                                            │
│                                                                      │
│ PASSO 4: Dados Específicos (Condicional)                           │
│                                                                      │
│ SE Cliente: ✓ Pula para revisão                                    │
│                                                                      │
│ SE Motorista:                        SE Gestor Hotel:              │
│ ┌─────────────────────┐             ┌─────────────────────┐       │
│ │ Carta ID            │             │ Razão Social        │       │
│ │ País Emissão        │             │ NUIT                │       │
│ │ Data Expiração      │             │ Registo Comercial   │       │
│ │ Tipo de Veículo     │             │ Endereço            │       │
│ │ Anos Experiência    │             │ Telefone Empresa    │       │
│ └─────────────────────┘             └─────────────────────┘       │
│                                                                      │
│ PASSO 5: Documentos (Motorista/Hotel apenas)                       │
│ ┌─────────────────────┐                                            │
│ │ Upload Documentos   │                                            │
│ │ • Cópia Carta       │                                            │
│ │ • Foto Veículo      │                                            │
│ │ • Doc. Adicionais   │                                            │
│ └─────────────────────┘                                            │
│                                                                      │
│ PASSO 6: Confirmação                                               │
│ ┌─────────────────────┐                                            │
│ │ ✓ CRIAR CONTA       │                                            │
│ │ ✗ CANCELAR          │                                            │
│ └─────────────────────┘                                            │
│                                                                      │
│ ✓ Salva tudo em 1 transação                                        │
│ ✓ firebase_uid sincronizado automaticamente                        │
│ ✓ Capacidades ativadas corretamente                                │
└────────────────────────────────────────────────────────────────────┘

  ✅ 1 componente = 600 linhas (reutilizável)
  ✅ Validação com Zod em ambas camadas
  ✅ UX profissional com progresso visual
  ✅ Compatível com Google e Email

═══════════════════════════════════════════════════════════════════════════════════
🗄️  BANCO DE DADOS: Antes vs Depois
═══════════════════════════════════════════════════════════════════════════════════

❌ ANTES: users table Monölítica (1 tabela para tudo)

users table (todos os dados misturados)
┌─────┬─────────┬────────────┬──────────┐
│ id  │ email   │ firebase.. │ name     │◄─ 96 colunas!
├─────┼─────────┼────────────┼──────────┤
│ 123 │ a@b.com │ abc123     │ João     │
│ 124 │ c@d.com │ def456     │ Maria    │
└─────┴─────────┴────────────┴──────────┘
        ...muitos mais campos

Problemas:
  ✗ Dados de motorista na mesma tabela que cliente
  ✗ Não pode ter 2 perfis de motorista (1 carro, depois compra outro)
  ✗ Coluna de verificação de motorista para clientes normais (NULL)
  ✗ Schema fica muito grande com o tempo


✅ DEPOIS: Normalização com Tabelas Relacionadas

users (tronco comum)              driver_profiles
┌─────┬─────────┬────────────┐   ┌─────┬────────────┬────────────┐
│ id  │ email   │ firebase_  │───│id   │ user_id    │ license_   │
│     │         │ uid ✨     │   │     │ (FK) ✔     │ number     │
├─────┼─────────┼────────────┤   ├─────┼────────────┼────────────┤
│ 123 │ a@b.com │ abc123     │◄──│m001 │ 123        │ ABC123456  │
│ 124 │ c@d.com │ def456     │   │m002 │ 123        │ DEF234567  │ ◄─ 2 perfis!
└─────┴─────────┴────────────┘   └─────┴────────────┴────────────┘

hotel_manager_profiles          verification_documents
┌─────┬────────────┬──────────┐  ┌─────┬────────────┬────────────┐
│ id  │ user_id    │ business │  │id   │ user_id    │ document_  │
│     │ (FK) ✔     │ _name    │  │     │ (FK) ✔     │ type       │
├─────┼────────────┼──────────┤  ├─────┼────────────┼────────────┤
│ h01 │ 124        │ Hotel XY │  │ d01 │ 123        │ Carta      │
└─────┴────────────┴──────────┘  └─────┴────────────┴────────────┘

capability_changes_log
┌─────┬────────────┬────────────┬─────────┬────────┐
│ id  │ user_id    │ capability │ old_val │ new_val│
│     │ (FK)       │            │         │        │
├─────┼────────────┼────────────┼─────────┼────────┤
│ c01 │ 123        │ can_drive  │ false   │ true   │
│ c02 │ 123        │ can_drive  │ true    │ false  │ ◄─ Auditoria
└─────┴────────────┴────────────┴─────────┴────────┘

Benefícios:
  ✔ Schema mais limpo
  ✔ 1 usuário = múltiplos perfis (um car, depois outro)
  ✔ Dados específicos isolados
  ✔ Auditoria completa
  ✔ Escalável (novos tipos de usuários? Nova tabela!)
  ✔ Índices otimizados (firebase_uid é KEY)

═══════════════════════════════════════════════════════════════════════════════════
🔐 SINCRONIZAÇÃO FIREBASE ↔ DATABASE
═══════════════════════════════════════════════════════════════════════════════════

❌ ANTES (PROBLEMA):

REQUEST (Browser)
  GET /api/auth/capabilities
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn... (Firebase Token)
        ↓
        ↓
MIDDLEWARE (1️⃣ Decoding)
  const decodedToken = await admin.auth().verifyIdToken(token)
  // decodedToken.uid = "firebase:1234567890"
        ↓
        ↓
ROUTE HANDLER (2️⃣ Lookup)
  const user = await db
    .select()
    .from(users)
    .where(eq(users.firebase_uid, decodedToken.uid))
    .first()
  
  // ❌ firebase_uid era vazio!
  // SQL: SELECT * FROM users WHERE firebase_uid = '...'
  // Result: Nada encontrado! (NULL)
        ↓
        ↓
FALLBACK (3️⃣ Procura por email)
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, decodedToken.email))
    .first()
  
  // ⚠️ Pode funcionar, mas é lento (sem index)
  // ⚠️ Pode quebrar com múltiplas contas no mesmo email
        ↓
        ↓
ERROR (4️⃣ Falha)
  ❌ "Token inválido" ou "Usuário não encontrado"
  AdminRouteGuard força relogin


✅ DEPOIS (SOLUÇÃO):

REQUEST (Browser)
  GET /api/auth/capabilities
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn... (Firebase Token)
        ↓
        ↓
MIDDLEWARE - PARTE 1: Verificação
  const decodedToken = await admin.auth().verifyIdToken(token)
  // decodedToken.uid = "firebase:1234567890"
        ↓
        ↓
MIDDLEWARE - PARTE 2: Sincronização ⭐ AUTOMÁTICA
  async function syncUserWithDatabase(firebaseUid) {
    // Já existe?
    let user = await db.select().from(users)
      .where(eq(users.firebase_uid, firebaseUid))
      .first()
    
    if (!user) {
      // Novo usuário? Criar entry
      user = await db.insert(users).values({
        firebase_uid: firebaseUid,
        email: decodedToken.email,
        name: decodedToken.displayName,
        can_book_services: true, // Cliente por default
      }).returning().first()
    }
    
    return user.id
  }
        ↓
        ↓
MIDDLEWARE - PARTE 3: Populate Request
  req.user = { id: user.id, email: user.email, ... }
  req.userCapabilities = {
    canBookServices: user.can_book_services,
    canDrive: user.can_drive,
    ...
  }
  next()
        ↓
        ↓
ROUTE HANDLER (Rápido!)
  // request.user já está populado!
  // Nenhuma query adicional necessária
  return { capabilities: req.userCapabilities }
        ↓
        ↓
SUCCESS ✅
  ✅ { isAdmin: true, canDrive: true, ... }
  AdminRouteGuard permite acesso!

═══════════════════════════════════════════════════════════════════════════════════
📝 TRANSIÇÃO: Passo-a-Passo
═══════════════════════════════════════════════════════════════════════════════════

FASE 1: Preparação (1 hora)
┌────────────────────────────────────────┐
│ 1. Fazer backup do DB                  │
│    pg_dump -U user link_a > backup.sql │
│                                        │
│ 2. Fazer backup de todos os ficheiros  │
│    - firebaseAuth.ts                   │
│    - authService.ts                    │
│    - signup.tsx, drivers-signup.tsx    │
└────────────────────────────────────────┘

FASE 2: Backend (30-40 minutos)
┌────────────────────────────────────────┐
│ 1. Adicionar firebase_uid coluna       │
│    ALTER TABLE users ADD COLUMN ...    │
│                                        │
│ 2. Criar 5 tabelas novas               │
│    driver_profiles, hotel_manager...   │
│                                        │
│ 3. Atualizar firebaseAuth.ts           │
│    Copiar firebaseAuth_MODERNIZADO.ts  │
│                                        │
│ 4. Atualizar authService.ts            │
│    Copiar authService_MODERNIZADO.ts   │
│                                        │
│ 5. Testar endpoints com curl           │
│    POST /api/auth/create-client        │
└────────────────────────────────────────┘

FASE 3: Frontend (20-30 minutos)
┌────────────────────────────────────────┐
│ 1. Adicionar SignupFlow.tsx             │
│    Em: src/shared/components/           │
│                                        │
│ 2. Criar pages/signup-unified.tsx       │
│    Renderizar SignupFlow               │
│                                        │
│ 3. Atualizar routing                   │
│    /signup → signup-unified.tsx        │
│                                        │
│ 4. Testar signup flows:                │
│    - Cliente                           │
│    - Motorista                         │
│    - Hotel Manager                     │
└────────────────────────────────────────┘

FASE 4: Validação (30 minutos)
┌────────────────────────────────────────┐
│ ✓ AdminRouteGuard não força relogin    │
│ ✓ /api/auth/capabilities retorna dados │
│ ✓ Novo usuário tem firebase_uid        │
│ ✓ Capacidades corretas por tipo        │
│ ✓ Documentos podem ser enviados        │
│ ✓ Logs de auditoria funcionam          │
└────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
📊 PERFORMANCE: Comparação
═══════════════════════════════════════════════════════════════════════════════════

OPERAÇÃO          │ ❌ ANTES              │ ✅ DEPOIS
──────────────────┼───────────────────────┼────────────────────────
Lookup Usuário    │ ~50-100ms (sem index) │ ~1-2ms (indexed uuid)
Firebase↔DB Sync  │ Manual + erro-prone   │ Automático + confiável
Múltiplos perfis  │ ❌ Não possível       │ ✅ 1 usuário = N perfis
Auditoria         │ ❌ Sem logs           │ ✅ Completa + timestamps
Código repetido   │ ~350 linhas (×3)      │ ~600 linhas (×1)
Deploy segurança  │ ⚠️  Alto risco        │ ✅ Baixo risco
TypeScript safety │ ⚠️  Parcial           │ ✅ Full type-safe

═══════════════════════════════════════════════════════════════════════════════════
🎯 PRÓXIMOS PASSOS: Timeline
═══════════════════════════════════════════════════════════════════════════════════

SEMANA 1
├─ Seg: Ler documentação (2h)
├─ Ter: Fazer backups (1h)
├─ Ter: Integração backend (2h)
├─ Qua: Testes backend (1h)
├─ Qui: Integração frontend (2h)
├─ Sex: Testes frontend (1h)
└─ Total: ~9 horas

SEMANA 2
├─ Testes de produção (3h)
├─ Code review (2h)
└─ Ajustes finais (2h)

SEMANA 3+
├─ Staging environment
├─ User acceptance testing
└─ Production deploy

═══════════════════════════════════════════════════════════════════════════════════
✨ RESUMO VISUAL
═══════════════════════════════════════════════════════════════════════════════════

ANTES                               DEPOIS
───────────────────────────────────────────────────────────────
❌ Roto, manual, desorganizado      ✅ Moderno, automático, profissional
❌ 3 formulários repetidos          ✅ 1 componente reutilizável
❌ Sem sincronização Firebase       ✅ Sincronização automática
❌ AdminRouteGuard quebra           ✅ AdminRouteGuard funciona
❌ Sem auditoria de mudanças        ✅ Auditoria completa
❌ 1 perfil por usuário             ✅ N perfis por usuário
❌ Dados misturados em 1 tabela     ✅ Schema normalizado
❌ Performance baixa                ✅ Performance otimizada
❌ Difícil manutenção               ✅ Fácil de escalar
❌ Tipo-segurança parcial           ✅ Tipo-segurança total

═══════════════════════════════════════════════════════════════════════════════════

                        🎉 PRONTO PARA MODERNIZAR! 🎉

═══════════════════════════════════════════════════════════════════════════════════
