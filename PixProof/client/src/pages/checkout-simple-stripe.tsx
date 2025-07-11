import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLocation } from 'wouter';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ planId }: { planId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Erro no pagamento');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage('Erro ao processar pagamento: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
      </button>
    </form>
  );
};

export default function CheckoutSimpleStripePage() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Get plan from URL
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'professional';

  const planInfo = {
    'basic': { name: 'Básico', price: 'R$ 49,90', amount: 4990 },
    'professional': { name: 'Profissional', price: 'R$ 99,90', amount: 9990 },
    'enterprise': { name: 'Premium', price: 'R$ 189,90', amount: 18990 }
  };

  const currentPlan = planInfo[planId as keyof typeof planInfo] || planInfo.professional;

  useEffect(() => {
    const initializePayment = async () => {
      try {
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

        setClientSecret(data.clientSecret);
        setLoading(false);

      } catch (err: any) {
        setError('Erro ao carregar sistema de pagamento');
        setLoading(false);
      }
    };

    initializePayment();
  }, [planId, currentPlan.amount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
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
          </div>

          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: { 
                theme: 'stripe' as const,
              }
            }}
          >
            <CheckoutForm planId={planId} />
          </Elements>

          <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
            <p>💳 Para teste: 4242 4242 4242 4242</p>
            <p>🔒 SSL Seguro • ✓ Stripe Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
}