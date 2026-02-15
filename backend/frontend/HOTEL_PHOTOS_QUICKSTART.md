# ⚡ Hotel Photo Gallery - Quick Start

**Data**: 13/02/2026  
**Status**: Ready to Use

---

## 🚀 5 Minutos para Começar

### 1️⃣ Importe os Tipos

```typescript
// Seu arquivo .tsx
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';
```

### 2️⃣ Use o Serviço de Fotos

```typescript
import { photoGalleryService } from '@/services/photoGalleryService';

// Upload
const photo = await photoGalleryService.uploadRoomTypePhoto({
  room_type_id: 'room-123',
  file: selectedFile,
  is_featured: true,
  is_primary: true,
});

// Listar
const photos = await photoGalleryService.getRoomTypePhotos('room-123');

// Atualizar
await photoGalleryService.setPrimaryPhoto('room-123', 'photo-456');

// Deletar
await photoGalleryService.deletePhoto('room-123', 'photo-456');
```

### 3️⃣ Use o Editor no Hotels App

```typescript
import { PhotoGalleryEditor } from '@/apps/hotels-app/components/PhotoGalleryEditor';

export const RoomTypeEditor = () => {
  return (
    <PhotoGalleryEditor
      roomTypeId="room-123"
      onPhotosUpdated={(photos) => console.log('Updated:', photos)}
    />
  );
};
```

### 4️⃣ Use a Galeria na Main App

```typescript
import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';

// Modo Preview (Resultados)
<HotelPhotoGallery
  photos={photos}
  mode="preview"
  title="Suite Executiva"
/>

// Modo Grid (Galeria expandida)
<HotelPhotoGallery
  photos={photos}
  mode="grid"
  className="grid-cols-3"
/>

// Modo Full (Detalhes)
<HotelPhotoGallery
  photos={photos}
  mode="full"
  title="Quarto Luxo"
/>
```

---

## 📁 Ficheiros Principais

| Ficheiro | Propósito |
|----------|-----------|
| `hotel-photos.ts` | Tipos e interfaces |
| `photoGalleryService.ts` | Lógica de negócio |
| `PhotoGalleryEditor.tsx` | Editor para gestores |
| `HotelPhotoGallery.tsx` | Visualizador para clientes |
| `Hotels/search.tsx` | Página de resultados |
| `Hotels/details.tsx` | Página de detalhes |

---

## 🎨 4 Modos de Exibição

### Preview Mode
```tsx
<HotelPhotoGallery photos={photos} mode="preview" />

// Resultado: 1 foto + badge "+X"
// Uso: Search results
// Click: Abre lightbox
```

### Grid Mode
```tsx
<HotelPhotoGallery photos={photos} mode="grid" />

// Resultado: Grid responsivo (1-3 cols)
// Uso: Galeria expandida
// Click: Abre lightbox
```

### Full Mode
```tsx
<HotelPhotoGallery photos={photos} mode="full" />

// Resultado: Viewer grande + thumbnails
// Uso: Página de detalhes
// Setas: Navegação
```

### Lightbox
Automático em todos os modos quando clica na foto

---

## 🔧 Configuração Rápida

### Restringir tamanho de fotos

```typescript
// Em photoGalleryService.ts
PHOTO_CONSTRAINTS: {
  MAX_FILE_SIZE: 5 * 1024 * 1024,        // 5MB
  MAX_PHOTOS_PER_ROOM_TYPE: 20,          // Máx 20
  ALLOWED_FORMATS: ['image/jpeg', ...],  // Formatos
}
```

### Estilo customizado

```typescript
// Usar className prop
<HotelPhotoGallery
  photos={photos}
  mode="grid"
  className="grid-cols-4 gap-6"  // Customizar grid
/>
```

---

## 💡 Dicas Profissionais

### 1. Ordenação
```
- Foto principal sempre 1ª
- Destacadas depois (ordem matters)
- Resto por último
```

### 2. Fotos Destacadas
```
Recomendação: 3-5 fotos
- Principal (obrigatória)
- 2-4 extras melhores
- Resto apenas em detalhes
```

### 3. Nomes Descritivos
```
Usar alt_text para SEO:
- ❌ "Foto 1"
- ✅ "Suite Executiva com vista mar"
```

### 4. Resolução
```
Recomendado:
- Mínimo: 800px
- Recomendado: 1200px
- Max: 2000px (lightbox)
```

---

## 🐛 Troubleshooting

### Upload não funciona
```
❌ Arquivo > 5MB → Comprimir
❌ Formato inválido → Usar JPEG/PNG
❌ Network error → Checker conexão
```

### Foto não aparece
```
❌ Não marcada como "featured" → Marcar
❌ Arquivo não salvou → Retry
❌ URL incorreta → Verificar backend
```

### Performance lenta
```
❌ Muitas fotos (>100) → Lazy load
❌ Imagens grandes → Comprimir
❌ Muitos requests → Cache
```

---

## 📱 Responsive Design

```
Mobile (<768px):
- Grid: 1 coluna
- Foto: Full-width
- Thumbnails: Scroll horizontal

Tablet (768px-1024px):
- Grid: 2 colunas
- Foto: 16:9 aspect
- Tudo visível

Desktop (>1024px):
- Grid: 3 colunas
- Foto: Lado a lado com info
- Melhor espaçamento
```

---

## 🎓 Exemplo Completo

### Hotels App - Gerenciar Fotos

```typescript
import { RoomTypeForm } from '@/apps/hotels-app/components/RoomTypeForm';

export const RoomTypeManagement = () => {
  const handleSuccess = (roomType: any) => {
    console.log('Room type criado:', roomType);
    // Redirect ou atualizar lista
  };

  return (
    <RoomTypeForm
      hotelId="hotel-123"
      onSuccess={handleSuccess}
    />
  );
};

// Agora o form inclui PhotoGalleryEditor automaticamente
// Após criar RT, gestor pode fazer upload de fotos
```

### Main App - Mostrar Fotos

```typescript
import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';

export const HotelCard = ({ hotel }: any) => {
  const [photos, setPhotos] = useState<RoomTypePhoto[]>([]);

  useEffect(() => {
    photoGalleryService.getHotelFeaturedPhotos(hotel.id)
      .then(setPhotos);
  }, [hotel.id]);

  return (
    <div className="bg-white rounded-lg border">
      <HotelPhotoGallery
        photos={photos}
        mode="preview"
        title={hotel.name}
      />
      <div className="p-4">
        <h2>{hotel.name}</h2>
        {/* Resto das info */}
      </div>
    </div>
  );
};
```

---

## 🚀 Deploy Checklist

- [ ] Tipos TypeScript compilados
- [ ] Serviço incluído em bundle
- [ ] Componentes carregando
- [ ] Estilos Tailwind aplicados
- [ ] APIs endpoint pronto
- [ ] Database schema migrado
- [ ] Fotos salvando em storage
- [ ] URLs de fotos corretas
- [ ] Lightbox funcionando
- [ ] Responsivo em mobile
- [ ] Teste em real device

---

## 📞 Suporte

### Ficheiros de Documentação
- `HOTEL_PHOTOS_SYSTEM_GUIDE.md` - Guia completo
- `HOTEL_PHOTOS_ARCHITECTURE.md` - Arquitetura
- `HOTEL_PHOTOS_EXECUTIVE_SUMMARY.md` - Resumo

### Componentes
- `PhotoGalleryEditor` - Editor Hotels App
- `HotelPhotoGallery` - Visualizador Main App
- `photoGalleryService` - Serviço

---

## ✅ Status

- ✅ Frontend completo
- ✅ Tipos TypeScript
- ✅ Componentes React
- ✅ Documentação
- ⏳ Backend endpoints (próximo)
- ⏳ Database (próximo)
- ⏳ Storage (próximo)

**Pronto para**: Integração com backend

---

**Versão**: 1.0  
**Data**: 13/02/2026  
**Tempo para começar**: ~5 minutos ⚡
