import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

function CheckoutForm({ planInfo }: { planInfo: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Erro no pagamento");
      } else {
        setMessage("Ocorreu um erro inesperado.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Finalizar Assinatura - {planInfo.name}
          </CardTitle>
          <p className="text-center text-gray-600">
            {planInfo.price}/mês • 7 dias grátis
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            
            {message && (
              <div className="text-red-600 text-sm text-center">
                {message}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !stripe || !elements}
            >
              {loading ? "Processando..." : `Assinar ${planInfo.name}`}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Teste gratuito de 7 dias. Cancele a qualquer momento.
              Cobrança automática após o período de teste.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutFixed() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const planId = new URLSearchParams(window.location.search).get('plan') || 'professional';
  
  const planInfo = {
    basic: { name: 'Básico', price: 'R$ 49,90', amount: 4990 },
    professional: { name: 'Profissional', price: 'R$ 99,90', amount: 9990 },
    enterprise: { name: 'Premium', price: 'R$ 189,90', amount: 18990 }
  };

  const currentPlan = planInfo[planId as keyof typeof planInfo] || planInfo.professional;

  useEffect(() => {
    // Criar PaymentIntent no servidor
    fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        planId: planId,
        amount: currentPlan.amount 
      })
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        setError(data.error);
      } else if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError('Não foi possível obter clientSecret do servidor');
      }
      setLoading(false);
    })
    .catch((err) => {
      setError('Erro ao inicializar pagamento: ' + err.message);
      setLoading(false);
    });
  }, [planId, currentPlan.amount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Carregando pagamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">❌</div>
              <h3 className="font-semibold text-lg mb-2">Erro no Pagamento</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm planInfo={currentPlan} />
    </Elements>
  );
}