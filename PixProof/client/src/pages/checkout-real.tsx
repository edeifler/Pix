import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowLeft, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Load Stripe
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripeKey) {
  throw new Error('Missing VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(stripeKey);

const CheckoutForm = ({ selectedPlan, clientSecret }: { selectedPlan: any, clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Success - this won't be reached due to redirect
      toast({
        title: "Cartão autorizado!",
        description: "Redirecionando para o dashboard...",
      });
      
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plano Selecionado */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{selectedPlan.name}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-green-600">
            {selectedPlan.price}
          </span>
          <span className="text-gray-600">/mês</span>
        </div>
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mb-4">
          7 dias gratuitos
        </div>
        <ul className="space-y-2">
          {selectedPlan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Formulário de Pagamento Stripe */}
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <PaymentElement />
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p>• Será cobrado apenas R$ 0,50 para autorizar seu cartão</p>
          <p>• Você terá 7 dias gratuitos para testar todas as funcionalidades</p>
          <p>• Após o período gratuito, será cobrado o valor mensal do plano</p>
          <p>• Você pode cancelar a qualquer momento</p>
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processando...' : 'Autorizar Cartão e Começar Teste Gratuito'}
        </Button>
      </div>
    </form>
  );
};

export default function CheckoutRealPage() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get plan from URL
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'professional';

  const planInfo = {
    'starter': { 
      name: 'Plano 1 - Básico', 
      price: 'R$ 49,90',
      features: ['Até 200 consultas por mês', 'Upload de comprovantes PIX', 'Reconciliação automática', 'Relatórios básicos', 'Suporte por email']
    },
    'professional': { 
      name: 'Plano 2 - Pro', 
      price: 'R$ 99,90',
      features: ['Até 500 consultas por mês', 'Upload de comprovantes PIX', 'Reconciliação automática', 'Relatórios avançados', 'Suporte prioritário', 'Análise de tendências']
    },
    'enterprise': { 
      name: 'Plano 3 - Premium', 
      price: 'R$ 189,90',
      features: ['Acima de 1000 consultas por mês', 'Upload de comprovantes PIX', 'Reconciliação automática', 'Relatórios completos', 'Suporte dedicado', 'Análise de tendências', 'Gestão de usuários']
    }
  };

  const selectedPlan = planInfo[planId as keyof typeof planInfo] || planInfo.professional;

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: planId,
            registrationData: JSON.parse(localStorage.getItem('pendingRegistration') || '{}')
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('Erro ao criar payment intent');
        }

        setClientSecret(data.clientSecret);
        
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Erro ao preparar checkout');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [planId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Preparando seu checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro no Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {error}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => setLocation('/signup-simple')} 
                className="w-full"
                variant="outline"
              >
                Voltar ao Cadastro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold">PixConcilia</h1>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/signup-simple')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Finalize sua assinatura
          </h2>
          <p className="text-gray-600">
            Autorize seu cartão e comece seu teste gratuito de 7 dias
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dados do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm selectedPlan={selectedPlan} clientSecret={clientSecret} />
              </Elements>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}