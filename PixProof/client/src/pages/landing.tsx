import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ArrowRight, FileText, BarChart3, Clock, Shield, Play, X } from "lucide-react";
import { Link } from "wouter";

const plans = [
  {
    name: "Plano 1",
    price: "R$ 49,90",
    period: "/mês",
    description: "Perfeito para pequenas empresas",
    documents: "200 consultas/mês",
    trial: "7 dias grátis",
    features: [
      "Processamento de comprovantes PIX",
      "Reconciliação automática",
      "Relatórios básicos",
      "Suporte por email"
    ],
    popular: false,
    planId: "starter"
  },
  {
    name: "Plano 2",
    price: "R$ 99,90",
    period: "/mês",
    description: "Ideal para empresas em crescimento",
    documents: "500 consultas/mês",
    trial: "7 dias grátis",
    features: [
      "Tudo do Plano 1",
      "Processamento de extratos bancários",
      "Relatórios avançados",
      "API para integração",
      "Suporte prioritário"
    ],
    popular: true,
    planId: "professional"
  },
  {
    name: "Plano 3",
    price: "R$ 189,90",
    period: "/mês",
    description: "Para grandes volumes de transações",
    documents: "Acima de 500 consultas/mês",
    trial: "7 dias grátis",
    features: [
      "Tudo do Plano 2",
      "Consultas ilimitadas",
      "Consultoria especializada",
      "SLA garantido",
      "Suporte 24/7"
    ],
    popular: false,
    planId: "enterprise"
  }
];

export default function Landing() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PixConcilia</span>
          </div>
          <Link href="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            🚀 Automatize sua Conciliação PIX
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Conciliação PIX<br />
            <span className="text-blue-600">Automática e Inteligente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Economize horas de trabalho manual. Nossa IA processa seus comprovantes PIX e 
            extratos bancários automaticamente, fazendo a reconciliação com precisão.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-4">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => setShowVideoModal(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher o PixConcilia?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nossa plataforma utiliza tecnologia de ponta para automatizar processos financeiros complexos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Economize Tempo</h3>
              <p className="text-gray-600">
                Reduza de horas para minutos o tempo gasto com reconciliação manual
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Precisão de 99%</h3>
              <p className="text-gray-600">
                Nossa IA garante alta precisão na identificação e reconciliação de transações
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Segurança Total</h3>
              <p className="text-gray-600">
                Seus dados financeiros são protegidos com criptografia de nível bancário
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Escolha o plano ideal para sua empresa
            </h2>
            <p className="text-gray-600">
              Comece gratuitamente e escale conforme sua necessidade
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.planId} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">{plan.documents}</p>
                  {plan.trial && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <p className="text-xs text-yellow-800 font-medium">✨ {plan.trial}</p>
                      <p className="text-xs text-yellow-700">Cobrança automática após o período. Cancele quando quiser.</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/signup-simple?plan=${plan.planId}`}>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Escolher {plan.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para automatizar sua reconciliação?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a centenas de empresas que já economizam tempo e dinheiro
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Começar Agora - Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">PixConcilia</span>
          </div>
          <p className="text-gray-400">
            © 2025 PixConcilia. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Demonstração do PixConcilia</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideoModal(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <video
              controls
              autoPlay
              className="w-full h-full rounded-lg"
              poster="/placeholder-video-thumbnail.jpg"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Seu navegador não suporta o elemento de vídeo.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}