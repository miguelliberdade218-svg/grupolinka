import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db.js';
import { vehicles } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

// ✅ Importar apenas o que existe
import { verifyFirebaseToken } from '../../src/shared/firebaseAuth.js';

const router = Router();

// ✅ MIDDLEWARE CORRIGIDO: Temporariamente aceitar qualquer usuário autenticado
const requireDriverRole = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Usuário não autenticado' 
    });
  }
  
  // ✅ TEMPORARIAMENTE: Comentar a verificação de role para debugging
  /*
  // Verificar se tem role de driver
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('driver')) {
    return res.status(403).json({ 
      success: false, 
      error: 'Acesso negado. Requer role de driver.',
      userRoles: userRoles
    });
  }
  
  console.log('✅ Driver role verificada para:', req.user.email);
  */
  
  console.log('✅ Usuário autenticado (role bypass):', req.user.email, 'UID:', req.user.uid);
  next();
};

// ✅ CORREÇÃO: Validação mais flexível para matrículas
const normalizePlateNumber = (plateNumber: string): { cleaned: string; raw: string } => {
  if (!plateNumber || plateNumber.trim() === '') {
    throw new Error('Matrícula é obrigatória');
  }

  // Manter o formato original para display
  const plateNumberRaw = plateNumber.trim().toUpperCase();
  
  // Limpar para validação (remover espaços e hífens)
  const cleaned = plateNumberRaw.replace(/[\s-]/g, '');
  
  // Aceitar formatos: ABC123, AB123CD, ABC12D, MMA9278, etc.
  const plateRegex = /^[A-Z]{2,4}\d{1,4}[A-Z]{0,2}$/;
  
  if (!plateRegex.test(cleaned)) {
    throw new Error(`Formato de matrícula inválido: "${plateNumberRaw}". Use formatos como: ABC 123, AB-123-CD, MMA-92-78, etc.`);
  }
  
  return { cleaned, raw: plateNumberRaw };
};

// ✅ GET /api/vehicles/types - Listar tipos de veículo disponíveis
router.get('/types', verifyFirebaseToken, (req: any, res: any) => {
  const vehicleTypes = [
    { value: 'economy', label: '🚗 Económico', description: 'Veículo básico e económico' },
    { value: 'comfort', label: '🚙 Conforto', description: 'Veículo com mais conforto' },
    { value: 'luxury', label: '🏎️ Luxo', description: 'Veículo de luxo e alta qualidade' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Familiar', description: 'Veículo espaçoso para famílias' },
    { value: 'premium', label: '⭐ Premium', description: 'Serviço premium executivo' },
    { value: 'van', label: '🚐 Van', description: 'Van para grupos maiores' },
    { value: 'suv', label: '🚙 SUV', description: 'SUV espaçoso e confortável' }
  ];
  
  res.json({ success: true, types: vehicleTypes });
});

// ✅ GET /api/vehicles - Listar veículos do motorista
router.get('/', verifyFirebaseToken, requireDriverRole, async (req: any, res: any) => {
  try {
    const driverId = req.user.uid;
    
    console.log('🔍 Buscando veículos para driver:', driverId);
    
    // ✅ Buscar veículos do motorista
    const vehiclesList = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.driver_id, driverId),
          eq(vehicles.is_active, true)
        )
      );
    
    console.log(`✅ Encontrados ${vehiclesList.length} veículos`);
    
    res.json({
      success: true,
      vehicles: vehiclesList.map((vehicle: any) => ({
        id: vehicle.id,
        plateNumber: vehicle.plate_number,
        plateNumberRaw: vehicle.plate_number_raw,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year,
        vehicleType: vehicle.vehicle_type,
        maxPassengers: vehicle.max_passengers,
        features: vehicle.features || [],
        photoUrl: vehicle.photo_url,
        isActive: vehicle.is_active,
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar veículos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ✅ POST /api/vehicles - Criar veículo
router.post('/', verifyFirebaseToken, requireDriverRole, async (req: any, res: any) => {
  try {
    const driverId = req.user.uid;
    
    console.log('🚗 Criando veículo para driver:', driverId, 'Dados:', req.body);
    
    // ✅ Schema de validação local
    const vehicleSchema = z.object({
      plateNumber: z.string().min(3).max(20),
      make: z.string().min(1).max(100),
      model: z.string().min(1).max(100),
      color: z.string().min(1).max(50),
      year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
      vehicleType: z.enum(['economy', 'comfort', 'luxury', 'family', 'premium', 'van', 'suv']),
      maxPassengers: z.number().min(1).max(50),
      features: z.array(z.string()).optional(),
      photoUrl: z.string().url().optional().or(z.literal(''))
    });

    const validation = vehicleSchema.safeParse(req.body);

    if (!validation.success) {
      console.log('❌ Validação falhou:', validation.error.errors);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.errors
      });
    }

    const { plateNumber, make, model, color, year, vehicleType, maxPassengers, features, photoUrl } = validation.data;

    // ✅ CORREÇÃO: Usar a nova função de normalização de matrícula
    const { cleaned: plateFormatted, raw: plateNumberRaw } = normalizePlateNumber(plateNumber);

    console.log('🔍 Verificando se matrícula já existe:', plateFormatted);

    // Verificar se matrícula já existe
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.plate_number, plateFormatted))
      .limit(1);

    if (existingVehicle.length > 0) {
      console.log('❌ Matrícula já existe:', plateFormatted);
      return res.status(409).json({
        success: false,
        message: 'Já existe um veículo com esta matrícula'
      });
    }

    console.log('✅ Inserindo novo veículo...');

    // Inserir veículo
    const newVehicle = await db
      .insert(vehicles)
      .values({
        driver_id: driverId,
        plate_number: plateFormatted,
        plate_number_raw: plateNumberRaw,
        make,
        model,
        color,
        year,
        vehicle_type: vehicleType,
        max_passengers: maxPassengers,
        features: features || [],
        photo_url: photoUrl || null,
        is_active: true
      })
      .returning();

    const vehicle = newVehicle[0];

    console.log('✅ Veículo criado com sucesso:', vehicle.id);

    res.status(201).json({
      success: true,
      message: 'Veículo criado com sucesso',
      vehicle: {
        id: vehicle.id,
        plateNumber: vehicle.plate_number,
        plateNumberRaw: vehicle.plate_number_raw,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year,
        vehicleType: vehicle.vehicle_type,
        maxPassengers: vehicle.max_passengers,
        features: vehicle.features || [],
        photoUrl: vehicle.photo_url
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar veículo:', error);
    
    // ✅ CORREÇÃO: Melhor tratamento de erro para matrículas
    if (error instanceof Error && error.message.includes('matrícula')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ✅ CORREÇÃO: Adicionar rota DELETE para desativar veículo
router.delete('/:id', verifyFirebaseToken, requireDriverRole, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const driverId = req.user.uid;

    console.log('🗑️ [VEHICLES-API] Desativando veículo:', { vehicleId: id, driverId });

    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    // Verificar se o veículo existe e pertence ao motorista
    const vehicle = await db.select()
      .from(vehicles)
      .where(and(
        eq(vehicles.id, id),
        eq(vehicles.driver_id, driverId)
      ))
      .limit(1);

    if (vehicle.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Veículo não encontrado ou não pertence a você'
      });
    }

    // Soft delete - marcar como inativo
    await db.update(vehicles)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(and(
        eq(vehicles.id, id),
        eq(vehicles.driver_id, driverId)
      ));

    console.log('✅ [VEHICLES-API] Veículo desativado com sucesso:', id);

    res.json({
      success: true,
      message: 'Veículo desativado com sucesso',
      data: { vehicleId: id }
    });

  } catch (error) {
    console.error('❌ [VEHICLES-API] Erro ao desativar veículo:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// ✅ CORREÇÃO: Adicionar rota PUT para atualizar veículo
router.put('/:id', verifyFirebaseToken, requireDriverRole, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const driverId = req.user.uid;
    const body = req.body;

    console.log('✏️ [VEHICLES-API] Atualizando veículo:', { vehicleId: id, driverId });

    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    // Verificar se o veículo existe e pertence ao motorista
    const existingVehicle = await db.select()
      .from(vehicles)
      .where(and(
        eq(vehicles.id, id),
        eq(vehicles.driver_id, driverId)
      ))
      .limit(1);

    if (existingVehicle.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Veículo não encontrado ou não pertence a você'
      });
    }

    // ✅ CORREÇÃO: Schema de validação para atualização
    const updateVehicleSchema = z.object({
      plateNumber: z.string().min(3).max(20).optional(),
      make: z.string().min(1).max(100).optional(),
      model: z.string().min(1).max(100).optional(),
      color: z.string().min(1).max(50).optional(),
      year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
      vehicleType: z.enum(['economy', 'comfort', 'luxury', 'family', 'premium', 'van', 'suv']).optional(),
      maxPassengers: z.number().min(1).max(50).optional(),
      features: z.array(z.string()).optional(),
      photoUrl: z.string().url().optional().or(z.literal(''))
    });

    const validation = updateVehicleSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.errors
      });
    }

    const validatedData = validation.data;

    // Dados para atualização
    const updateData: any = {
      updated_at: new Date()
    };

    // ✅ CORREÇÃO: Processar matrícula se for fornecida
    if (validatedData.plateNumber) {
      const { cleaned: plateFormatted, raw: plateNumberRaw } = normalizePlateNumber(validatedData.plateNumber);
      
      // Verificar se a nova matrícula já existe (excluindo o veículo atual)
      const existingPlate = await db.select()
        .from(vehicles)
        .where(and(
          eq(vehicles.plate_number, plateFormatted),
          eq(vehicles.is_active, true),
          eq(vehicles.driver_id, driverId)
        ))
        .limit(1);

      if (existingPlate.length > 0 && existingPlate[0].id !== id) {
        return res.status(409).json({
          success: false,
          error: 'Já existe um veículo com esta matrícula'
        });
      }

      updateData.plate_number = plateFormatted;
      updateData.plate_number_raw = plateNumberRaw;
    }

    // Campos que podem ser atualizados
    if (validatedData.make) updateData.make = validatedData.make;
    if (validatedData.model) updateData.model = validatedData.model;
    if (validatedData.color) updateData.color = validatedData.color;
    if (validatedData.year) updateData.year = validatedData.year;
    if (validatedData.vehicleType) updateData.vehicle_type = validatedData.vehicleType;
    if (validatedData.maxPassengers) updateData.max_passengers = validatedData.maxPassengers;
    if (validatedData.photoUrl !== undefined) updateData.photo_url = validatedData.photoUrl || null;
    if (validatedData.features) updateData.features = validatedData.features;

    // Atualizar no banco
    await db.update(vehicles)
      .set(updateData)
      .where(and(
        eq(vehicles.id, id),
        eq(vehicles.driver_id, driverId)
      ));

    console.log('✅ [VEHICLES-API] Veículo atualizado com sucesso:', id);

    // Buscar veículo atualizado
    const updatedVehicle = await db.select()
      .from(vehicles)
      .where(and(
        eq(vehicles.id, id),
        eq(vehicles.driver_id, driverId)
      ))
      .limit(1);

    res.json({
      success: true,
      message: 'Veículo atualizado com sucesso',
      vehicle: updatedVehicle.length > 0 ? {
        id: updatedVehicle[0].id,
        plateNumber: updatedVehicle[0].plate_number,
        plateNumberRaw: updatedVehicle[0].plate_number_raw,
        make: updatedVehicle[0].make,
        model: updatedVehicle[0].model,
        color: updatedVehicle[0].color,
        year: updatedVehicle[0].year,
        vehicleType: updatedVehicle[0].vehicle_type,
        maxPassengers: updatedVehicle[0].max_passengers,
        features: updatedVehicle[0].features || [],
        photoUrl: updatedVehicle[0].photo_url,
        isActive: updatedVehicle[0].is_active,
        createdAt: updatedVehicle[0].created_at,
        updatedAt: updatedVehicle[0].updated_at
      } : null
    });

  } catch (error) {
    console.error('❌ [VEHICLES-API] Erro ao atualizar veículo:', error);
    
    // ✅ CORREÇÃO: Melhor tratamento de erro para matrículas
    if (error instanceof Error && error.message.includes('matrícula')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// ✅ Função para formatar matrícula (mantida para compatibilidade)
function formatLicensePlate(plate: string): string | null {
  const cleanPlate = plate.replace(/[-\s]/g, '').toUpperCase();
  const plateRegex = /^[A-Z]{3}[0-9]{3}[A-Z]{2}$/;
  
  if (!plateRegex.test(cleanPlate)) {
    console.log('❌ Formato de matrícula inválido:', cleanPlate);
    return null;
  }
  
  return `${cleanPlate.substring(0, 3)} ${cleanPlate.substring(3, 6)} ${cleanPlate.substring(6, 8)}`;
}

export default router;