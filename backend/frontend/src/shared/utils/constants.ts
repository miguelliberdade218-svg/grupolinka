// Configurações dos domínios para produção e desenvolvimento
export const APP_DOMAINS = {
  development: {
    client: 'http://localhost:5000', // ✅ CORRIGIDO: Frontend Vite na porta 5000
    driver: 'http://localhost:5000/drivers', // ✅ CORRIGIDO: App de motoristas
    hotel: 'http://localhost:5000/hotels-app', // ✅ CORRIGIDO: App de gestores
    event: 'http://localhost:5000', // Eventos na main-app
    admin: 'http://localhost:5000/admin', // Admin app
    api: 'http://localhost:8000/api' // Backend na porta 8000
  },
  production: {
    client: 'https://link-aturismomoz.com',
    driver: 'https://driver.link-aturismomoz.com',
    hotel: 'https://hotel.link-aturismomoz.com', 
    event: 'https://event.link-aturismomoz.com',
    admin: 'https://admin.link-aturismomoz.com',
    api: 'https://api.link-aturismomoz.com'
  }
};

export const getCurrentDomains = () => {
  return process.env.NODE_ENV === 'production' 
    ? APP_DOMAINS.production 
    : APP_DOMAINS.development;
};

// Role mappings
export const ROLE_APP_MAPPING = {
  client: 'client',
  driver: 'driver', 
  hotel: 'hotel',
  event: 'event',
  admin: 'admin'
} as const;

// API endpoints base
export const API_BASE_URL = getCurrentDomains().api;