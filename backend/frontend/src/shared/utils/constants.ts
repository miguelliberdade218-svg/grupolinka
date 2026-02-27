// Configurações dos domínios para produção e desenvolvimento
export const APP_DOMAINS = {
  development: {
    // ✅ USAR PORTAS DINÂMICAS baseadas no origin atual
    get client() { return window.location.origin; },
    get driver() { return `${window.location.origin}/drivers`; },
    get hotel() { return `${window.location.origin}/hotels-app`; },
    get event() { return window.location.origin; },
    get admin() { return `${window.location.origin}/admin`; },
    api: 'http://localhost:8000/api'
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
  // Em desenvolvimento, usar domínios dinâmicos
  if (process.env.NODE_ENV === 'production') {
    return APP_DOMAINS.production;
  }
  
  // Em desenvolvimento, criar novo objeto com getters
  return {
    get client() { return window.location.origin; },
    get driver() { return `${window.location.origin}/drivers`; },
    get hotel() { return `${window.location.origin}/hotels-app`; },
    get event() { return window.location.origin; },
    get admin() { return `${window.location.origin}/admin`; },
    api: 'http://localhost:8000/api'
  };
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