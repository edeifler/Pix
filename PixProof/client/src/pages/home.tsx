import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileText, 
  Upload, 
  BarChart3, 
  Settings, 
  LogOut, 
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Activity
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user, isLoading, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription"],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Use real dashboard stats
  const usageInfo = dashboardStats?.usage || { current: 0, limit: 100, percentage: 0 };
  const stats = dashboardStats?.stats || { 
    totalDocuments: 0, 
    autoMatchRate: 0, 
    manualReviews: 0,
    successfulMatches: 0
  };
  const recentActivity = dashboardStats?.recentActivity || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">PixConcilia</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Plano Starter
              </Badge>
              
              <Avatar>
                <AvatarImage src={(user as any)?.profileImageUrl} />
                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
              </Avatar>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'Usuário'}!
          </h1>
          <p className="text-gray-600">
            Gerencie suas reconciliações PIX de forma simples e eficiente.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Processados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Documentos processados até agora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reconciliações Automáticas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.autoMatchRate}%</div>
              <p className="text-xs text-muted-foreground">
                Taxa de correspondência automática
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisão Manual</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.manualReviews}</div>
              <p className="text-xs text-muted-foreground">
                Documentos pendentes de revisão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uso do Plano</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageInfo.current}/{usageInfo.limit}</div>
              <Progress value={usageInfo.percentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/upload-pix-simple">
              <CardHeader>
                <Upload className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Enviar Comprovantes PIX</CardTitle>
                <CardDescription>
                  Faça upload dos seus comprovantes PIX para processamento
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/upload-extrato-simple">
              <CardHeader>
                <FileText className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Enviar Extratos Bancários</CardTitle>
                <CardDescription>
                  Envie seus extratos bancários para reconciliação
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/reconciliacao-completa">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Reconciliação Completa</CardTitle>
                <CardDescription>
                  Processo completo em 3 etapas: PIX → Extratos → Resultados
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/configuracoes">
              <CardHeader>
                <Settings className="h-12 w-12 text-gray-600 mb-4" />
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Gerencie sua conta e preferências
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Advanced Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/analytics-advanced">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Analytics Avançados</CardTitle>
                <CardDescription>
                  Relatórios detalhados e análises preditivas
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/system-monitor">
              <CardHeader>
                <Activity className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Monitor do Sistema</CardTitle>
                <CardDescription>
                  Acompanhe performance e melhorias
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Seus uploads e processamentos mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Comprovante PIX processado</p>
                  <p className="text-xs text-gray-500">R$ 1.250,00 - há 2 horas</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Conciliado
                </Badge>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Upload className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Extrato bancário enviado</p>
                  <p className="text-xs text-gray-500">Banco do Brasil - há 3 horas</p>
                </div>
                <Badge variant="outline">
                  Processando
                </Badge>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-2 rounded-full">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Reconciliação concluída</p>
                  <p className="text-xs text-gray-500">15 transações analisadas - ontem</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Concluído
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Banner */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Precisa processar mais consultas?
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Upgrade para o Plano 2 (R$ 99,90/mês) com 500 consultas ou Plano 3 (R$ 189,90/mês) para volumes maiores.
                  </p>
                </div>
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation('/signup-simple')}
              >
                Ver Planos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}