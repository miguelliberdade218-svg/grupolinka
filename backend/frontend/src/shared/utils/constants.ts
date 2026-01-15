// Configurações dos domínios para produção e desenvolvimento
export const APP_DOMAINS = {
  development: {
    client: 'http://localhost:8000',
    driver: 'http://localhost:8000/api/driver', 
    hotel: 'http://localhost:8000/api/hotels',
    event: 'http://localhost:8000/api/events',
    admin: 'http://localhost:8000/api/admin/system',
    api: 'http://localhost:8000/api' // ✅ CORRIGIDO - adicionado http://
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