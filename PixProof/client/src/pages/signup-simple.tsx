import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignupSimple() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Capturar parâmetro do plano da URL
  const urlParams = new URLSearchParams(window.location.search);
  const planFromUrl = urlParams.get('plan') || 'professional';
  const [selectedPlan, setSelectedPlan] = useState(planFromUrl);
  const [formData, setFormData] = useState({
    plan: planFromUrl,
    user: {
      fullName: "",
      email: "",
      cpf: "",
      phone: "",
      password: ""
    },
    company: {
      name: "",
      cnpj: "",
      sector: ""
    }
  });

  const handleInputChange = (section: 'user' | 'company', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Redirecionando para pagamento...",
        });
        
        // Save registration data for checkout
        localStorage.setItem('pendingRegistration', JSON.stringify(formData));
        
        // For production domains, redirect to static checkout that works without JavaScript
        if (window.location.hostname.includes('pixconcilia.com.br')) {
          window.location.href = `/api/checkout-static?plan=${formData.plan}`;
        } else {
          setLocation(`/checkout?plan=${formData.plan}`);
        }
      } else {
        toast({
          title: "Erro no cadastro",
          description: data.message || "Tente novamente",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Erro no cadastro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Preencha as informações para criar sua conta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Selection */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Select 
                value={formData.plan} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Plano 1 - R$ 49,90 (200 consultas)</SelectItem>
                  <SelectItem value="professional">Plano 2 - R$ 99,90 (500 consultas)</SelectItem>
                  <SelectItem value="enterprise">Plano 3 - R$ 189,90 (acima de 500 consultas)</SelectItem>
                </SelectContent>
              </Select>
              
              {(formData.plan === 'starter' || formData.plan === 'professional' || formData.plan === 'enterprise') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 text-sm">ℹ️</div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Teste Gratuito de 7 Dias
                      </p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Você terá acesso completo ao sistema por 7 dias sem cobrança. 
                        Após este período, será cobrada automaticamente a taxa mensal do plano selecionado. 
                        Você pode cancelar a qualquer momento durante o período de teste ou depois.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={formData.user.fullName}
                    onChange={(e) => handleInputChange("user", "fullName", e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.user.email}
                    onChange={(e) => handleInputChange("user", "email", e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.user.cpf}
                    onChange={(e) => handleInputChange("user", "cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.user.phone}
                    onChange={(e) => handleInputChange("user", "phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.user.password}
                  onChange={(e) => handleInputChange("user", "password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações da Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={formData.company.name}
                    onChange={(e) => handleInputChange("company", "name", e.target.value)}
                    placeholder="Nome da sua empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.company.cnpj}
                    onChange={(e) => handleInputChange("company", "cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sector">Setor (Opcional)</Label>
                  <Select 
                    value={formData.company.sector} 
                    onValueChange={(value) => handleInputChange("company", "sector", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="comercio">Comércio</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="industria">Indústria</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              type="button" 
              disabled={isLoading} 
              className="w-full"
              onClick={() => {
                // Store form data in localStorage for checkout
                localStorage.setItem('pendingRegistration', JSON.stringify(formData));
                setLocation(`/checkout?plan=${selectedPlan}`);
              }}
            >
              {isLoading ? "Processando..." : "Continuar para pagamento"}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Após o pagamento, sua conta será criada automaticamente
              </p>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}