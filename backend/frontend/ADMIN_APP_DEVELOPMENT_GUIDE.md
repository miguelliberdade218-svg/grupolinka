# 🔧 GUIA DE DESENVOLVIMENTO - ADMIN APP

## 🎯 Estrutura do Projeto

### Service Layer (`src/services/adminService.ts`)
- Centraliza todas as chamadas à API
- Interceptores automáticos para token e erro
- Função helper para cada endpoint

```typescript
// Usar:
const response = await adminService.approveDriver(userId, reason);
const { data } = response;
```

### State Management (`src/store/adminStore.ts`)
- Zustand store com actions e getters
- Separação clara entre fetch e modify actions
- Auto-clearing de erros/sucessos

```typescript
// Usar:
const { users, loading, error, fetchUsers, approveDriver } = useAdminStore();

// Para fetch:
await fetchUsers(page, limit, filters);

// Para modify:
try {
  await approveDriver(userId, reason);
  await fetchUsers(); // Recarregar dados
} catch (error) {
  // Erro já está em toast via hook
}
```

### Layout System
- Sidebar com navegação automática
- Menu mobile responsivo
- Overlay mobile para fechar menu

---

## 📝 ADICIONANDO NOVAS PÁGINAS

### 1. Criar ficheiro de página
```typescript
// src/apps/admin-app/pages/new-feature.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';

export default function NewFeaturePage() {
  const { loading, error, success, clearError, clearSuccess } = useAdminStore();

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  return (
    <div className="space-y-6">
      {/* Conteúdo */}
    </div>
  );
}
```

### 2. Adicionar stores actions (se necessário)
```typescript
// Adicionar em src/store/adminStore.ts
const useAdminStore = create<AdminStore>((set) => ({
  // ...existing code...
  
  // Nova ação
  fetchMyData: async (page: number) => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.getMyData(page);
      set({ myData: response.data.data, loading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },
}));
```

### 3. Adicionar serviço de API
```typescript
// Adicionar em src/services/adminService.ts
export const adminService = {
  // ...existing services...
  
  getMyData: (page = 1) => 
    adminAPI.get('/my-endpoint', { params: { page } }),
};
```

### 4. Adicionar rota
```typescript
// Adicionar em src/apps/admin-app/App.tsx
import NewFeaturePage from './pages/new-feature';

export default function AdminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout>
        <Switch>
          {/* ...existing routes... */}
          <Route path="/admin/new-feature" component={NewFeaturePage} />
        </Switch>
      </AdminLayout>
    </QueryClientProvider>
  );
}
```

### 5. Adicionar ao menu
```typescript
// Atualizar em src/apps/admin-app/pages/layout.tsx
const menuItems = [
  // ...existing items...
  { path: '/admin/new-feature', label: '🆕 Nova Feature' },
];
```

---

## 🎨 COMPONENTES REUTILIZÁVEIS

### Card
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
</Card>
```

### Button
```typescript
import { Button } from '@/shared/components/ui/button';

<Button onClick={handleClick} variant="outline" size="sm" disabled={loading}>
  Clique-me
</Button>

// Variantes: default, outline, destructive, ghost
// Sizes: default, sm, lg
```

### Badge
```typescript
import { Badge } from '@/shared/components/ui/badge';

<Badge className="bg-blue-100 text-blue-800">Ativo</Badge>
<Badge variant="outline">Info</Badge>
```

### Input
```typescript
import { Input } from '@/shared/components/ui/input';

<Input
  type="text"
  placeholder="Insira algo..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Loader
```typescript
import { Loader } from 'lucide-react';

<Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
```

---

## 📱 RESPONSIVIDADE

### Classes Tailwind
```html
<!-- Mobile first -->
<div className="p-4 md:p-6 lg:p-8">
  <!-- 4px padding mobile, 6px tablet, 8px desktop -->
</div>

<!-- Grid responsivo -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- 1 coluna mobile, 2 tablet, 4 desktop -->
</div>

<!-- Display condicional -->
<div className="hidden md:block">
  <!-- Mostra só em tablet e acima -->
</div>

<div className="md:hidden">
  <!-- Mostra só em mobile -->
</div>
```

---

## ✅ PADRÕES DE CÓDIGO

### Fetch com Tratamento de Erro
```typescript
const [page, setPage] = useState(1);

const loadData = async () => {
  try {
    await fetchUsers(page, 20, filters);
  } catch (error: any) {
    toast.error(error.message || 'Erro ao carregar');
  }
};

useEffect(() => {
  loadData();
}, []);
```

### Modal com Formulário
```typescript
const [selectedItem, setSelectedItem] = useState<any>(null);
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  try {
    await updateItem();
    toast.success('Atualizado com sucesso');
    setSelectedItem(null);
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};

return (
  <>
    {selectedItem && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* campos */}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )}
  </>
);
```

### Tabela com Paginação
```typescript
const [page, setPage] = useState(1);

const handleNextPage = () => {
  if (page < pagination.totalPages) {
    setPage(page + 1);
    loadData();
  }
};

return (
  <>
    {/* Tabela */}
    
    {/* Paginação */}
    {pagination && pagination.totalPages > 1 && (
      <div className="flex justify-center gap-2">
        <Button
          onClick={() => { setPage(Math.max(1, page - 1)); loadData(); }}
          disabled={page === 1}
          variant="outline"
        >
          Anterior
        </Button>
        <span className="flex items-center px-4">
          Página {page} de {pagination.totalPages}
        </span>
        <Button
          onClick={handleNextPage}
          disabled={page === pagination.totalPages}
          variant="outline"
        >
          Próximo
        </Button>
      </div>
    )}
  </>
);
```

---

## 🔄 ATUALIZAÇÃO DE DADOS

### Padrão: Fetch → Modify → Refresh

```typescript
// 1. Fetch inicial
useEffect(() => {
  loadData();
}, []);

// 2. Ação de modificação
const handleApprove = async (userId: string) => {
  try {
    await approveDriver(userId); // Store action
    toast.success('Aprovado!');
    // 3. Refresca os dados
    await loadData();
  } catch (error) {
    toast.error(error.message);
  }
};
```

### Com Otimistic UI (Avançado)

```typescript
// Remove item da lista imediatamente
const removeFromList = (id: string) => {
  setUsers(users.filter(u => u.id !== id));
};

// Depois tenta fazer a ação
const handleDelete = async (id: string) => {
  removeFromList(id); // Otimistic
  try {
    await deleteUser(id);
    toast.success('Deletado!');
  } catch (error) {
    toast.error('Erro ao deletar');
    loadData(); // Recarrega se falhar
  }
};
```

---

## 🎯 BOAS PRÁTICAS

### ✅ DO's
- ✅ Sempre adicionar error handling
- ✅ Usar toast notifications para feedback
- ✅ Validar inputs antes de enviar
- ✅ Desabilitar buttons enquanto carregando
- ✅ Limpar state ao fechar modais
- ✅ Usar types/interfaces TypeScript
- ✅ Agrupar funcionalidades em componentes
- ✅ Manter serviços separados de components

### ❌ DON'Ts
- ❌ Não fazer fetch direto em components (usar store)
- ❌ Não colocar lógica complexa em JSX
- ❌ Não esquecer loading states
- ❌ Não deixar inputs sem validação
- ❌ Não fazer múltiplas requisições desnecessárias
- ❌ Não misturar estilos inline com classes

---

## 🐛 DEBUGGING

### Console Logging
```typescript
// Para ver estado do store
console.log('Store:', useAdminStore.getState());

// Para monitorar mudanças
useAdminStore.subscribe(
  (state) => state.users,
  (users) => console.log('Users updated:', users)
);
```

### Network Inspection
```
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Filtrar por "XHR"
4. Ver requisições e respostas
```

### Store Debugging
```typescript
// Adicionar em useAdminStore para debug
useAdminStore.subscribe((state) => {
  console.log('Store state:', {
    loading: state.loading,
    error: state.error,
    usersCount: state.users.length,
  });
});
```

---

## ⚡ PERFORMANCE

### Code Splitting
- Cada página já é separada (dinâmica)
- Store é shared globalmente

### Memoization
```typescript
import { useMemo, useCallback } from 'react';

// Memoizar cálculos pesados
const filteredUsers = useMemo(() => 
  users.filter(u => u.status === status),
  [users, status]
);

// Memoizar callbacks
const handleClick = useCallback(() => {
  loadData();
}, []);
```

### Lazy Loading
```typescript
// Páginas são automaticamente lazy-loaded pelo Wouter
// Já está implementado na estrutura
```

---

## 📚 RECURSOS ÚTEIS

### Documentação
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Wouter Docs](https://www.npmjs.com/package/wouter)
- [React Toastify Docs](https://fkhadra.github.io/react-toastify/introduction)
- [Lucide Icons](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)

### Ferramentas
- React DevTools - Debugging de componentes
- Redux DevTools - Monitorar store
- Chrome Network Tab - Debugging de requisições
- VS Code TypeScript - Intellisense

---

## 🚀 DEPLOYMENT

### Build
```bash
npm run build
# Gera otimizado em dist/
```

### Preview
```bash
npm run preview
# Testa build localmente
```

### Variáveis de Produção
```env
# .env.production
REACT_APP_API_URL=https://api.linka.com/api
```

---

## 📞 PERGUNTAS FREQUENTES

**P: Como adicionar um novo dropdown/select?**
A: Criar `<select>` nativo ou usar componente Radix. Ver exemplo em filters.

**P: Como validar um email?**
A: Usar biblioteca `zod` ou regex simples: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**P: Como fazer upload de ficheiro?**
A: Usar `@uppy` que já está instalado, ou fazer POST multipart/form-data.

**P: Como implementar dark mode?**
A: Já há suporte com `next-themes`, basta adicionar contexto.

---

**Boa sorte no desenvolvimento! 🚀**
