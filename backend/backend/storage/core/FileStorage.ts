import { Storage } from '@google-cloud/storage';
import path from 'path';
import { 
  DocumentType 
} from '../../src/shared/types';
import type { 
  VehicleDocType, 
  Document, 
  FileUploadResult 
} from '../types';

export interface IFileStorage {
  // Document uploads
  uploadDocument(file: File | Buffer, userId: string, type: DocumentType, filename: string): Promise<FileUploadResult>;
  deleteDocument(documentUrl: string): Promise<void>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  
  // Profile photos
  uploadProfilePhoto(file: File | Buffer, userId: string, filename: string): Promise<FileUploadResult>;
  
  // Vehicle documents (for drivers)
  uploadVehicleDocument(file: File | Buffer, driverId: string, type: VehicleDocType, filename: string): Promise<FileUploadResult>;
  
  // Accommodation photos (for hotels)
  uploadAccommodationPhoto(file: File | Buffer, accommodationId: string, filename: string): Promise<FileUploadResult>;
  
  // Generic file operations
  uploadFile(file: File | Buffer, folder: string, filename: string): Promise<FileUploadResult>;
  deleteFile(fileUrl: string): Promise<void>;
  getFileUrl(filepath: string): string;
}

export class GoogleCloudFileStorage implements IFileStorage {
  private storage: Storage;
  private bucketName: string;
  private baseUrl: string;

  constructor() {
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'link-a-storage';
    this.baseUrl = `https://storage.googleapis.com/${this.bucketName}`;
    
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key
    });
  }

  // ===== DOCUMENT UPLOADS =====
  
  async uploadDocument(file: File | Buffer, userId: string, type: DocumentType, filename: string): Promise<FileUploadResult> {
    try {
      const folder = `documents/${userId}/${type}`;
      return this.uploadFile(file, folder, filename);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async deleteDocument(documentUrl: string): Promise<void> {
    try {
      await this.deleteFile(documentUrl);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    try {
      // TODO: Implement when documents table is created
      // This would query the database for documents belonging to the user
      return [];
    } catch (error) {
      console.error('Error fetching user documents:', error);
      return [];
    }
  }

  // ===== PROFILE PHOTOS =====
  
  async uploadProfilePhoto(file: File | Buffer, userId: string, filename: string): Promise<FileUploadResult> {
    try {
      const folder = `profiles/${userId}`;
      return this.uploadFile(file, folder, filename);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo');
    }
  }

  // ===== VEHICLE DOCUMENTS =====
  
  async uploadVehicleDocument(file: File | Buffer, driverId: string, type: VehicleDocType, filename: string): Promise<FileUploadResult> {
    try {
      const folder = `vehicles/${driverId}/${type}`;
      return this.uploadFile(file, folder, filename);
    } catch (error) {
      console.error('Error uploading vehicle document:', error);
      throw new Error('Failed to upload vehicle document');
    }
  }

  // ===== ACCOMMODATION PHOTOS =====
  
  async uploadAccommodationPhoto(file: File | Buffer, accommodationId: string, filename: string): Promise<FileUploadResult> {
    try {
      const folder = `accommodations/${accommodationId}`;
      return this.uploadFile(file, folder, filename);
    } catch (error) {
      console.error('Error uploading accommodation photo:', error);
      throw new Error('Failed to upload accommodation photo');
    }
  }

  // ===== GENERIC FILE OPERATIONS =====
  
  async uploadFile(file: File | Buffer, folder: string, filename: string): Promise<FileUploadResult> {
    try {
      const timestamp = Date.now();
      const safeFilename = this.sanitizeFilename(filename);
      const uniqueFilename = `${timestamp}_${safeFilename}`;
      const filepath = `${folder}/${uniqueFilename}`;

      const bucket = this.storage.bucket(this.bucketName);
      const fileObj = bucket.file(filepath);

      // Convert File to Buffer if necessary
      let buffer: Buffer;
      if (file instanceof Buffer) {
        buffer = file;
      } else {
        // Handle File object (from browser)
        buffer = Buffer.from(await (file as any).arrayBuffer());
      }

      // Upload the file
      await fileObj.save(buffer, {
        metadata: {
          contentType: this.getMimeType(filename),
        },
        public: true, // Make file publicly accessible
      });

      const url = this.getFileUrl(filepath);
      
      return {
        url,
        filename: uniqueFilename,
        size: buffer.length,
        mimeType: this.getMimeType(filename),
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filepath from URL
      const filepath = fileUrl.replace(this.baseUrl + '/', '');
      
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filepath);
      
      await file.delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  getFileUrl(filepath: string): string {
    return `${this.baseUrl}/${filepath}`;
  }

  // ===== UTILITY METHODS =====
  
  private sanitizeFilename(filename: string): string {
    // Remove special characters and spaces
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // ===== FILE VALIDATION =====
  
  validateFile(file: File | Buffer, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
    try {
      let size: number;
      let detectedType: string = 'application/octet-stream';

      if (file instanceof Buffer) {
        size = file.length;
        detectedType = 'application/octet-stream';
      } else {
        size = (file as any).size;
        detectedType = (file as any).type || 'application/octet-stream';
      }

      if (size > maxSize) {
        return { 
          valid: false, 
          error: `Tamanho do ficheiro excede o limite de ${this.formatBytes(maxSize)}` 
        };
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(detectedType)) {
        return { 
          valid: false, 
          error: `Tipo de ficheiro ${detectedType} não é permitido. Tipos aceites: ${allowedTypes.join(', ')}` 
        };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Ficheiro inválido ou corrompido' 
      };
    }
  }

  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Fallback local file storage for development
export class LocalFileStorage implements IFileStorage {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    this.baseDir = process.env.LOCAL_STORAGE_DIR || './uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  }

  async uploadDocument(file: File | Buffer, userId: string, type: DocumentType, filename: string): Promise<FileUploadResult> {
    const folder = `documents/${userId}/${type}`;
    return this.uploadFile(file, folder, filename);
  }

  async deleteDocument(documentUrl: string): Promise<void> {
    return this.deleteFile(documentUrl);
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return [];
  }

  async uploadProfilePhoto(file: File | Buffer, userId: string, filename: string): Promise<FileUploadResult> {
    const folder = `profiles/${userId}`;
    return this.uploadFile(file, folder, filename);
  }

  async uploadVehicleDocument(file: File | Buffer, driverId: string, type: VehicleDocType, filename: string): Promise<FileUploadResult> {
    const folder = `vehicles/${driverId}/${type}`;
    return this.uploadFile(file, folder, filename);
  }

  async uploadAccommodationPhoto(file: File | Buffer, accommodationId: string, filename: string): Promise<FileUploadResult> {
    const folder = `accommodations/${accommodationId}`;
    return this.uploadFile(file, folder, filename);
  }

  async uploadFile(file: File | Buffer, folder: string, filename: string): Promise<FileUploadResult> {
    // Simple mock implementation for development
    const url = `${this.baseUrl}/uploads/${folder}/${filename}`;
    
    return {
      url,
      filename,
      size: file instanceof Buffer ? file.length : (file as any).size,
      mimeType: 'application/octet-stream',
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    console.log('Local file deleted:', fileUrl);
  }

  getFileUrl(filepath: string): string {
    return `${this.baseUrl}/uploads/${filepath}`;
  }
}

// Export storage instance based on environment
export const fileStorage = process.env.NODE_ENV === 'production' 
  ? new GoogleCloudFileStorage() 
  : new LocalFileStorage();