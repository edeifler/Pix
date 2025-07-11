// Configuração do domínio personalizado para PixConcilia
module.exports = {
  // Domínio principal em produção
  PRODUCTION_DOMAIN: 'www.pixconcilia.com.br',
  
  // Domínio de desenvolvimento (Replit)
  DEVELOPMENT_DOMAIN: process.env.REPLIT_DEV_DOMAIN || 'localhost:5000',
  
  // URL base para redirects
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://www.pixconcilia.com.br'
    : `http://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`,
    
  // Configurações de CORS para domínio personalizado
  ALLOWED_ORIGINS: [
    'https://www.pixconcilia.com.br',
    'https://pixconcilia.com.br',
    'http://localhost:5000',
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null
  ].filter(Boolean)
};