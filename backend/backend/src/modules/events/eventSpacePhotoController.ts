/**
 * src/modules/events/eventSpacePhotoController.ts
 * Controller para fotos de event spaces
 * ✅ CORRIGIDO: Adicionado __dirname para ES Modules
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { db } from '../../../db';
import { eventSpacePhotos, eventSpaces } from '../../../shared/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';

// ✅ CORREÇÃO: Definir __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do multer com LOGS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../public/uploads/event-spaces');
    console.log('📸 [multer] Destination:', uploadDir);
    console.log('📸 [multer] Request headers:', req.headers['content-type']);
    console.log('📸 [multer] __dirname:', __dirname); // Log para debug
    
    if (!fs.existsSync(uploadDir)) {
      console.log('📸 [multer] Criando diretório:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueId}${ext}`;
    console.log('📸 [multer] Gerando filename:', {
      originalname: file.originalname,
      uniqueId,
      ext,
      filename
    });
    cb(null, filename);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('📸 [multer] File filter - arquivo recebido:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    encoding: file.encoding
  });

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    console.log('📸 [multer] Formato permitido:', file.mimetype);
    cb(null, true);
  } else {
    console.log('📸 [multer] Formato NÃO permitido:', file.mimetype);
    cb(new Error('Formato inválido. Use apenas: JPEG, PNG, WEBP, GIF ou AVIF'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

/**
 * Upload de foto para event space
 */
export const uploadEventSpacePhoto = async (req: Request, res: Response) => {
  try {
    const { eventSpaceId } = req.params;
    const { is_featured, is_primary, alt_text } = req.body;
    const file = req.file;

    // LOG DETALHADO DA REQUISIÇÃO
    console.log('📸 [EVENT SPACE UPLOAD] ===== INÍCIO DO UPLOAD =====');
    console.log('📸 [EVENT SPACE UPLOAD] eventSpaceId:', eventSpaceId);
    console.log('📸 [EVENT SPACE UPLOAD] Headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent']
    });
    console.log('📸 [EVENT SPACE UPLOAD] Body keys:', Object.keys(req.body));
    console.log('📸 [EVENT SPACE UPLOAD] Body values:', {
      is_featured,
      is_primary,
      alt_text
    });
    console.log('📸 [EVENT SPACE UPLOAD] Files:', req.files ? 'Múltiplos arquivos' : 'Sem múltiplos');
    console.log('📸 [EVENT SPACE UPLOAD] File:', file ? {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      destination: file.destination,
      filename: file.filename,
      path: file.path
    } : 'undefined');

    if (!file) {
      console.log('📸 [EVENT SPACE UPLOAD] ❌ ERRO: Nenhum arquivo recebido!');
      
      // Verificar se o multer registrou algum erro
      const multerError = (req as any).multerError;
      if (multerError) {
        console.log('📸 [EVENT SPACE UPLOAD] Multer error:', multerError);
      }

      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo enviado',
        debug: {
          hasFile: !!file,
          contentType: req.headers['content-type'],
          bodyKeys: Object.keys(req.body),
          files: !!req.files
        }
      });
    }

    // Verificar se o event space existe
    console.log('📸 [EVENT SPACE UPLOAD] Verificando existência do espaço:', eventSpaceId);
    const eventSpace = await db.query.eventSpaces.findFirst({
      where: eq(eventSpaces.id, eventSpaceId)
    });

    if (!eventSpace) {
      console.log('📸 [EVENT SPACE UPLOAD] ❌ Espaço não encontrado:', eventSpaceId);
      return res.status(404).json({ 
        success: false, 
        error: 'Event space não encontrado' 
      });
    }

    console.log('📸 [EVENT SPACE UPLOAD] ✅ Espaço encontrado:', eventSpace.name);

    const fileUrl = `/uploads/event-spaces/${file.filename}`;
    console.log('📸 [EVENT SPACE UPLOAD] URL do arquivo:', fileUrl);

    // Se for primary, remover primary de outras fotos
    if (is_primary === 'true' || is_primary === true) {
      console.log('📸 [EVENT SPACE UPLOAD] Definindo como foto principal, removendo outras principais...');
      await db
        .update(eventSpacePhotos)
        .set({ is_primary: false })
        .where(
          and(
            eq(eventSpacePhotos.event_space_id, eventSpaceId),
            isNull(eventSpacePhotos.deleted_at)
          )
        );
    }

    // Inserir no banco
    console.log('📸 [EVENT SPACE UPLOAD] Inserindo foto no banco...');
    const [newPhoto] = await db
      .insert(eventSpacePhotos)
      .values({
        event_space_id: eventSpaceId,
        url: fileUrl,
        alt_text: alt_text || '',
        order: 0,
        is_featured: is_featured === 'true' || is_featured === true,
        is_primary: is_primary === 'true' || is_primary === true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();

    console.log('📸 [EVENT SPACE UPLOAD] ✅ Foto salva com ID:', newPhoto.id);
    console.log('📸 [EVENT SPACE UPLOAD] ===== FIM DO UPLOAD =====');

    return res.status(201).json({
      success: true,
      data: newPhoto,
      message: 'Foto enviada com sucesso'
    });

  } catch (error) {
    console.error('❌ [EVENT SPACE UPLOAD] Erro:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};

/**
 * Listar fotos de um event space
 */
export const getEventSpacePhotos = async (req: Request, res: Response) => {
  try {
    const { eventSpaceId } = req.params;
    console.log('📸 [getEventSpacePhotos] Buscando fotos para espaço:', eventSpaceId);

    const photos = await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.event_space_id, eventSpaceId),
          isNull(eventSpacePhotos.deleted_at)
        )
      )
      .orderBy(desc(eventSpacePhotos.is_primary), eventSpacePhotos.order);

    console.log('📸 [getEventSpacePhotos] Encontradas', photos.length, 'fotos');
    return res.json({
      success: true,
      data: photos
    });

  } catch (error) {
    console.error('❌ Erro ao listar fotos:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};

/**
 * Obter apenas fotos destacadas
 */
export const getFeaturedEventSpacePhotos = async (req: Request, res: Response) => {
  try {
    const { eventSpaceId } = req.params;
    console.log('📸 [getFeaturedEventSpacePhotos] Buscando fotos destacadas para espaço:', eventSpaceId);

    const photos = await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.event_space_id, eventSpaceId),
          eq(eventSpacePhotos.is_featured, true),
          isNull(eventSpacePhotos.deleted_at)
        )
      )
      .orderBy(desc(eventSpacePhotos.is_primary), eventSpacePhotos.order);

    console.log('📸 [getFeaturedEventSpacePhotos] Encontradas', photos.length, 'fotos destacadas');
    return res.json({
      success: true,
      data: photos
    });

  } catch (error) {
    console.error('❌ Erro ao listar fotos destacadas:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};

/**
 * Atualizar foto
 */
export const updateEventSpacePhoto = async (req: Request, res: Response) => {
  try {
    const { eventSpaceId, photoId } = req.params;
    const { is_featured, is_primary, alt_text } = req.body;

    console.log('📸 [updateEventSpacePhoto] Atualizando foto:', { eventSpaceId, photoId, is_featured, is_primary, alt_text });

    // Se for primary, remover primary de outras fotos
    if (is_primary === true) {
      console.log('📸 [updateEventSpacePhoto] Definindo como principal, removendo outras...');
      await db
        .update(eventSpacePhotos)
        .set({ is_primary: false })
        .where(
          and(
            eq(eventSpacePhotos.event_space_id, eventSpaceId),
            isNull(eventSpacePhotos.deleted_at)
          )
        );
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (is_primary !== undefined) updateData.is_primary = is_primary;
    if (alt_text !== undefined) updateData.alt_text = alt_text;

    // Atualizar a foto específica
    const [updatedPhoto] = await db
      .update(eventSpacePhotos)
      .set(updateData)
      .where(
        and(
          eq(eventSpacePhotos.id, photoId),
          eq(eventSpacePhotos.event_space_id, eventSpaceId)
        )
      )
      .returning();

    if (!updatedPhoto) {
      return res.status(404).json({ 
        success: false, 
        error: 'Foto não encontrada' 
      });
    }

    console.log('📸 [updateEventSpacePhoto] Foto atualizada com sucesso:', updatedPhoto.id);
    return res.json({
      success: true,
      data: updatedPhoto
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar foto:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};

/**
 * Deletar foto (soft delete)
 */
export const deleteEventSpacePhoto = async (req: Request, res: Response) => {
  try {
    const { eventSpaceId, photoId } = req.params;
    console.log('📸 [deleteEventSpacePhoto] Deletando foto:', { eventSpaceId, photoId });

    const [deletedPhoto] = await db
      .update(eventSpacePhotos)
      .set({
        deleted_at: new Date(),
        updated_at: new Date()
      })
      .where(
        and(
          eq(eventSpacePhotos.id, photoId),
          eq(eventSpacePhotos.event_space_id, eventSpaceId)
        )
      )
      .returning();

    if (!deletedPhoto) {
      return res.status(404).json({ 
        success: false, 
        error: 'Foto não encontrada' 
      });
    }

    // Opcional: deletar arquivo físico
    try {
      const filePath = path.join(__dirname, '../../../public', deletedPhoto.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('📸 [deleteEventSpacePhoto] Arquivo físico deletado:', filePath);
      }
    } catch (err) {
      console.error('⚠️ Erro ao deletar arquivo físico:', err);
    }

    console.log('📸 [deleteEventSpacePhoto] Foto deletada com sucesso');
    return res.json({
      success: true,
      message: 'Foto deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar foto:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};

/**
 * Reordenar fotos
 */
export const reorderEventSpacePhotos = async (req: Request, res: Response) => {
  try {
    const { eventSpaceId } = req.params;
    const { photoIds } = req.body;

    console.log('📸 [reorderEventSpacePhotos] Reordenando fotos:', { eventSpaceId, photoIds });

    if (!Array.isArray(photoIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'photoIds deve ser um array' 
      });
    }

    // Atualizar ordem de cada foto
    for (let i = 0; i < photoIds.length; i++) {
      await db
        .update(eventSpacePhotos)
        .set({ order: i + 1 })
        .where(
          and(
            eq(eventSpacePhotos.id, photoIds[i]),
            eq(eventSpacePhotos.event_space_id, eventSpaceId)
          )
        );
    }

    console.log('📸 [reorderEventSpacePhotos] Fotos reordenadas com sucesso');
    return res.json({
      success: true,
      message: 'Ordem atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao reordenar fotos:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};