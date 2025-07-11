// Configuração de produção do Stripe para PixConcilia
// Chaves reais de produção fornecidas pelo usuário

module.exports = {
  // Chaves do Stripe (PRODUÇÃO)
  STRIPE_PUBLIC_KEY_LIVE: 'pk_live_51RdDdOJwOqHr1g8btfbxUTHSeWNVyrR1Ogi0T7CWAnYFgTgunK66LRh9602VHpdGtOu8rJML2eOSCCaGeo9VlBDb00z1DIme1l',
  STRIPE_SECRET_KEY_LIVE: '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',
  
  // Price IDs dos produtos (PRODUÇÃO)
  PRICE_IDS: {
    starter: 'price_1RgVDiJwOqHr1g8bJAelMXbn',      // Plano 1 - R$ 49,90/mês
    professional: 'price_1RgVFTJwOqHr1g8bVqX7c3Td', // Plano 2 - R$ 99,90/mês  
    enterprise: 'price_1RgVGlJwOqHr1g8bHcUaIIGS'    // Plano 3 - R$ 189,90/mês
  },
  
  // Product IDs (para referência)
  PRODUCT_IDS: {
    starter: 'prod_SbifSo9nqYxFoB',     // Plano 1
    professional: 'prod_Sbig1wOzshTNhu', // Plano 2
    enterprise: 'prod_SbiihuNfvl8E6u'    // Plano 3
  },
  
  // Configurações de trial
  TRIAL_DAYS: 7, // 7 dias grátis para todos os planos
  
  // Configurações de moeda
  CURRENCY: 'brl', // Real brasileiro
  
  // Webhook endpoints (para configurar no Stripe Dashboard)
  WEBHOOK_ENDPOINTS: [
    'https://www.pixconcilia.com.br/api/webhooks/stripe',
    'https://pix-proof-joselsolucoesfi.replit.app/api/webhooks/stripe' // fallback
  ]
};

// Validação das chaves
const config = module.exports;
if (!config.STRIPE_PUBLIC_KEY_LIVE || !config.STRIPE_SECRET_KEY_LIVE) {
  console.warn('⚠️ Chaves do Stripe não configuradas corretamente');
}

console.log('✅ Configuração de produção do Stripe carregada');
console.log('🔑 Chave pública:', config.STRIPE_PUBLIC_KEY_LIVE.substring(0, 20) + '...');
console.log('💰 Planos configurados:', Object.keys(config.PRICE_IDS).length);