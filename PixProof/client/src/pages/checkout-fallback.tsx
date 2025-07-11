import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

const plans = {
  starter: { name: "Plano 1 - Básico", price: "R$ 49,90", limit: "200 consultas" },
  professional: { name: "Plano 2 - Pro", price: "R$ 99,90", limit: "500 consultas" },
  enterprise: { name: "Plano 3 - Premium", price: "R$ 189,90", limit: "1000 consultas" }
};

export default function CheckoutFallback() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Get plan from URL
    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = urlParams.get('plan');
    if (planFromUrl && plans[planFromUrl as keyof typeof plans]) {
      setSelectedPlan(planFromUrl);
    }
  }, []);

  const handleSimulatePayment = () => {
    setIsRedirecting(true);
    
    // Save session data
    const sessionData = {
      authenticated: true,
      plan: selectedPlan,
      timestamp: new Date().toISOString(),
      paymentSimulated: true
    };
    
    localStorage.setItem('userSession', JSON.stringify(sessionData));
    
    // Simulate payment processing
    setTimeout(() => {
      // Use window.location for more reliable redirect on production domains
      window.location.href = '/dashboard?payment=success';
    }, 2000);
  };

  const currentPlan = plans[selectedPlan as keyof typeof plans];

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
              className="flex items-center gap-2"
              onClick={() => window.history.back()}
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
            Finalizar Assinatura
          </h2>
          <p className="text-gray-600">
            Complete sua assinatura para acessar todas as funcionalidades
          </p>
        </div>

        {/* Plan Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Plano Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan?.name}</h3>
                  <p className="text-gray-600">{currentPlan?.limit}/mês</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{currentPlan?.price}</p>
                  <p className="text-sm text-gray-500">/mês</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">7 dias gratuitos</h4>
                  <p className="text-green-700 text-sm mt-1">
                    Teste todas as funcionalidades por 7 dias. Cancele a qualquer momento.
                    Cobrança automática apenas após o período gratuito.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fallback Payment Method */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {isRedirecting ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Processando pagamento...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Modo de Teste</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Esta é uma demonstração. Em produção, aqui seria exibido o formulário de cartão de crédito.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSimulatePayment}
                  className="w-full py-3 text-lg"
                  disabled={isRedirecting}
                >
                  {isRedirecting ? 'Processando...' : 'Iniciar Período Gratuito'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Seguro e protegido por criptografia SSL</p>
          <p className="mt-1">Cancele sua assinatura a qualquer momento</p>
        </div>
      </main>
    </div>
  );
}