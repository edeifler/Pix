import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLocation } from 'wouter';

interface CheckoutFormProps {
  planId: string;
}

const CheckoutForm = ({ planId }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-600 text-sm p-3 bg-red-50 rounded">
          {errorMessage}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Processando...' : 'Pagar Agora'}
      </button>
    </form>
  );
};

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
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
    const initializeStripe = async () => {
      try {
        // Get Stripe public key
        const keyResponse = await fetch('/api/stripe-public-key');
        const keyData = await keyResponse.json();
        
        if (!keyData.publicKey) {
          setError('Chave pública do Stripe não encontrada');
          setLoading(false);
          return;
        }

        // Initialize Stripe
        const stripe = loadStripe(keyData.publicKey);
        setStripePromise(stripe);

        // Create subscription
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
          setError('ClientSecret não retornado pelo servidor');
          setLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
        setLoading(false);

      } catch (err: any) {
        setError('Erro ao inicializar pagamento: ' + err.message);
        setLoading(false);
      }
    };

    initializeStripe();
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

  if (!stripePromise || !clientSecret) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            PixConcilia
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
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0570de',
                }
              },
              loader: 'auto'
            }}
          >
            <CheckoutForm planId={planId} />
          </Elements>

          <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
            <p>💳 Para teste: 4242 4242 4242 4242</p>
            <p>🔒 SSL Seguro • ✓ Stripe Verified • 🚫 Cancele a qualquer momento</p>
          </div>
        </div>
      </div>
    </div>
  );
}