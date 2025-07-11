import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CheckoutMinimalPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Get plan from URL
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'professional';

  const planInfo = {
    'starter': { name: 'Básico', price: 'R$ 49,90', amount: 4990 },
    'professional': { name: 'Profissional', price: 'R$ 99,90', amount: 9990 },
    'enterprise': { name: 'Premium', price: 'R$ 189,90', amount: 18990 }
  };

  const currentPlan = planInfo[planId as keyof typeof planInfo] || planInfo.professional;

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Create subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: planId,
          amount: currentPlan.amount
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!data.clientSecret) {
        setError('Erro na configuração do pagamento');
        setLoading(false);
        return;
      }

      // Step 2: Redirect to Stripe Checkout using Payment Link
      const stripe = await stripePromise;
      if (!stripe) {
        setError('Erro ao carregar Stripe');
        setLoading(false);
        return;
      }

      // For now, simulate successful payment for demo
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }, 2000);

    } catch (err: any) {
      setError('Erro ao processar pagamento: ' + err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h2>
          <p className="text-gray-600 mb-4">
            Plano {currentPlan.name} ativado com sucesso.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para o dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            PixConcilia - Checkout
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">
              Plano {currentPlan.name}: {currentPlan.price}/mês
            </h3>
            <p className="text-green-600 text-sm">✅ 7 dias grátis incluídos</p>
            <p className="text-gray-600 text-sm mt-2">
              • Acesso completo a todas as funcionalidades
            </p>
            <p className="text-gray-600 text-sm">
              • Cancele a qualquer momento
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processando...
              </div>
            ) : (
              `Assinar ${currentPlan.name} - ${currentPlan.price}/mês`
            )}
          </button>

          <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
            <p>🔒 Pagamento 100% Seguro</p>
            <p>💳 Aceita todos os cartões</p>
            <p>✓ SSL Verificado</p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm text-center">
              <strong>Demo Mode:</strong> Esta é uma demonstração. 
              O pagamento será simulado para fins de teste.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}