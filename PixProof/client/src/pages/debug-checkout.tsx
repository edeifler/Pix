import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function DebugCheckout() {
  const [, setLocation] = useLocation();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Debug information
    const info = {
      url: window.location.href,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      localStorage: {
        pendingRegistration: localStorage.getItem('pendingRegistration'),
        userSession: localStorage.getItem('userSession')
      }
    };
    setDebugInfo(info);
    setIsLoaded(true);
    console.log('Debug Checkout - Environment Info:', info);
  }, []);

  const goToDashboard = () => {
    // Set demo session
    localStorage.setItem('userSession', JSON.stringify({
      authenticated: true,
      timestamp: new Date().toISOString(),
      plan: 'professional',
      testMode: true
    }));
    setLocation('/dashboard');
  };

  const goToTestCheckout = () => {
    setLocation('/checkout');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
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
              <h1 className="text-xl font-semibold">PixConcilia - Debug</h1>
            </div>
            <Link href="/signup-simple">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Diagnóstico do Sistema
          </h2>
          <p className="text-gray-600">
            Informações para identificar problemas no domínio real
          </p>
        </div>

        {/* Environment Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Informações do Ambiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso Direto ao Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Pular o checkout e ir direto para o dashboard (modo demo)
              </p>
              <Button onClick={goToDashboard} className="w-full">
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teste o Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Testar a página de checkout com modo teste
              </p>
              <Button onClick={goToTestCheckout} variant="outline" className="w-full">
                Testar Checkout
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Esta página é para diagnóstico do problema da página branca</p>
          <p>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </main>
    </div>
  );
}