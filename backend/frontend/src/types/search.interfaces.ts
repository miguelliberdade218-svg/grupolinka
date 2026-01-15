// src/types/search.interfaces.ts
import { Hotel } from "./hotels.interfaces";

// ====================== SEARCH PARAMETERS ======================
export interface SearchParams {
  location?: string;       // Cidade, bairro ou região
  checkIn?: string;        // Data de check-in (ISO string)
  checkOut?: string;       // Data de check-out (ISO string)
  guests?: number;         // Número de hóspedes
  roomType?: string;       // Tipo de quarto selecionado
  maxPrice?: number;       // Preço máximo por noite
  amenities?: string[];    // Amenidades desejadas
  radius?: number;         // Raio de busca em km
  limit?: number;          // Número máximo de resultados
  sortBy?: "price" | "rating" | "distance" | "match_score"; // Ordenação opcional
  page?: number;           // Paginação
}

// ====================== SEARCH RESPONSE ======================
export interface SearchResponse {
  success: boolean;
  data: Hotel[];           // Lista de hotéis retornados
  count: number;           // Total de resultados encontrados
  filters?: SearchParams;  // Parâmetros usados na busca
  available?: number;      // Total de hotéis com disponibilidade
  minPrice?: number;       // Preço mínimo encontrado
  maxPrice?: number;       // Preço máximo encontrado
}
