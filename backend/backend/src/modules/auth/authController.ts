import { Router, Request, Response, NextFunction } from "express";
import { authStorage } from "../../shared/authStorage";
import { verifyFirebaseToken } from "../../shared/firebaseAuth.js";
import type { AuthenticatedRequest } from "../../../shared/types.js";
import { db } from "../../../db.js";
import { sql } from "drizzle-orm";

const router = Router();

// Obter dados do usuário autenticado
router.get('/user', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.user?.uid;
    const userEmail = authReq.user?.claims?.email;
    
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    // Verificar se usuário existe na base de dados
    let user = await authStorage.getUser(userId);
    
    if (!user) {
      // Criar usuário automaticamente se não existir
      user = await authStorage.upsertUser({
        id: userId,
        email: userEmail || null,
        firstName: authReq.user?.displayName?.split(' ')[0] || null,
        lastName: authReq.user?.displayName?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: null
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: [user.userType], // Converter userType para array de roles
      isVerified: user.isVerified || false,
      profileImageUrl: user.profileImageUrl,
      registrationCompleted: user.registrationCompleted || false,
      needsRoleSelection: !user.registrationCompleted,
      
      // ✅ NOVOS CAMPOS DE CAPACIDADES
      canBookServices: user.canBookServices || true,
      canDrive: user.canDrive || false,
      canManageHotels: user.canManageHotels || false,
      isAdmin: user.isAdmin || false,
      
      driverVerificationStatus: user.driverVerificationStatus,
      hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
      accountType: user.accountType || 'individual',
      companyName: user.companyName,
      
      // ✅ PARA COMPATIBILIDADE (temporário)
      userType: user.userType
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Endpoint tradicional de registro com role específico
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'client' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email e senha são obrigatórios" 
      });
    }

    // TODO: Implementar criação no Firebase Auth aqui
    console.log(`📝 Registro solicitado: ${email} com role: ${role}`);
    
    res.status(201).json({
      success: true,
      message: "Registro realizado com sucesso",
      user: { 
        id: "temp-id", 
        email, 
        role: role 
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Erro ao realizar registro" 
    });
  }
});

// ✅ ATUALIZADO: Endpoint para configurar capacidades do usuário durante signup
router.post('/setup-user-roles', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { 
      uid, 
      email, 
      displayName, 
      photoURL, 
      roles,
      // ✅ NOVOS CAMPOS: Capacidades desejadas
      wantsToBeClient = true,
      wantsToBeDriver = false,
      wantsToBeHotelManager = false,
      // ✅ NOVOS CAMPOS: Dados condicionais
      driverLicenseNumber,
      driverVehicleType,
      businessTaxId,
      companyName,
      companyVatNumber,
      companyAddress,
      // ✅ NOVO CAMPO: Tipo de conta
      accountType = 'individual'
    } = req.body;
    
    const userId = uid || authReq.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    // ✅ SISTEMA DE CAPACIDADES - Criar/atualizar usuário com dados completos
    let user = await authStorage.upsertUser({
      id: userId,
      email: email,
      firstName: displayName?.split(' ')[0] || null,
      lastName: displayName?.split(' ').slice(1).join(' ') || null,
      profileImageUrl: photoURL || null,
      
      // ✅ Sistema de capacidades
      canBookServices: wantsToBeClient, // Todos podem ser clientes por padrão
      canDrive: wantsToBeDriver,
      canManageHotels: wantsToBeHotelManager,
      isAdmin: false, // Apenas admin pode setar isso manualmente
      
      // ✅ Status de verificação baseado nas capacidades
      driverVerificationStatus: wantsToBeDriver ? 'pending' : null,
      hotelManagerVerificationStatus: wantsToBeHotelManager ? 'pending' : null,
      
      // ✅ Dados específicos do motorista
      driverLicenseNumber: wantsToBeDriver ? driverLicenseNumber : null,
      driverVehicleType: wantsToBeDriver ? driverVehicleType : null,
      
      // ✅ Dados específicos do gestor de hotel/empresa
      businessTaxId: wantsToBeHotelManager ? businessTaxId : null,
      companyName: wantsToBeHotelManager ? companyName : null,
      companyVatNumber: wantsToBeHotelManager ? companyVatNumber : null,
      companyAddress: wantsToBeHotelManager ? companyAddress : null,
      
      // ✅ Tipo de conta (individual/company)
      accountType: accountType,
      
      // ✅ Manter compatibilidade (temporário - será removido no futuro)
      userType: wantsToBeHotelManager ? 'host' : 
                wantsToBeDriver ? 'driver' : 'client',
      
      // ✅ Marcar registro como completo
      registrationCompleted: true,
      
      // ✅ Manter roles para compatibilidade
      roles: roles || [wantsToBeHotelManager ? 'hotel_manager' : 
                      wantsToBeDriver ? 'driver' : 'client']
    });
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        
        // ✅ Capacidades
        canBookServices: user.canBookServices,
        canDrive: user.canDrive,
        canManageHotels: user.canManageHotels,
        isAdmin: user.isAdmin,
        
        // ✅ Status de verificação
        driverVerificationStatus: user.driverVerificationStatus,
        hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
        
        // ✅ Tipo de conta
        accountType: user.accountType,
        companyName: user.companyName,
        
        // ✅ Outros campos
        profileImageUrl: user.profileImageUrl,
        registrationCompleted: true,
        
        // ✅ Para compatibilidade
        userType: user.userType,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Erro ao configurar capacidades:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✅ NOVO ENDPOINT: Ativar capacidade para usuário existente
router.post('/activate-capacity', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { capacity, documents, notes } = req.body;
    const userId = authReq.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // ✅ Validar capacidade
    if (!['drive', 'hotel_manager'].includes(capacity)) {
      return res.status(400).json({ message: "Capacidade inválida. Use 'drive' ou 'hotel_manager'" });
    }
    
    // ✅ Buscar usuário atual
    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    // ✅ Preparar atualização baseada na capacidade
    let updateData: any = {};
    
    if (capacity === 'drive') {
      // ✅ Verificar se já tem a capacidade
      if (user.canDrive) {
        return res.status(400).json({ message: "Usuário já possui capacidade de motorista" });
      }
      
      updateData = {
        canDrive: true,
        driverVerificationStatus: 'pending',
        driverVerificationNotes: notes || null,
        capabilitiesUpdatedAt: new Date()
      };
      
      // ✅ Se enviou documentos, salvar na tabela específica
      if (documents && documents.length > 0) {
        // Aqui você implementaria a lógica para salvar documentos
        // usando authStorage.saveCapacityDocuments ou similar
        console.log(`📄 Salvando ${documents.length} documentos para motorista ${userId}`);
      }
      
    } else if (capacity === 'hotel_manager') {
      // ✅ Verificar se já tem a capacidade
      if (user.canManageHotels) {
        return res.status(400).json({ message: "Usuário já possui capacidade de gestor de hotéis" });
      }
      
      updateData = {
        canManageHotels: true,
        hotelManagerVerificationStatus: 'pending',
        hotelManagerVerificationNotes: notes || null,
        capabilitiesUpdatedAt: new Date()
      };
      
      // ✅ Se enviou documentos, salvar na tabela específica
      if (documents && documents.length > 0) {
        console.log(`📄 Salvando ${documents.length} documentos para gestor ${userId}`);
      }
    }
    
    // ✅ Atualizar usuário com novas capacidades
    const updatedUser = await authStorage.upsertUser({
      id: userId,
      ...updateData
    });
    
    res.json({ 
      success: true,
      message: `Capacidade de ${capacity === 'drive' ? 'motorista' : 'gestor de hotéis'} ativada com sucesso`,
      requiresVerification: true,
      user: {
        id: updatedUser.id,
        canDrive: updatedUser.canDrive,
        canManageHotels: updatedUser.canManageHotels,
        driverVerificationStatus: updatedUser.driverVerificationStatus,
        hotelManagerVerificationStatus: updatedUser.hotelManagerVerificationStatus
      }
    });
    
  } catch (error) {
    console.error('Erro ao ativar capacidade:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✅ NOVO ENDPOINT: Obter status de capacidades do usuário
router.get('/capabilities', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Buscar usuário
    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    // Retornar status das capacidades
    res.json({
      canBookServices: user.canBookServices || false,
      canDrive: user.canDrive || false,
      canManageHotels: user.canManageHotels || false,
      isAdmin: user.isAdmin || false,
      
      driverVerificationStatus: user.driverVerificationStatus,
      hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
      
      accountType: user.accountType || 'individual',
      companyName: user.companyName,
      
      // Informações adicionais
      driverLicenseNumber: user.driverLicenseNumber,
      driverVehicleType: user.driverVehicleType,
      businessTaxId: user.businessTaxId,
      
      // Datas importantes
      capabilitiesUpdatedAt: user.capabilitiesUpdatedAt,
      lastCapacityActivation: user.lastCapacityActivation,
      
      // Documentos (seria buscar da tabela userCapacityDocuments)
      hasDriverDocuments: false, // Implementar depois
      hasHotelManagerDocuments: false // Implementar depois
    });
    
  } catch (error) {
    console.error('Erro ao obter capacidades:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✅ NOVO ENDPOINT: Upload de documentos para verificação de capacidade
router.post('/upload-capacity-document', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { capacity, documentType, documentUrl, documentNumber, expiryDate } = req.body;
    const userId = authReq.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Validar campos obrigatórios
    if (!capacity || !documentType || !documentUrl) {
      return res.status(400).json({ 
        message: "Capacidade, tipo de documento e URL são obrigatórios" 
      });
    }
    
    // Validar capacidade
    if (!['drive', 'hotel_manager'].includes(capacity)) {
      return res.status(400).json({ message: "Capacidade inválida" });
    }
    
    // TODO: Salvar documento na tabela userCapacityDocuments
    // Por enquanto, apenas log
    console.log(`📄 Documento ${documentType} para capacidade ${capacity} do usuário ${userId}`);
    
    res.json({
      success: true,
      message: "Documento enviado com sucesso",
      document: {
        capacity,
        documentType,
        documentUrl,
        documentNumber,
        expiryDate,
        status: 'pending'
      }
    });
    
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;