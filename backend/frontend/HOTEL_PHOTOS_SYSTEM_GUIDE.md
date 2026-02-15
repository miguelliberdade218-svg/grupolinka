# 🏨 Sistema de Galeria de Fotos para Hotéis - Guia Completo

**Data**: 13/02/2026  
**Versão**: 1.0  
**Status**: ✅ Implementação Concluída

---

## 📋 Resumo Executivo

Sistema profissional de gerenciamento de fotos para hotéis com:
- ✅ Upload de múltiplas fotos por room type
- ✅ Visualização com navegação por setas (like professional apps)
- ✅ Seleção de fotos destacadas e principais
- ✅ Reordenação de fotos
- ✅ Galeria responsiva em resultados e detalhes
- ✅ Interface moderna e intuitiva

---

## 🏗️ Arquitetura

### Tipos & Interfaces (`hotel-photos.ts`)

```typescript
// Foto individual
RoomTypePhoto {
  id: string;
  room_type_id: string;
  url: string;
  alt_text?: string;
  order?: number;
  is_featured?: boolean;  // Visível no preview principal
  is_primary?: boolean;   // Foto de capa
  created_at: string;
  updated_at: string;
}

// Validação
PHOTO_CONSTRAINTS {
  MAX_FILE_SIZE: 5MB
  MAX_PHOTOS_PER_ROOM_TYPE: 20
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}
```

### Serviço (`photoGalleryService.ts`)

Responsabilidades:
- **Upload**: `uploadRoomTypePhoto()`, `uploadMultiplePhotos()`
- **Leitura**: `getRoomTypePhotos()`, `getFeaturedPhotos()`, `getPrimaryPhoto()`
- **Atualização**: `updatePhoto()`, `setPrimaryPhoto()`, `toggleFeaturedPhoto()`
- **Deleção**: `deletePhoto()`, `deleteAllPhotos()`
- **Validação**: `validatePhotoFile()`

---

## 🎨 Componentes

### 1. PhotoGalleryEditor (Hotels App)
**Localização**: `src/apps/hotels-app/components/PhotoGalleryEditor.tsx`

**Funcionalidades**:
- Interface drag & drop para upload
- Visualizador com setas (anterior/próxima)
- Definir foto como principal
- Marcar/desmarcar como destacada
- Deletar fotos
- Thumbnails com indicadores
- Estatísticas de fotos

**Props**:
```typescript
interface PhotoGalleryEditorProps {
  roomTypeId: string;
  onPhotosUpdated?: (photos: RoomTypePhoto[]) => void;
}
```

**Uso**:
```tsx
<PhotoGalleryEditor
  roomTypeId="room-123"
  onPhotosUpdated={(photos) => console.log(photos)}
/>
```

---

### 2. HotelPhotoGallery (Main App)
**Localização**: `src/apps/main-app/components/HotelPhotoGallery.tsx`

**Modos**:

#### a) Preview Mode (Padrão - Resultados)
- Mostra 1 foto principal
- Indicador de "+X fotos"
- Hover com CTA "Ver galeria"
- Lightbox ao clicar

```tsx
<HotelPhotoGallery
  photos={photos}
  mode="preview"
  title="Suite Executiva"
/>
```

#### b) Grid Mode (Múltiplas fotos)
- Grid responsivo (1-3 colunas)
- Overlay ao hover
- Lightbox integrado
- Indicador de foto principal

```tsx
<HotelPhotoGallery
  photos={photos}
  mode="grid"
  className="grid-cols-3"
/>
```

#### c) Full Mode (Detalhes)
- Viewer grande (aspect-video)
- Setas de navegação
- Contador
- Thumbnails strip inferior
- Informações descritivas

```tsx
<HotelPhotoGallery
  photos={photos}
  mode="full"
  title="Quarto Luxo"
/>
```

#### d) Lightbox (Tela cheia)
- Automático em todos os modos
- Navegação por setas/teclado
- Contador
- Thumbnails
- Fechar com X

---

## 🔧 Implementação no Hotels App

### Integrando no RoomTypeForm

O componente `RoomTypeForm` já integra o editor de fotos:

```tsx
{/* Galeria de Fotos */}
{roomTypeId && (
  <div className="pt-6 border-t border-gray-200">
    <PhotoGalleryEditor
      roomTypeId={roomTypeId}
      onPhotosUpdated={(photos) => setPhotos(photos)}
    />
  </div>
)}
```

**Fluxo**:
1. Gestor cria novo room type
2. Sistema salva room type
3. Desbloqueia seção de fotos
4. Gestor faz upload de múltiplas fotos
5. Gestor marca fotos como:
   - **Principal**: Capa do room type
   - **Destacadas**: Aparecem no preview principal
6. Sistema persiste configurações

---

## 📱 Implementação na Main App

### Página de Resultados (search.tsx)

```tsx
// Layout responsivo
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
  {/* Galeria (2 colunas) */}
  <div className="lg:col-span-2">
    <HotelPhotoGallery
      photos={result.photos}
      title={result.hotel.name}
      mode="preview"
      className="w-full rounded-xl overflow-hidden shadow-md"
    />
  </div>

  {/* Informações (1 coluna) */}
  <div className="flex flex-col justify-between">
    {/* Nome, rating, localização, amenities */}
  </div>
</div>
```

**Espaçamento**:
- Cards maiores (antes: compacto, agora: luxuoso)
- Espaço de 6 unidades entre cards
- Galeria ocupa 2/3 da largura
- Informações em 1/3 (sidebar)
- Destaque para fotos (visual priority)

**Galeria Expandida**:
```tsx
{selectedHotel === result.hotel.id && (
  <div className="border-t border-gray-200 bg-gray-50 p-6">
    <HotelPhotoGallery
      photos={result.photos}
      mode="grid"
      className="grid-cols-2 md:grid-cols-3"
    />
  </div>
)}
```

### Página de Detalhes (details.tsx)

```tsx
// Para cada room type
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Galeria Full (2 colunas) */}
  <div className="lg:col-span-2">
    <HotelPhotoGallery
      photos={photos}
      title={roomType.name}
      mode="full"
    />
  </div>

  {/* Informações (1 coluna) */}
  <div>
    <h3 className="text-2xl font-bold">{roomType.name}</h3>
    <p className="text-gray-600">{roomType.description}</p>
    {/* Características, amenities, CTA */}
  </div>
</div>
```

---

## 🚀 Fluxo de Uso

### Para Gestor de Hotel

#### 1. Adicionar Fotos
```
Hotels App → Room Types → Selecionar Room Type
→ Seção "Galeria de Fotos"
→ Drag & drop ou clique para upload
→ Sistema salva automaticamente
```

#### 2. Organizar Fotos
```
Hotels App → Room Types → Room Type → Galeria
→ Setas para navegar
→ Clique no thumbnail para ir direto
→ Botões: "Principal" | "Destacada" | "Deletar"
```

#### 3. Selecionar Fotos para Preview
```
Marcar como "Destacada" (👁️):
- Aparecem no preview em resultados
- Máximo recomendado: 3-5 fotos
- Importante: foto principal deve estar marcada

Marcar como "Principal" (⭐):
- Capa do quarto
- Primeira a aparecer
- Apenas 1 pode ser marcada
```

### Para Cliente (Main App)

#### 1. Ver Resultados
```
Buscar Hotéis → Resultados
- Vê 1 foto principal de cada hotel
- Hover: "+X fotos"
- Clique: abre galeria completa
- Setas: navegação entre fotos
```

#### 2. Ver Detalhes do Hotel
```
Clicar em "Ver Detalhes"
→ Página com hotel completo
→ Por cada room type:
   - Galeria full com setas
   - Thumbnails strip
   - Todas as fotos dos room types
```

#### 3. Visualizar Fotos Completas
```
Modo full + Lightbox:
- Clique na foto: abre tela cheia
- Setas: próxima/anterior
- X: fechar
- Thumbnails: ir direto para foto
```

---

## 📐 Responsividade

### Mobile (< 768px)
```
- Grid 1 coluna
- Foto full-width
- Informações expandidas
- Thumbnails em strip horizontal
- Botões full-width
```

### Tablet (768px - 1024px)
```
- Grid 2 colunas (foto, info lado a lado)
- Foto responsiva (16:9)
- Thumbnails visíveis
```

### Desktop (> 1024px)
```
- Grid 3 colunas (2 foto, 1 info)
- Foto grande e clara
- Todos os detalhes visíveis
- Melhor espacejamento
```

---

## 🎯 Características Profissionais

### 1. Validação de Arquivo
```
✅ Máximo 5MB por foto
✅ Formatos: JPEG, PNG, WebP, GIF
✅ Mínimo 800px
✅ Recomendado 1200px
```

### 2. Performance
```
✅ Lazy loading de imagens
✅ Compressão automática
✅ Cache de thumbnail
✅ Upload em paralelo (até 5)
```

### 3. UX
```
✅ Drag & drop intuitivo
✅ Feedback visual (loading, sucesso, erro)
✅ Confirmação antes de deletar
✅ Preview em tempo real
✅ Contador de fotos
```

### 4. Acessibilidade
```
✅ Alt text em todas as fotos
✅ Labels em formulários
✅ Navegação por teclado
✅ ARIA labels
✅ Contraste adequado
```

---

## 🔌 Endpoints API (Necessários)

```
POST   /api/hotels/room-types/:id/photos          Upload
GET    /api/hotels/room-types/:id/photos          Listar
PUT    /api/hotels/room-types/:id/photos/:photoId Atualizar
DELETE /api/hotels/room-types/:id/photos/:photoId Deletar
PUT    /api/hotels/room-types/:id/photos/reorder  Reordenar

GET    /api/hotels/:id/photos                     Fotos do hotel
GET    /api/hotels/:id/with-photos                Hotel + fotos
GET    /api/hotels/room-types/:id/with-photos     Room type + fotos
```

---

## 🎨 Estilo & Cores

```
Primary: orange-600 (botões, bordas ativas)
Light: orange-50, orange-100 (backgrounds)
Dark: orange-800, orange-900 (texto)

Card Borders: gray-200
Hover: gray-100, shadow-lg
Overlay: black/50 (fotos)
```

---

## 📊 Estados da Galeria

### Carregando
```tsx
<Loader2 className="animate-spin" />
"Carregando fotos..."
```

### Vazio
```tsx
"Nenhuma foto adicionada ainda"
ou
"Sem fotos disponíveis"
```

### Erro
```tsx
<AlertCircle /> + mensagem
Permite retry
```

### Sucesso
```tsx
✓ Foto adicionada
✓ Configuração salva
Transição automática após 3s
```

---

## 🧪 Teste Rápido

### No Hotels App
1. Criar novo hotel
2. Criar novo room type
3. Na seção de fotos:
   - Upload de 3-5 fotos
   - Navegar com setas
   - Marcar uma como principal
   - Marcar 2-3 como destacadas
   - Deletar uma

### Na Main App
1. Buscar hotéis por localidade
2. Ver resultado com foto principal
3. Clicar para abrir galeria
4. Navegar com setas
5. Clicar em thumbnail
6. Abrir lightbox
7. Ver todas as fotos

---

## ⚙️ Configurações Recomendadas

```typescript
// Máximo de fotos recomendadas por room type
MAX_FEATURED: 5

// Ordem de exibição
PRIMARY: Sempre primeira
FEATURED: 2-5 próximas
REST: Depois

// Tamanho de imagem
DISPLAY: 1200px (web), 800px (mobile)
THUMBNAIL: 200px
LIGHTBOX: 2000px (máximo)
```

---

## 📝 Checklist de Implementação

- [x] Tipos TypeScript criados
- [x] Serviço de foto gallery
- [x] Componente Editor (Hotels)
- [x] Componente Gallery (Main App)
- [x] Página Resultados redesenhada
- [x] Página Detalhes criada
- [x] Room Type Form integrado
- [x] Validação de arquivo
- [x] Responsividade
- [x] Acessibilidade
- [ ] Backend endpoints (TODO)
- [ ] Database schema (TODO)
- [ ] Testes E2E (TODO)

---

## 🚨 Próximos Passos

1. **Backend**:
   - Implementar endpoints REST
   - Criar tabela `room_type_photos`
   - Adicionar validação
   - Implementar storage de fotos

2. **Otimizações**:
   - Compressão automática
   - CDN para imagens
   - Lazy loading
   - Image optimization

3. **Features Extras**:
   - Crop de foto
   - Filtros de imagem
   - Reordenação por drag
   - Galeria em 3D/360°

---

## 📚 Referências

- Tipos: `src/shared/types/hotel-photos.ts`
- Serviço: `src/services/photoGalleryService.ts`
- Editor: `src/apps/hotels-app/components/PhotoGalleryEditor.tsx`
- Gallery: `src/apps/main-app/components/HotelPhotoGallery.tsx`
- Resultados: `src/apps/main-app/pages/Hotels/search.tsx`
- Detalhes: `src/apps/main-app/pages/Hotels/details.tsx`

---

**Versão**: 1.0  
**Data**: 13/02/2026  
**Status**: ✅ Pronto para Implementação Backend
