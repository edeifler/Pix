// Configuração de produção do Stripe para PixConcilia
// Chaves reais de produção fornecidas pelo usuário

module.exports = {
  // Chaves do Stripe (PRODUÇÃO)
  STRIPE_PUBLIC_KEY_LIVE: '',
  STRIPE_SECRET_KEY_LIVE: '',
  
  // Price IDs dos produtos (PRODUÇÃO)
  PRICE_IDS: {
    starter: '',      // Plano 1 - R$ 49,90/mês
    professional: '', // Plano 2 - R$ 99,90/mês  
    enterprise: ''    // Plano 3 - R$ 189,90/mês
  },
  
  // Product IDs (para referência)
  PRODUCT_IDS: {
    starter: '',     // Plano 1
    professional: '', // Plano 2
    enterprise: ''    // Plano 3
  },
  
  // Configurações de trial
  TRIAL_DAYS: 7, // 7 dias grátis para todos os planos
  
  // Configurações de moeda
  CURRENCY: 'brl', // Real brasileiro
  
  // Webhook endpoints (para configurar no Stripe Dashboard)
  WEBHOOK_ENDPOINTS: [
    '',
    'e' // fallback
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
