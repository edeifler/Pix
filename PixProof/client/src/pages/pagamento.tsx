import { useState, useEffect } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CreditCard, ArrowLeft } from "lucide-react";

// Load Stripe safely
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const PagamentoForm = ({ planId }: { planId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento realizado!",
        description: "Sua conta será criada automaticamente.",
      });
    }

    setIsProcessing(false);
  };

  const planInfo = {
    basic: { name: 'Básico', price: 'R$ 49,90', consultations: '200' },
    professional: { name: 'Profissional', price: 'R$ 99,90', consultations: '500' },
    enterprise: { name: 'Premium', price: 'R$ 189,90', consultations: '1000+' }
  };

  const currentPlan = planInfo[planId as keyof typeof planInfo] || planInfo.professional;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-800 font-semibold">
            Plano {currentPlan.name} - {currentPlan.price}/mês
          </span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          ✅ 7 dias grátis incluídos • {currentPlan.consultations} consultas/mês
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-3 text-gray-800">Dados de Pagamento</h3>
        <PaymentElement />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || isProcessing}
      >
        <CreditCard className="h-5 w-5 mr-2" />
        {isProcessing ? 'Processando pagamento...' : `Assinar por ${currentPlan.price}/mês`}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          💳 Para teste: 4242 4242 4242 4242 (qualquer data futura)
        </p>
        <p className="text-xs text-gray-500">
          Pagamento seguro processado pelo Stripe
        </p>
      </div>
    </form>
  );
};

export default function Pagamento() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const planId = new URLSearchParams(window.location.search).get('plan') || 'professional';

  useEffect(() => {
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    const registrationData = pendingRegistration ? JSON.parse(pendingRegistration) : null;

    fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        planId: planId,
        registrationData: registrationData
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Error:', err);
      setLoading(false);
    });
  }, [planId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Configurando pagamento...</h3>
              <p className="text-sm text-gray-600 mt-2">Aguarde enquanto preparamos seu checkout</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Erro na configuração</h3>
              <p className="text-gray-600">
                {!stripePromise ? 'Chave do Stripe não configurada' : 'Não foi possível preparar o pagamento'}
              </p>
              <Button 
                onClick={() => window.location.href = '/signup'}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao cadastro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PixConcilia</h1>
          <p className="text-gray-600">Finalize sua assinatura</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Checkout Seguro</CardTitle>
            <p className="text-gray-600">Complete seu cadastro e comece a usar hoje mesmo</p>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PagamentoForm planId={planId} />
            </Elements>
            
            {/* Security footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  SSL Seguro
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Stripe Verified
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Cancele a qualquer momento
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}