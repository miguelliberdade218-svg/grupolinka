// src/types/uploads.interfaces.ts

// ====================== UPLOAD RESPONSE ======================
export interface UploadResponse {
  success: boolean;         // Indica se o upload foi bem-sucedido
  url?: string;             // URL do arquivo enviado (quando sucesso)
  filename?: string;        // Nome do arquivo enviado
  size?: number;            // Tamanho do arquivo em bytes
  type?: string;            // Tipo MIME do arquivo
  error?: string;           // Mensagem de erro, caso falhe
}
