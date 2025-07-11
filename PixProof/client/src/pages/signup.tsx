import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { registrationFrontendSchema, type RegistrationData } from "@shared/schema";

type RegistrationFormData = {
  plan: "starter" | "professional" | "enterprise";
  user: {
    fullName: string;
    email: string;
    cpf: string;
    phone: string;
    password: string;
  };
  company: {
    name: string;
    cnpj: string;
    sector?: string;
  };
};
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const preselectedPlan = window.location.pathname.split('/')[2] || 'professional';

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFrontendSchema),
    defaultValues: {
      user: {
        fullName: "",
        email: "",
        cpf: "",
        phone: "",
        password: "",
      },
      company: {
        name: "",
        cnpj: "",
        sector: "",
      },
      plan: preselectedPlan as any || "professional",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha no cadastro");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao PixConcilia. Redirecionando para o dashboard...",
      });
      
      // Store user data in localStorage for demo purposes
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("company", JSON.stringify(data.company));
      localStorage.setItem("subscription", JSON.stringify(data.subscription));
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar sua conta.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  const planOptions = [
    { value: "basic", label: "Básico", price: "R$ 49/mês", description: "200 verificações" },
    { value: "professional", label: "Profissional", price: "R$ 99/mês", description: "1.000 verificações" },
    { value: "enterprise", label: "Empresarial", price: "Customizado", description: "Volume ilimitado" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Criar Conta</CardTitle>
            <p className="text-gray-600">Preencha os dados para começar a usar o PixConcilia</p>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Data */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="user.fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="user.cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="user.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="user.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Company Data */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="company.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Razão Social</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da empresa" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="company.cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="company.sector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o setor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="retail">Varejo</SelectItem>
                                <SelectItem value="services">Serviços</SelectItem>
                                <SelectItem value="ecommerce">E-commerce</SelectItem>
                                <SelectItem value="manufacturing">Indústria</SelectItem>
                                <SelectItem value="other">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Selection */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Escolha seu Plano</h3>
                    <FormField
                      control={form.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {planOptions.map((plan) => (
                              <div key={plan.value} className="relative">
                                <input
                                  type="radio"
                                  id={plan.value}
                                  value={plan.value}
                                  checked={field.value === plan.value}
                                  onChange={() => field.onChange(plan.value)}
                                  className="sr-only"
                                />
                                <label
                                  htmlFor={plan.value}
                                  className={`cursor-pointer block p-4 border-2 rounded-lg transition-colors ${
                                    field.value === plan.value
                                      ? 'border-primary bg-blue-50'
                                      : 'border-gray-200 hover:border-primary'
                                  }`}
                                >
                                  <div className="text-center">
                                    <h4 className="font-semibold">{plan.label}</h4>
                                    <p className="text-primary font-bold">{plan.price}</p>
                                    <p className="text-sm text-gray-600">{plan.description}</p>
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Security */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="user.password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="user.password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirme sua senha" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Terms */}
                <div className="flex items-start space-x-3">
                  <Checkbox required />
                  <div className="text-sm text-gray-600">
                    <p>Concordo com os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a></p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Link href="/">
                    <Button type="button" variant="outline" className="flex-1">
                      Voltar
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="flex-1 gradient-primary"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Criando conta..." : "Criar Conta e Começar"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
