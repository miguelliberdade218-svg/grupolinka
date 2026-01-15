// src/types/chat.interfaces.ts

// ✅ Mensagem de chat
export interface ChatMessage {
  id: string;               // ID da mensagem
  sender_id: string;        // ID do remetente
  sender_name?: string;     // Nome do remetente (opcional para exibição)
  message: string;          // Conteúdo da mensagem
  created_at: string;       // Timestamp da criação
  read?: boolean;           // Indica se a mensagem foi lida
}

// ✅ Thread de chat
export interface ChatThread {
  thread_id: string;           // ID da thread
  participants: string[];      // IDs dos participantes
  messages: ChatMessage[];     // Lista de mensagens
  last_message?: ChatMessage;  // Última mensagem para exibição rápida
  updated_at?: string;         // Última atualização da thread
}

// ✅ Requisição para enviar mensagem
export interface SendMessageRequest {
  message: string;
}

// ✅ Resposta ao enviar mensagem
export interface SendMessageResponse {
  success: boolean;
  message?: ChatMessage;       // Mensagem recém-enviada
  error?: string;              // Mensagem de erro, se houver
}
