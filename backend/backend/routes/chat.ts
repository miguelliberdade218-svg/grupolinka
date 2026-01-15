import { Router } from 'express';
import { chatService } from '../services/chatService';
import { AuthenticatedRequest } from '../shared/types';
import { AuthenticatedUser } from '../shared/types'; // ✅ Importação adicionada

const router = Router();

/**
 * GET /api/chat/rooms
 * Obtém salas de chat do utilizador
 */
router.get('/rooms', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO: .uid em vez de .id
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const chatRooms = await chatService.getUserChatRooms(userId);
    res.json(chatRooms);
  } catch (error) {
    console.error('Erro ao obter salas de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/chat/messages/:chatRoomId
 * Obtém mensagens de uma sala de chat
 */
router.get('/messages/:chatRoomId', async (req: AuthenticatedRequest, res) => {
  try {
    const { chatRoomId } = req.params;
    const { limit = 50 } = req.query;
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO: .uid em vez de .id

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Verificar se o utilizador tem acesso à sala
    const hasAccess = await chatService.checkChatRoomAccess(chatRoomId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Sem permissão para aceder a esta sala' });
    }

    const messages = await chatService.getChatMessages(chatRoomId, Number(limit));
    res.json(messages);
  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/chat/room
 * Cria ou obtém sala de chat para uma reserva
 */
router.post('/room', async (req: AuthenticatedRequest, res) => {
  try {
    const { bookingId } = req.body;
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO: .uid em vez de .id

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!bookingId) {
      return res.status(400).json({ error: 'ID da reserva é obrigatório' });
    }

    // TODO: Verificar se o utilizador é participante da reserva

    const chatRoom = await chatService.getOrCreateChatRoom(bookingId);
    res.json(chatRoom);
  } catch (error) {
    console.error('Erro ao criar/obter sala de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/chat/deactivate/:chatRoomId
 * Desactiva uma sala de chat
 */
router.post('/deactivate/:chatRoomId', async (req: AuthenticatedRequest, res) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO: .uid em vez de .id

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Verificar se o utilizador tem acesso à sala
    const hasAccess = await chatService.checkChatRoomAccess(chatRoomId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Sem permissão para desactivar esta sala' });
    }

    await chatService.deactivateChatRoom(chatRoomId);
    res.json({ success: true, message: 'Sala de chat desactivada' });
  } catch (error) {
    console.error('Erro ao desactivar sala de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/chat/statistics
 * Obtém estatísticas de chat (apenas admin)
 */
router.get('/statistics', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO: .uid em vez de .id
    const userRoles = (req.user as AuthenticatedUser)?.roles || []; // ✅ CORRIGIDO: .roles com type assertion

    if (!userId || !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Apenas administradores podem aceder a estatísticas' });
    }

    const statistics = await chatService.getChatStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Erro ao obter estatísticas de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;