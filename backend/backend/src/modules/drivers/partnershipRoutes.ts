import { Router } from 'express';
import { PartnershipController } from '../partnerships/partnershipController';
import { verifyFirebaseToken, requireDriverRole } from '../../../middleware/role-auth';

const router = Router();
const partnershipController = new PartnershipController();

// Rotas para motoristas
router.get('/proposals/available', verifyFirebaseToken, requireDriverRole, partnershipController.getAvailableProposals);
router.get('/proposals/my', verifyFirebaseToken, requireDriverRole, partnershipController.getMyProposals);
router.get('/applications/my', verifyFirebaseToken, requireDriverRole, partnershipController.getMyApplications);
router.post('/proposals/:proposalId/accept', verifyFirebaseToken, requireDriverRole, partnershipController.acceptProposal);
router.post('/proposals/:proposalId/reject', verifyFirebaseToken, requireDriverRole, partnershipController.rejectProposal);

export { router as driverPartnershipRoutes };