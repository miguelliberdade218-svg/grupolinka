import { Router } from 'express';
import { newHotelRoutes } from '../src/modules/hotels/newHotelRoutes';

const router = Router();

// Rotas v2 para hotéis
router.use('/hotels', newHotelRoutes);

export { router as v2Routes };
