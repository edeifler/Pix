import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
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
      'Todas as funcionalidades do Básico',
      'Analytics avançados',
      'Reconciliação em lote',
      'API de integração',
      'Suporte prioritário'
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
      'Acima de 500 consultas/mês',
      'Todas as funcionalidades do Pro',
      'Relatórios personalizados',
      'Integração com ERP',
      'Suporte telefônico 24/7',
      'Gerente de conta dedicado'
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
    console.log('=== CHECKOUT FORM SUBMIT ===');
    console.log('Stripe loaded:', !!stripe);
    console.log('Elements loaded:', !!elements);
    setIsProcessing(true);

    if (!stripe || !elements) {
      console.log('Stripe or elements not loaded');
      setIsProcessing(false);
      return;
    }

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
        <ul className="space-y-2">
          {selectedPlan.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <PaymentElement />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || isProcessing}
      >
        <CreditCard className="h-5 w-5 mr-2" />
        {isProcessing ? 'Processando...' : 'Autorizar Cartão (R$ 0,50)'}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Apenas R$ 0,50 para autorizar o cartão</span>
        </p>
        <p className="text-xs text-gray-500">
          Após autorização, você terá <strong>7 dias gratuitos</strong> para testar todas as funcionalidades
        </p>
        <p className="text-xs text-gray-500">
          Pagamento seguro processado pelo Stripe • Cancele a qualquer momento
        </p>
      </div>
    </form>
  );
};

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('professional');
  const [clientSecret, setClientSecret] = useState("");

  // Get plan from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = urlParams.get('plan');
    if (planFromUrl && plans.find(p => p.id === planFromUrl)) {
      setSelectedPlanId(planFromUrl);
    }
  }, []);

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
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Checkout" showCompanyName={false} />
        <div className="max-w-2xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Checkout error details:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Checkout" showCompanyName={false} />
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Erro no Checkout</h2>
                <p className="text-gray-600 mb-4">
                  Não foi possível processar sua solicitação. Tente novamente.
                </p>
                <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-100 rounded">
                  Detalhes do erro: {error.message}
                </div>
                <Button onClick={() => setLocation('/signup-simple')} variant="outline">
                  Voltar aos Planos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Checkout" showCompanyName={false} />
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Configurando pagamento...</h3>
                <p className="text-gray-600 mb-4">
                  Preparando sua assinatura {selectedPlan.name}
                </p>
                {paymentData && (
                  <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                    Debug: {JSON.stringify(paymentData, null, 2)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Checkout" showCompanyName={false} />
      
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/signup-simple')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos planos
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Finalizar Assinatura
          </h1>
          <p className="text-gray-600">
            Complete seu pagamento para ativar sua conta PixConcilia
          </p>
        </div>

        {/* Plan Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Escolha seu plano</CardTitle>
            <CardDescription>
              Você pode trocar de plano a qualquer momento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPlanId === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-sm text-gray-600">
                        {plan.consultations} consultas/mês
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-sm text-gray-500">por mês</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Informações de Pagamento
            </CardTitle>
            <CardDescription>
              Seus dados são protegidos com criptografia SSL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#059669',
                  }
                }
              }}
            >
              <CheckoutForm selectedPlan={selectedPlan} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}