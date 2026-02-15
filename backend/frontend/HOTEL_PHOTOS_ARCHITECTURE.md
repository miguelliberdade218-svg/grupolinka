# 🏨 Arquitetura de Fotos - Diagrama Visual

## 🌐 Fluxo Completo Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HOTEL PHOTOS SYSTEM                          │
│                    Versão: 13/02/2026                               │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ HOTELS APP - Gerenciador de Fotos (Backend)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HOTEL MANAGER DASHBOARD                                            │
│  ├─ Room Types Management                                           │
│  │  ├─ Room Type 1 (Suite Executiva)                               │
│  │  │  └─ [PhotoGalleryEditor.tsx] 🖼️                              │
│  │  │     ├─ Drag & Drop Upload                                    │
│  │  │     ├─ Viewer com Setas ◀ ▶                                 │
│  │  │     ├─ [⭐ Principal] [👁️ Destacada] [🗑️ Deletar]          │
│  │  │     ├─ Thumbnails Strip                                      │
│  │  │     └─ Estatísticas (Total, Destacadas, Principal)           │
│  │  │                                                               │
│  │  ├─ Room Type 2 (Quarto Executivo)                              │
│  │  │  └─ [PhotoGalleryEditor.tsx] 🖼️                              │
│  │  │     └─ Mesma estrutura...                                    │
│  │  │                                                               │
│  │  └─ Room Type N                                                  │
│  │                                                                  │
│  └─ RoomTypeForm.tsx                                                │
│     ├─ Informações básicas                                          │
│     ├─ Preços e amenities                                           │
│     └─ [Galeria de Fotos] ← PhotoGalleryEditor integrado           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ API Calls
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ SERVICES LAYER                                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  photoGalleryService.ts                                             │
│  ├─ uploadRoomTypePhoto(request)                                   │
│  ├─ uploadMultiplePhotos(files)                                    │
│  ├─ getRoomTypePhotos(roomTypeId)                                  │
│  ├─ getFeaturedPhotos(roomTypeId)                                  │
│  ├─ getPrimaryPhoto(roomTypeId)                                    │
│  ├─ updatePhoto(roomTypeId, photoId, updates)                      │
│  ├─ setPrimaryPhoto(roomTypeId, photoId)                           │
│  ├─ toggleFeaturedPhoto(roomTypeId, photoId)                       │
│  ├─ deletePhoto(roomTypeId, photoId)                               │
│  ├─ reorderPhotos(roomTypeId, photos)                              │
│  └─ validatePhotoFile(file)                                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP Requests
                                  │ (FormData com multipart)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ BACKEND REST API (Node.js/Express)                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  POST   /api/hotels/room-types/:id/photos                           │
│         ├─ Upload single/multiple                                   │
│         ├─ Validação (size, format)                                 │
│         ├─ Compressão de imagem                                     │
│         ├─ Storage em S3/Local                                      │
│         └─ Salva em DB: room_type_photos                            │
│                                                                      │
│  GET    /api/hotels/room-types/:id/photos                           │
│         ├─ Listar fotos do room type                                │
│         ├─ Ordena por: order, is_primary DESC                       │
│         └─ Retorna: array de RoomTypePhoto                          │
│                                                                      │
│  GET    /api/hotels/:id/photos                                      │
│         ├─ Agrega fotos de todos room types                         │
│         ├─ Filtra por: is_featured = true                           │
│         └─ Retorna array ordenado                                   │
│                                                                      │
│  PUT    /api/hotels/room-types/:id/photos/:photoId                  │
│         ├─ Atualizar meta-dados                                     │
│         ├─ Suporta: is_featured, is_primary, alt_text, order        │
│         └─ Retorna: RoomTypePhoto atualizado                        │
│                                                                      │
│  DELETE /api/hotels/room-types/:id/photos/:photoId                  │
│         ├─ Delete da DB                                             │
│         ├─ Remove arquivo do storage                                │
│         └─ Retorna: sucesso/erro                                    │
│                                                                      │
│  PUT    /api/hotels/room-types/:id/photos/reorder                   │
│         ├─ Reordena múltiplas fotos                                 │
│         ├─ Atualiza campo 'order'                                   │
│         └─ Retorna: fotos reordenadas                               │
│                                                                      │
│  GET    /api/hotels/:id/with-photos                                 │
│         ├─ Hotel + suas fotos (featured)                            │
│         └─ Para resultados search                                   │
│                                                                      │
│  GET    /api/hotels/room-types/:id/with-photos                      │
│         ├─ Room type + todas suas fotos                             │
│         └─ Para página de detalhes                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ SQL Queries
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ DATABASE SCHEMA                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Table: room_type_photos                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id               │ UUID PRIMARY KEY                          │   │
│  │ room_type_id     │ UUID FOREIGN KEY → room_types(id)         │   │
│  │ url              │ VARCHAR(500) NOT NULL                      │   │
│  │ alt_text         │ VARCHAR(255) DEFAULT NULL                  │   │
│  │ order            │ INTEGER DEFAULT 0                          │   │
│  │ is_featured      │ BOOLEAN DEFAULT FALSE                      │   │
│  │ is_primary       │ BOOLEAN DEFAULT FALSE (UNIQUE per RT)      │   │
│  │ created_at       │ TIMESTAMP DEFAULT CURRENT_TIMESTAMP        │   │
│  │ updated_at       │ TIMESTAMP ON UPDATE CURRENT_TIMESTAMP      │   │
│  │ deleted_at       │ TIMESTAMP DEFAULT NULL (soft delete)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Índices:                                                           │
│  - INDEX (room_type_id, is_featured)                                │
│  - INDEX (room_type_id, is_primary)                                 │
│  - INDEX (room_type_id, order)                                      │
│                                                                      │
│  Constraints:                                                       │
│  - Máx 20 fotos por room_type                                       │
│  - Uma foto primary por room_type                                   │
│  - URL única por room_type                                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📱 MAIN APP - Visualização (Frontend)

```
┌──────────────────────────────────────────────────────────────────────┐
│ MAIN APP - Resultados de Busca Hotels                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Hotels Search Page                                                 │
│  ├─ Query: /search?locality=Rio de Janeiro                         │
│  └─ Component: HotelsSearchPage.tsx                                 │
│     │                                                               │
│     ├─ Carrega: hotelService.getHotelsByLocality()                │
│     │           photoGalleryService.getHotelFeaturedPhotos()       │
│     │                                                               │
│     └─ Renderiza: Lista de Cards                                   │
│        │                                                            │
│        ├─ Card Hotel #1 (3 colunas layout)                         │
│        │  ├─ Col 1-2 (Galeria - 2/3 width)                       │
│        │  │  └─ [HotelPhotoGallery mode="preview"]                │
│        │  │     ├─ Mostra: 1 foto principal                       │
│        │  │     ├─ Badge: "+5 fotos"                               │
│        │  │     ├─ Hover: "Ver galeria" CTA                        │
│        │  │     └─ Click: Abre Lightbox                            │
│        │  │        └─ Setas ◀ ▶ + Thumbnails                     │
│        │  │                                                        │
│        │  └─ Col 3 (Informações - 1/3 width)                     │
│        │     ├─ Nome do Hotel                                      │
│        │     ├─ ⭐ 4.5 (120 avaliações)                           │
│        │     ├─ 📍 Endereço + Localidade                          │
│        │     ├─ 🛏️ Quartos / 💰 Preço                             │
│        │     ├─ Amenities (preview)                                │
│        │     ├─ Descrição (truncada 3 linhas)                     │
│        │     └─ [Ver Detalhes] [Comparar]                         │
│        │                                                            │
│        ├─ Card Hotel #2                                            │
│        │  └─ Mesma estrutura...                                   │
│        │                                                            │
│        ├─ Card Hotel #N                                            │
│        │                                                            │
│        └─ Seção Expandida (ao clicar "Ver Detalhes")              │
│           └─ [HotelPhotoGallery mode="grid" cols=3]               │
│              ├─ Grid 3 colunas                                     │
│              ├─ Overlay ao hover                                   │
│              └─ Click → Abre lightbox individual                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🏨 Página de Detalhes Hotel

```
┌──────────────────────────────────────────────────────────────────────┐
│ MAIN APP - Hotel Details Page                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HotelDetailsPage.tsx                                               │
│  ├─ Params: hotelId                                                │
│  └─ Carrega:                                                        │
│     ├─ hotelService.getHotelById(hotelId)                          │
│     ├─ roomTypeService.getRoomTypesByHotel(hotelId)                │
│     └─ photoGalleryService.getRoomTypePhotos(cada RT)              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ HERO SECTION                                               │   │
│  │ ├─ Hotel Name                                              │   │
│  │ ├─ ⭐ 4.8 (450 avaliações)                                 │   │
│  │ ├─ 📍 Endereço completo                                    │   │
│  │ ├─ Foto principal do hotel                                 │   │
│  │ ├─ ☎️ Contato | 📧 Email                                   │   │
│  │ ├─ 🕐 Check-in/out                                         │   │
│  │ └─ Descrição + Amenities                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ ROOM TYPES SECTION (Loop por cada tipo)                   │   │
│  │                                                             │   │
│  │  Room Type Card 1: "Suite Executiva"                       │   │
│  │  ├─ Col 1-2: [HotelPhotoGallery mode="full"]              │   │
│  │  │  ├─ Viewer grande (aspect-video)                        │   │
│  │  │  ├─ Setas: ◀ ▶ (ao hover)                             │   │
│  │  │  ├─ Contador: "3/10"                                    │   │
│  │  │  ├─ Thumbnails strip (scroll horizontal)               │   │
│  │  │  ├─ Alt text da foto                                    │   │
│  │  │  └─ Click foto → Lightbox tela cheia                   │   │
│  │  │                                                          │   │
│  │  └─ Col 3: Informações do RT                              │   │
│  │     ├─ Nome: "Suite Executiva"                             │   │
│  │     ├─ Descrição (2-3 linhas)                             │   │
│  │     ├─ 👥 Capacidade: 4 hóspedes                          │   │
│  │     ├─ 💰 $150 por noite                                   │   │
│  │     ├─ 🛏️ Mín. 2 noites                                   │   │
│  │     ├─ Amenities (lista completa com ✓)                   │   │
│  │     └─ [Reservar Agora]                                    │   │
│  │                                                             │   │
│  │  ───────────────────────────────────────────────────────   │   │
│  │                                                             │   │
│  │  Room Type Card 2: "Quarto Executivo"                      │   │
│  │  └─ Mesma estrutura...                                    │   │
│  │                                                             │   │
│  │  Room Type Card N                                          │   │
│  │                                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎬 Componentes & Modos

```
HotelPhotoGallery Component
├─ Mode: "preview" (Padrão)
│  └─ Layout: Foto + Badge
│     ├─ Mostra: 1 foto (is_primary ou primeira)
│     ├─ Badge: "+X fotos"
│     ├─ Hover: Overlay + CTA
│     ├─ Click: Abre Lightbox
│     └─ Uso: Resultados de busca
│
├─ Mode: "grid"
│  └─ Layout: Múltiplas fotos em grid
│     ├─ Colunas: 1-3 responsivo
│     ├─ Hover: Overlay + Maximize icon
│     ├─ Click: Abre Lightbox
│     ├─ Badge: Foto principal marcada
│     └─ Uso: Galeria expandida
│
├─ Mode: "full"
│  └─ Layout: Viewer grande + thumbnails
│     ├─ Viewer: Aspect-video
│     ├─ Setas: ◀ ▶ (hover)
│     ├─ Contador: "N / Total"
│     ├─ Thumbnails: Strip horizontal
│     ├─ Click: Abre Lightbox
│     └─ Uso: Página de detalhes
│
└─ Lightbox (Automático)
   └─ Layout: Tela cheia (dark)
      ├─ Imagem: Max-width, centered
      ├─ Setas: ◀ ▶ grandes
      ├─ Thumbnails: Strip inferior
      ├─ Contador: Bottom center
      ├─ Fechar: X top-right
      └─ Teclado: ← → | Esc
```

---

## 🔄 Data Flow

```
Upload Flow:
┌─────────────────┐
│ User selects    │
│ files (drag&drop)
└────────┬────────┘
         │ 
         ▼
┌──────────────────────────────┐
│ Validate file                │
│ - Size < 5MB                 │
│ - Format OK                  │
│ - Dimensions OK              │
└────────┬─────────────────────┘
         │ Valid? No → Show error
         │
         │ Valid? Yes
         ▼
┌──────────────────────────────────────┐
│ Create FormData                      │
│ append(file, alt_text, is_featured)  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ POST /api/hotels/room-types/:id/photos       │
│ (multipart/form-data)                        │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend:                                 │
│ 1. Validar arquivo                       │
│ 2. Compressão/resize                     │
│ 3. Upload para storage (S3/local)        │
│ 4. Salvar registro em DB                 │
│ 5. Return RoomTypePhoto object           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Frontend:                                │
│ 1. Receber foto                          │
│ 2. Adicionar à lista local               │
│ 3. Re-render galeria                     │
│ 4. Show success message                  │
│ 5. Atualizar thumbnails                  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌────────────────────┐
│ Display in gallery │
└────────────────────┘


Display Flow (Search Results):
┌─────────────────────────────┐
│ User searches for hotels    │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ GET /api/hotels?locality=Rio             │
│ GET /api/hotels/:id/with-photos (cada)   │
└────────┬───────────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Recebe array:                │
│ [{                           │
│   hotel: {...},              │
│   featuredPhotos: [...]      │
│ }]                           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Renderiza para cada hotel:           │
│ <HotelPhotoGallery                   │
│   photos={featuredPhotos}            │
│   mode="preview"                     │
│ />                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Exibe preview + badges          │
│ User interage (hover, click)     │
└─────────────────────────────────┘
```

---

## 📦 Estrutura de Pastas

```
src/
├─ shared/types/
│  └─ hotel-photos.ts          ← Tipos + Interfaces
│
├─ services/
│  └─ photoGalleryService.ts   ← Lógica de negócio
│
├─ apps/
│  ├─ hotels-app/
│  │  └─ components/
│  │     ├─ PhotoGalleryEditor.tsx    ← Editor (Hotels)
│  │     └─ RoomTypeForm.tsx          ← Form com galeria
│  │
│  └─ main-app/
│     ├─ components/
│     │  └─ HotelPhotoGallery.tsx      ← Visualizador
│     │
│     └─ pages/
│        └─ Hotels/
│           ├─ search.tsx    ← Resultados com fotos
│           └─ details.tsx   ← Detalhes com galerias
│
└─ (root)
   └─ HOTEL_PHOTOS_SYSTEM_GUIDE.md
   └─ HOTEL_PHOTOS_ARCHITECTURE.md
```

---

**Versão**: 1.0  
**Data**: 13/02/2026  
**Status**: ✅ Arquitetura Finalizada
