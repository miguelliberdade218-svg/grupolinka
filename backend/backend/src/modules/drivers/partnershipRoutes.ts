import { Router } from 'express';
import { PartnershipController } from '../partnerships/partnershipController';
import { authenticate } from '../../../middleware/role-auth';

const router = Router();
const partnershipController = new PartnershipController();

// Rotas para motoristas
router.get('/proposals/available', authenticate('driver'), partnershipController.getAvailableProposals);
router.get('/proposals/my', authenticate('driver'), partnershipController.getMyProposals);
router.get('/applications/my', authenticate('driver'), partnershipController.getMyApplications);
router.post('/proposals/:proposalId/accept', authenticate('driver'), partnershipController.acceptProposal);
router.post('/proposals/:proposalId/reject', authenticate('driver'), partnershipController.rejectProposal);

export { router as driverPartnershipRoutes };