import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

// Load Stripe
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripeKey) {
  throw new Error('Missing VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(stripeKey);

export default function CheckoutSimpleWorkingPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get plan from URL
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'professional';

  const planInfo = {
    'starter': { name: 'Plano 1 - Básico', price: 'R$ 49,90' },
    'professional': { name: 'Plano 2 - Pro', price: 'R$ 99,90' },
    'enterprise': { name: 'Plano 3 - Premium', price: 'R$ 189,90' }
  };

  const currentPlan = planInfo[planId as keyof typeof planInfo] || planInfo.professional;

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // Primeiro, fazer a requisição para criar o Payment Intent
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

      // Por enquanto, vamos simular o sucesso do pagamento
      console.log('Payment Intent criado com sucesso:', data);
      
      // Salvar sucesso no localStorage e redirecionar
      localStorage.setItem('userSession', JSON.stringify({
        authenticated: true,
        timestamp: new Date().toISOString(),
        plan: planId,
        paymentIntentId: data.paymentIntentId
      }));
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLocation('/dashboard?payment=success');

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Erro inesperado no checkout');
    } finally {
      setLoading(false);
    }
  };

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
              {currentPlan.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plano Selecionado */}
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-green-600">
                  {currentPlan.price}
                </span>
                <span className="text-gray-600">/mês</span>
              </div>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mb-4">
                7 dias gratuitos
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Upload de comprovantes PIX</li>
                <li>• Reconciliação automática</li>
                <li>• Relatórios detalhados</li>
                <li>• Suporte por WhatsApp</li>
              </ul>
            </div>

            {/* Informações do Pagamento */}
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Será cobrado apenas R$ 0,50 para autorizar seu cartão</p>
              <p>• Você terá 7 dias gratuitos para testar todas as funcionalidades</p>
              <p>• Após o período gratuito, será cobrado o valor mensal do plano</p>
              <p>• Você pode cancelar a qualquer momento</p>
            </div>

            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Botão de Checkout */}
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processando...' : 'Continuar para Pagamento'}
            </Button>

            {/* Botão Temporário para Testes */}
            <Button
              onClick={() => {
                localStorage.setItem('userSession', JSON.stringify({
                  authenticated: true,
                  timestamp: new Date().toISOString(),
                  plan: planId
                }));
                setLocation('/dashboard');
              }}
              variant="outline"
              className="w-full"
            >
              Entrar Sem Pagamento (Teste)
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}