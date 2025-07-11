import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowLeft, CheckCircle, TestTube } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutTestMode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleTestPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Salvar sucesso no localStorage
      localStorage.setItem('userSession', JSON.stringify({
        authenticated: true,
        timestamp: new Date().toISOString(),
        plan: planId,
        testMode: true,
        trialDays: 7
      }));
      
      toast({
        title: "Teste bem-sucedido!",
        description: "Redirecionando para o dashboard...",
      });
      
      setTimeout(() => {
        setLocation('/dashboard?payment=success&test=true');
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRealPayment = () => {
    // Redirecionar para checkout real
    setLocation(`/checkout?plan=${planId}`);
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
            Finalizar Assinatura
          </h2>
          <p className="text-gray-600">
            Escolha como deseja processar o pagamento
          </p>
        </div>

        {/* Plan Info */}
        <div className="p-6 bg-gray-50 rounded-lg mb-8">
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

        {/* Payment Options */}
        <div className="space-y-4">
          {/* Test Mode */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <TestTube className="h-5 w-5" />
                Modo Teste (Recomendado)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700 mb-4">
                Acesse todas as funcionalidades sem inserir cartão real. 
                Ideal para testar o sistema antes da compra.
              </p>
              <Button
                onClick={handleTestPayment}
                disabled={isProcessing}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isProcessing ? 'Processando...' : 'Acessar em Modo Teste'}
              </Button>
            </CardContent>
          </Card>

          {/* Real Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagamento Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Autorizar cartão e começar período de teste gratuito oficial.
                Será cobrado R$ 0,50 para validação.
              </p>
              <Button
                onClick={handleRealPayment}
                variant="outline"
                className="w-full"
              >
                Continuar com Cartão Real
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 text-xs text-gray-500">
          <p>💡 Recomendamos testar primeiro no modo teste para conhecer todas as funcionalidades</p>
        </div>
      </main>
    </div>
  );
}