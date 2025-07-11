import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

// Load Stripe outside of component render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  consultations: number;
  features: string[];
  stripePriceId?: string;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Plano 1 - Básico',
    price: 49.90,
    period: 'mês',
    consultations: 200,
    stripePriceId: 'price_1RgVDiJwOqHr1g8bJAelMXbn',
    features: [
      'Até 200 consultas por mês',
      'Upload de comprovantes PIX',
      'Reconciliação automática',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'professional',
    name: 'Plano 2 - Pro',
    price: 99.90,
    period: 'mês',
    consultations: 500,
    stripePriceId: 'price_1RgVFTJwOqHr1g8bVqX7c3Td',
    features: [
      'Até 500 consultas por mês',
      'Upload de comprovantes PIX',
      'Reconciliação automática',
      'Relatórios avançados',
      'Suporte prioritário',
      'Análise de tendências'
    ]
  },
  {
    id: 'enterprise',
    name: 'Plano 3 - Premium',
    price: 189.90,
    period: 'mês',
    consultations: 1000,
    stripePriceId: 'price_1RgVGlJwOqHr1g8bHcUaIIGS',
    features: [
      'Acima de 1000 consultas por mês',
      'Upload de comprovantes PIX',
      'Reconciliação automática',
      'Relatórios completos',
      'Suporte dedicado',
      'Análise de tendências',
      'Gestão de usuários'
    ]
  }
];

const CheckoutForm = ({ selectedPlan }: { selectedPlan: Plan }) => {
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
      console.log('Attempting to confirm payment...');
      // Confirm payment requiring user card input
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        toast({
          title: "Erro no pagamento",
          description: paymentError.message,
          variant: "destructive",
        });
        return;
      }

      // Success
      toast({
        title: "Cartão autorizado!",
        description: "Agora você tem 7 dias gratuitos para testar todas as funcionalidades!",
      });
      
      // Save user session data
      localStorage.setItem('userSession', JSON.stringify({
        authenticated: true,
        timestamp: new Date().toISOString()
      }));
      
      setLocation('/dashboard');
    } catch (error: any) {
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
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{selectedPlan.name}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-green-600">
            R$ {selectedPlan.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-gray-600">/{selectedPlan.period}</span>
        </div>
        <Badge variant="secondary" className="mb-4">
          7 dias gratuitos
        </Badge>
        <ul className="space-y-2">
          {selectedPlan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <PaymentElement />
        </div>

        <div className="text-xs text-gray-600">
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

export default function CheckoutWorkingPage() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState('');
  
  // Get selected plan from URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlanId = urlParams.get('plan') || 'professional';
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  // Create subscription payment intent
  const { data: paymentData, isLoading, error } = useQuery({
    queryKey: ['/api/create-subscription', selectedPlanId],
    queryFn: async () => {
      try {
        // Get pending registration data from localStorage
        const pendingRegistration = localStorage.getItem('pendingRegistration');
        const registrationData = pendingRegistration ? JSON.parse(pendingRegistration) : null;
        
        console.log('Creating subscription for plan:', selectedPlanId, 'with data:', registrationData);
        
        const response = await apiRequest('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            planId: selectedPlanId,
            priceId: selectedPlan.stripePriceId,
            registrationData: registrationData
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Subscription creation failed:', response.status, errorData);
          throw new Error(`Erro ${response.status}: ${errorData}`);
        }
        
        const data = await response.json();
        console.log('Subscription created successfully:', data);
        return data;
      } catch (err) {
        console.error('Error in subscription creation:', err);
        throw err;
      }
    },
    retry: false,
  });

  useEffect(() => {
    console.log('Payment data received:', paymentData);
    if (paymentData?.clientSecret) {
      console.log('Setting client secret:', paymentData.clientSecret);
      setClientSecret(paymentData.clientSecret);
    } else if (paymentData) {
      console.log('Payment data exists but no clientSecret:', paymentData);
    }
  }, [paymentData]);

  if (isLoading) {
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
    console.error('Checkout error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro no Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Erro: {error?.message || "Ocorreu um erro ao preparar o checkout. Tente novamente."}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="default"
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

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando checkout...</p>
        </div>
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
            <CardDescription>
              Seus dados são protegidos com criptografia SSL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm selectedPlan={selectedPlan} />
            </Elements>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}