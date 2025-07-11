import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/app-header";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  Download,
  Calendar,
  Target,
  Clock,
  Shield
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Query for comprehensive analytics
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      return response.json();
    },
  });

  const downloadMonthlyReport = async () => {
    try {
      const now = new Date();
      const response = await fetch(`/api/analytics/monthly-report?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'relatorio_mensal.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Relatório baixado",
          description: "Relatório mensal baixado com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Erro ao baixar relatório mensal",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Avançados</h1>
          <p className="text-gray-600">Carregando dados analíticos...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Avançados</h1>
          <p className="text-gray-600">Erro ao carregar dados analíticos</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Avançados</h1>
          <p className="text-gray-600">Análise detalhada da reconciliação PIX e métricas financeiras</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={downloadMonthlyReport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Relatório Mensal
          </Button>
          <Button onClick={() => setLocation('/dashboard')} variant="outline">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-end">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <Button onClick={() => window.location.reload()}>Aplicar Filtros</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="efficiency">Eficiência</TabsTrigger>
          <TabsTrigger value="risks">Riscos</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Volume Total</p>
                    <p className="text-2xl font-bold">
                      R$ {analyticsData.summary?.totalVolume?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                    <p className="text-2xl font-bold">{analyticsData.summary?.totalTransactions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Taxa de Reconciliação</p>
                    <p className="text-2xl font-bold">{analyticsData.summary?.reconciliationRate?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                    <p className="text-2xl font-bold">
                      R$ {analyticsData.summary?.averageTransactionValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Principais Bancos por Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.bankAnalysis?.topBanks?.slice(0, 5).map((bank: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{bank.name}</p>
                        <p className="text-sm text-gray-600">{bank.transactionCount} transações</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {bank.volume?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Reconciliação por Banco</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.bankAnalysis?.reconciliationRates || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bank" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Bar dataKey="rate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendência Diária de Reconciliação</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends?.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#8884d8" name="Taxa %" />
                    <Line type="monotone" dataKey="matched" stroke="#82ca9d" name="Reconciliados" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendência Mensal por Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.trends?.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Bar dataKey="volume" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Clientes por Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topClients?.byVolume?.slice(0, 10).map((client: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">CPF: {client.document}</p>
                        <p className="text-sm text-gray-600">{client.transactionCount} transações</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">R$ {client.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Clientes por Frequência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topClients?.byFrequency?.slice(0, 10).map((client: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">CPF: {client.document}</p>
                        <p className="text-sm text-gray-600">R$ {client.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{client.transactionCount} transações</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Precisão do OCR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {analyticsData.efficiency?.ocrAccuracy?.toFixed(1) || 0}%
                  </div>
                  <Progress value={analyticsData.efficiency?.ocrAccuracy || 0} className="w-full" />
                  <p className="text-sm text-gray-600 mt-2">Precisão média do reconhecimento de texto</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matching Automático</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {analyticsData.efficiency?.autoMatchRate?.toFixed(1) || 0}%
                  </div>
                  <Progress value={analyticsData.efficiency?.autoMatchRate || 0} className="w-full" />
                  <p className="text-sm text-gray-600 mt-2">Taxa de correspondências automáticas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revisão Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">
                    {analyticsData.efficiency?.manualReviewRate?.toFixed(1) || 0}%
                  </div>
                  <Progress value={analyticsData.efficiency?.manualReviewRate || 0} className="w-full" />
                  <p className="text-sm text-gray-600 mt-2">Taxa que necessita revisão manual</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tempos de Processamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-xl font-bold">{((analyticsData.efficiency?.processingTime?.average || 0) / 1000).toFixed(1)}s</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Mais Rápido</p>
                  <p className="text-xl font-bold">{((analyticsData.efficiency?.processingTime?.fastest || 0) / 1000).toFixed(1)}s</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <p className="text-sm font-medium text-gray-600">Mais Lento</p>
                  <p className="text-xl font-bold">{((analyticsData.efficiency?.processingTime?.slowest || 0) / 1000).toFixed(1)}s</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Mediana</p>
                  <p className="text-xl font-bold">{((analyticsData.efficiency?.processingTime?.median || 0) / 1000).toFixed(1)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Transações Não Reconciliadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.riskAnalysis?.unmatchedTransactions?.slice(0, 10).map((transaction: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded bg-red-50">
                      <div>
                        <p className="font-medium">R$ {transaction.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm text-red-600">{transaction.reason}</p>
                      </div>
                      <Badge variant="destructive">{transaction.type}</Badge>
                    </div>
                  )) || <p className="text-gray-600">Nenhuma transação não reconciliada encontrada</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Possíveis Duplicatas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.riskAnalysis?.duplicateRisk?.slice(0, 10).map((duplicate: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-orange-200 rounded bg-orange-50">
                      <div>
                        <p className="font-medium">R$ {duplicate.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-600">{new Date(duplicate.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Badge variant="secondary">{duplicate.matches} ocorrências</Badge>
                    </div>
                  )) || <p className="text-gray-600">Nenhuma duplicata detectada</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}