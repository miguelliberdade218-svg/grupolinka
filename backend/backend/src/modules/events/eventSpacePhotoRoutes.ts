/**
 * src/modules/events/eventSpacePhotoRoutes.ts
 * Rotas para fotos de event spaces - VERSÃO SIMPLIFICADA
 */

import { Router } from 'express';
import {
  upload,
  uploadEventSpacePhoto,
  getEventSpacePhotos,
  getFeaturedEventSpacePhotos,
  updateEventSpacePhoto,
  deleteEventSpacePhoto,
  reorderEventSpacePhotos
} from './eventSpacePhotoController';

const router = Router({ mergeParams: true });

// ✅ Middleware para log e extração do eventSpaceId
router.use('/:eventSpaceId/photos*', (req, res, next) => {
  console.log('📸 [eventSpacePhotoRoutes] Rota de fotos acessada:', {
    eventSpaceId: req.params.eventSpaceId,
    method: req.method,
    path: req.path
  });
  next();
});

// Rotas específicas
router.post('/:eventSpaceId/photos', upload.single('photo'), uploadEventSpacePhoto);
router.get('/:eventSpaceId/photos', getEventSpacePhotos);
router.get('/:eventSpaceId/photos/featured', getFeaturedEventSpacePhotos);
router.put('/:eventSpaceId/photos/:photoId', updateEventSpacePhoto);
router.delete('/:eventSpaceId/photos/:photoId', deleteEventSpacePhoto);
router.put('/:eventSpaceId/photos/reorder', reorderEventSpacePhotos);

export default router;