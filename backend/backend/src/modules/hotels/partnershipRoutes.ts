import { Router } from 'express';
import { PartnershipController } from '../partnerships/partnershipController';
import { authenticate } from '../../../middleware/role-auth';

const router = Router();
const partnershipController = new PartnershipController();

// Rotas para hotéis
router.post('/proposals', authenticate('hotel_manager'), partnershipController.createProposal);
router.get('/proposals', authenticate('hotel_manager'), partnershipController.getHotelProposals);
router.get('/proposals/:proposalId/applications', authenticate('hotel_manager'), partnershipController.getProposalApplications);

export { router as hotelPartnershipRoutes };