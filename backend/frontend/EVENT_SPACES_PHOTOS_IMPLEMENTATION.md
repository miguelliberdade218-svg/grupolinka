# 📋 Event Spaces Photos - Instruções de Implementação

**Data**: 16/02/2026  
**Status**: Pronto para aplicar

---

## 🔧 PASSO 1: Executar SQL no Banco

### A) Criar Tabela

Execute este comando no seu banco de dados PostgreSQL:

```sql
-- Abra seu cliente SQL (pgAdmin, DBeaver, ou psql)
-- Conecte ao seu banco de dados
-- Execute:

CREATE TABLE IF NOT EXISTS event_space_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_space_id UUID NOT NULL REFERENCES "eventSpaces"(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  "order" INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### B) Criar Índices (Performance)

```sql
CREATE INDEX IF NOT EXISTS idx_event_space_photos_event_space_id 
  ON event_space_photos(event_space_id);

CREATE INDEX IF NOT EXISTS idx_event_space_photos_featured 
  ON event_space_photos(event_space_id, is_featured);

CREATE INDEX IF NOT EXISTS idx_event_space_photos_primary 
  ON event_space_photos(event_space_id, is_primary);
```

### C) Criar Trigger (Atualizar updated_at)

```sql
-- Se ainda não existe (já deve existir para room_type_photos)
CREATE OR REPLACE FUNCTION update_updated_at_column_underscore()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger
CREATE TRIGGER update_event_space_photos_updated_at
BEFORE UPDATE ON event_space_photos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_underscore();
```

### D) Verificar Criação

```sql
-- Teste se foi criada corretamente:
SELECT * FROM event_space_photos LIMIT 1;
-- Resultado: 0 linhas (normal se vazio)

-- Ver estrutura:
\d event_space_photos;
-- Resultado: Mostra todas as colunas
```

---

## 💻 PASSO 2: Ficheiros Criados (Frontend)

Três ficheiros criados para você:

### 1. **eventSpacePhotoService.ts**
```
Localização: src/services/eventSpacePhotoService.ts
Conteúdo: Serviço idêntico ao photoGalleryService
Função: Upload, listagem, atualização, deleção de fotos
```

### 2. **EventSpacePhotoGalleryEditor.tsx**
```
Localização: src/apps/hotels-app/components/EventSpacePhotoGalleryEditor.tsx
Conteúdo: Editor para gestores
Função: Interface drag & drop, setas, featured/principal
```

### 3. **HotelPhotoGallery.tsx**
```
Localização: src/apps/main-app/components/HotelPhotoGallery.tsx
Status: Já existe! Reutilizar como está
Função: Visualização em 4 modos (preview, grid, full, lightbox)
```

---

## 🏨 PASSO 3: Integrar no Hotels App (Gestão Event Spaces)

Localizar arquivo de gerenciamento de event spaces e adicionar:

```typescript
// Seu arquivo de gerenciamento event spaces (ex: EventSpaceManager.tsx ou similar)

import { EventSpacePhotoGalleryEditor } from '@/apps/hotels-app/components/EventSpacePhotoGalleryEditor';

// Dentro do seu componente:

export const EventSpaceManager = () => {
  const [selectedEventSpace, setSelectedEventSpace] = useState<string | null>(null);

  return (
    <div>
      {/* ... seus dados de event space ... */}
      
      {selectedEventSpace && (
        <EventSpacePhotoGalleryEditor
          eventSpaceId={selectedEventSpace}
          onPhotosUpdated={(photos) => {
            console.log('Fotos atualizadas:', photos);
            // Atualizar seu estado se necessário
          }}
        />
      )}
    </div>
  );
};
```

---

## 📱 PASSO 4: Integrar na Main App (Visualização)

### Página de Resultados Event Spaces

```typescript
// src/apps/main-app/pages/EventSpaces/search.tsx (ou similar)

import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';
import { eventSpacePhotoService } from '@/services/eventSpacePhotoService';

export const EventSpacesSearchPage = () => {
  const [eventSpaces, setEventSpaces] = useState<any[]>([]);
  const [photos, setPhotos] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Carregar event spaces
    const loadSpaces = async () => {
      const spaces = await fetchEventSpaces();
      
      // Para cada espaço, carregar fotos
      const photosData: Record<string, any[]> = {};
      for (const space of spaces) {
        photosData[space.id] = await eventSpacePhotoService.getFeaturedPhotos(space.id);
      }
      
      setEventSpaces(spaces);
      setPhotos(photosData);
    };
    
    loadSpaces();
  }, []);

  return (
    <div className="space-y-6">
      {eventSpaces.map((space) => (
        <div key={space.id} className="bg-white rounded-lg border p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Galeria em 2/3 */}
            <div className="lg:col-span-2">
              <HotelPhotoGallery
                photos={photos[space.id] || []}
                mode="preview"
                title={space.name}
                className="w-full rounded-xl overflow-hidden"
              />
            </div>

            {/* Info em 1/3 */}
            <div>
              <h2 className="text-2xl font-bold mb-2">{space.name}</h2>
              <p className="text-gray-600">{space.description}</p>
              {/* ... resto das info ... */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Página de Detalhes Event Space

```typescript
// src/apps/main-app/pages/EventSpaces/details.tsx

import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';
import { eventSpacePhotoService } from '@/services/eventSpacePhotoService';

export const EventSpaceDetailsPage = () => {
  const { eventSpaceId } = useParams<{ eventSpaceId: string }>();
  const [space, setSpace] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const spaceData = await fetchEventSpaceById(eventSpaceId);
      const photosData = await eventSpacePhotoService.getEventSpacePhotos(eventSpaceId);
      
      setSpace(spaceData);
      setPhotos(photosData);
    };
    
    loadData();
  }, [eventSpaceId]);

  if (!space) return <div>Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero com galeria */}
      <div className="mb-8">
        <HotelPhotoGallery
          photos={photos}
          mode="full"
          title={space.name}
          className="w-full"
        />
      </div>

      {/* Detalhes */}
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-3xl font-bold mb-4">{space.name}</h1>
        <p className="text-gray-600 mb-6">{space.description}</p>
        {/* ... resto do conteúdo ... */}
      </div>
    </div>
  );
};
```

---

## 🔌 PASSO 5: Endpoints Backend Necessários

Você precisa implementar estes 8 endpoints (idênticos aos de hotels):

```javascript
// Express.js exemplo:

// Upload
POST   /api/event-spaces/:eventSpaceId/photos
// Listar
GET    /api/event-spaces/:eventSpaceId/photos
// Atualizar
PUT    /api/event-spaces/:eventSpaceId/photos/:photoId
// Deletar
DELETE /api/event-spaces/:eventSpaceId/photos/:photoId
// Reordenar
PUT    /api/event-spaces/:eventSpaceId/photos/reorder
// Agregado (com foto)
GET    /api/event-spaces/:eventSpaceId/with-photos
```

---

## ✅ CHECKLIST de Implementação

### SQL (5 min)
- [ ] Executar CREATE TABLE
- [ ] Executar CREATE INDEX (3x)
- [ ] Executar CREATE TRIGGER
- [ ] Testar com SELECT

### Frontend (10 min)
- [ ] Copiar eventSpacePhotoService.ts
- [ ] Copiar EventSpacePhotoGalleryEditor.tsx
- [ ] HotelPhotoGallery.tsx já existe

### Integração (20 min)
- [ ] Adicionar editor em hotels app
- [ ] Adicionar gallery em main app results
- [ ] Adicionar gallery em main app details
- [ ] Testar no navegador

### Backend (2-3h)
- [ ] Implementar 8 endpoints
- [ ] Testar endpoints
- [ ] Integrar com storage

---

## 🚀 Sequência Recomendada

### Hoje (30 min)
```
1. Executar SQL (5 min)
2. Copiar ficheiros frontend (10 min)
3. Integrar em hotels app (10 min)
4. Testar no navegador (5 min)
```

### Amanhã (2-3h)
```
1. Implementar endpoints backend
2. Testar integração
3. Deploy
```

---

## 💡 Dicas Importantes

### 1. Não quebra Hotels
✅ Sistema event spaces é totalmente isolado
✅ Tabelas separadas
✅ Serviços separados
✅ Componentes reutilizáveis (gallery)

### 2. Reutilizar Componentes
```
HotelPhotoGallery ← Serve para hotéis E event spaces
eventSpacePhotoService ← Idêntico ao photoGalleryService
```

### 3. Endpoints são Simples
```
Copiar lógica dos endpoints de hotels/room-types
Só mudar:
  - /room-types/ → /event-spaces/
  - room_type_photos → event_space_photos
  - room_type_id → event_space_id
```

---

## 🐛 Troubleshooting

### Erro: "event_space_photos" não encontrada
```
Solução: Executar SQL CREATE TABLE
Verificar: SELECT * FROM event_space_photos;
```

### Erro: Foto não aparece em resultados
```
Solução: Marcar como is_featured = true
Verificar: SELECT * FROM event_space_photos WHERE is_featured = true;
```

### Erro: Upload falha
```
Solução: Backend endpoint não implementado ainda
Próximo: Implementar POST /api/event-spaces/:id/photos
```

---

**Status**: ✅ Pronto para aplicar

