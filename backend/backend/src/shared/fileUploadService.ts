// src/shared/fileUploadService.ts
// Serviço para upload local de arquivos

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  userId: string;
  fileType: 'profile' | 'document' | 'vehicle';
  fileName: string;
  buffer: Buffer;
  mimeType: string;
}

export class FileUploadService {
  private uploadsDir: string;

  constructor() {
    // Diretório base para uploads
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  private async ensureUserDir(userId: string, fileType: string): Promise<string> {
    const userDir = path.join(this.uploadsDir, userId, fileType);
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
  }

  // Validar tipos de arquivo permitidos
  private validateFileType(mimeType: string, fileType: string): boolean {
    const allowedTypes: Record<string, string[]> = {
      profile: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
      document: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      vehicle: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    };

    return allowedTypes[fileType]?.includes(mimeType) || false;
  }

  // Validar tamanho do arquivo (max 10MB)
  private validateFileSize(buffer: Buffer): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return buffer.length <= maxSize;
  }

  async uploadFile(options: UploadOptions): Promise<{ url: string; path: string }> {
    const { userId, fileType, fileName, buffer, mimeType } = options;

    // Validar arquivo
    if (!this.validateFileType(mimeType, fileType)) {
      throw new Error(`Tipo de arquivo não permitido para ${fileType}. Tipos permitidos: ${{
        profile: 'JPEG, PNG, GIF',
        document: 'JPEG, PNG, PDF',
        vehicle: 'JPEG, PNG, PDF'
      }[fileType]}`);
    }

    if (!this.validateFileSize(buffer)) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
    }

    // Criar diretório do usuário
    const userDir = await this.ensureUserDir(userId, fileType);
    
    // Gerar nome único para o arquivo
    const fileExt = path.extname(fileName) || this.getExtensionFromMime(mimeType);
    const uniqueFileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(userDir, uniqueFileName);
    
    // Salvar arquivo
    await fs.writeFile(filePath, buffer);
    
    // Retornar URL relativa
    const relativePath = path.relative(process.cwd(), filePath);
    const url = `/uploads/${userId}/${fileType}/${uniqueFileName}`;
    
    return { url, path: relativePath };
  }

  private getExtensionFromMime(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
    };
    
    return extensions[mimeType] || '.bin';
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Erro ao deletar arquivo:', error);
    }
  }

  async getUserFiles(userId: string, fileType?: string): Promise<string[]> {
    const userBaseDir = path.join(this.uploadsDir, userId);
    
    try {
      await fs.access(userBaseDir);
    } catch {
      return [];
    }

    if (fileType) {
      const typeDir = path.join(userBaseDir, fileType);
      try {
        await fs.access(typeDir);
        const files = await fs.readdir(typeDir);
        return files.map(file => `/uploads/${userId}/${fileType}/${file}`);
      } catch {
        return [];
      }
    }

    // Listar todos os arquivos do usuário
    const allFiles: string[] = [];
    const types = await fs.readdir(userBaseDir);
    
    for (const type of types) {
      const typeDir = path.join(userBaseDir, type);
      const stats = await fs.stat(typeDir);
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(typeDir);
        files.forEach(file => {
          allFiles.push(`/uploads/${userId}/${type}/${file}`);
        });
      }
    }

    return allFiles;
  }
}

// Export singleton
export const fileUploadService = new FileUploadService();