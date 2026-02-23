import { Router } from 'express';
import { PartnershipController } from './partnershipController';
import { verifyFirebaseToken, requireDriverRole, requireHotelManagerRole } from '../../../middleware/role-auth';

const router = Router();
const partnershipController = new PartnershipController();

// ===== ROTAS PÚBLICAS (para motoristas e usuários não autenticados) =====

// Buscar propostas disponíveis (com filtros opcionais)
router.get('/proposals/available', partnershipController.getAvailableProposals);

// ===== ROTAS PARA MOTORISTAS =====

// Listar propostas do motorista
router.get('/my-proposals', verifyFirebaseToken, requireDriverRole, partnershipController.getMyProposals);

// Listar aplicações do motorista
router.get('/my-applications', verifyFirebaseToken, requireDriverRole, partnershipController.getMyApplications);

// Aplicar a uma proposta (aceitar)
router.post('/proposals/:proposalId/accept', verifyFirebaseToken, requireDriverRole, partnershipController.acceptProposal);

// Rejeitar uma proposta
router.post('/proposals/:proposalId/reject', verifyFirebaseToken, requireDriverRole, partnershipController.rejectProposal);

// ===== ROTAS PARA HOTÉIS =====

// Gestão de propostas
router.post('/proposals', verifyFirebaseToken, requireHotelManagerRole, partnershipController.createProposal);
router.get('/proposals', verifyFirebaseToken, requireHotelManagerRole, partnershipController.getHotelProposals);

// Gestão de aplicações
router.get('/proposals/:proposalId/applications', verifyFirebaseToken, requireHotelManagerRole, partnershipController.getProposalApplications);

export { router as partnershipRoutes };