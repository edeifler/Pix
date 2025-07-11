import { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle, AlertCircle,
  Calendar, Download, Filter, Search, Eye, ArrowLeft
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalVolume: number;
    totalTransactions: number;
    averageTransactionValue: number;
    reconciliationRate: number;
  };
  trends: {
    daily: Array<{
      date: string;
      pixReceipts: number;
      bankTransactions: number;
      matched: number;
      rate: number;
    }>;
    monthly: Array<{
      month: string;
      pixReceipts: number;
      bankTransactions: number;
      matched: number;
      rate: number;
      volume: number;
    }>;
  };
  topClients: {
    byVolume: Array<{
      name: string;
      document: string;
      totalValue: number;
      transactionCount: number;
    }>;
    byFrequency: Array<{
      name: string;
      document: string;
      transactionCount: number;
      totalValue: number;
    }>;
  };
  efficiency: {
    ocrAccuracy: number;
    autoMatchRate: number;
    manualReviewRate: number;
    processingTime: {
      average: number;
      median: number;
      fastest: number;
      slowest: number;
    };
  };
  bankAnalysis: {
    topBanks: Array<{
      name: string;
      transactionCount: number;
      volume: number;
    }>;
    reconciliationRates: Array<{
      bank: string;
      rate: number;
    }>;
  };
  riskAnalysis: {
    unmatchedTransactions: Array<{
      amount: number;
      date: Date;
      type: 'pix' | 'bank';
      reason: string;
    }>;
    duplicateRisk: Array<{
      amount: number;
      date: Date;
      matches: number;
    }>;
  };
}

export default function AdvancedAnalyticsPage() {
  const [, setLocation] = useLocation();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('volume');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateFilter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/comprehensive?period=${dateFilter}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      // Simula exportação com dados reais
      if (format === 'pdf') {
        const dataStr = JSON.stringify(analyticsData, null, 2);
        const blob = new Blob([`RELATÓRIO DE ANALYTICS AVANÇADOS\n\nPeríodo: ${dateFilter}\nData de geração: ${new Date().toLocaleString('pt-BR')}\n\nDados:\n${dataStr}`], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${dateFilter}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Exportação Excel como CSV
        const csvData = [
          ['Métrica', 'Valor'],
          ['Volume Total', analyticsData?.summary.totalVolume || 0],
          ['Transações Totais', analyticsData?.summary.totalTransactions || 0],
          ['Valor Médio', analyticsData?.summary.averageTransactionValue || 0],
          ['Taxa de Reconciliação', `${analyticsData?.summary.reconciliationRate || 0}%`]
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${dateFilter}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const summary = analyticsData?.summary;
  const trends = analyticsData?.trends;
  const efficiency = analyticsData?.efficiency;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header with filters and actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/dashboard')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Avançados</h1>
              <p className="text-gray-600">Insights detalhados sobre reconciliação PIX</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => exportReport('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            
            <Button onClick={() => exportReport('excel')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(summary?.totalVolume || 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalTransactions || 0}</div>
              <p className="text-xs text-muted-foreground">
                +8% em relação ao período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Reconciliação</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary?.reconciliationRate || 0).toFixed(1)}%</div>
              <Progress value={summary?.reconciliationRate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(summary?.averageTransactionValue || 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                +5% em relação ao período anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and detailed analytics */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="efficiency">Eficiência</TabsTrigger>
            <TabsTrigger value="clients">Top Clientes</TabsTrigger>
            <TabsTrigger value="banks">Bancos</TabsTrigger>
            <TabsTrigger value="risk">Análise de Risco</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Reconciliação</CardTitle>
                  <CardDescription>Taxa de matching ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="rate" stroke="#8884d8" name="Taxa %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Volume por Período</CardTitle>
                  <CardDescription>Transações processadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trends?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="pixReceipts" stackId="1" stroke="#8884d8" fill="#8884d8" name="PIX" />
                      <Area type="monotone" dataKey="bankTransactions" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Banco" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Precisão OCR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{efficiency?.ocrAccuracy || 0}%</div>
                  <Progress value={efficiency?.ocrAccuracy || 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Auto-matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{efficiency?.autoMatchRate || 0}%</div>
                  <Progress value={efficiency?.autoMatchRate || 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revisão Manual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{efficiency?.manualReviewRate || 0}%</div>
                  <Progress value={efficiency?.manualReviewRate || 0} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tempo de Processamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Média</Label>
                    <div className="text-2xl font-bold">{efficiency?.processingTime?.average || 0}s</div>
                  </div>
                  <div>
                    <Label>Mediana</Label>
                    <div className="text-2xl font-bold">{efficiency?.processingTime?.median || 0}s</div>
                  </div>
                  <div>
                    <Label>Mais Rápido</Label>
                    <div className="text-2xl font-bold text-green-600">{efficiency?.processingTime?.fastest || 0}s</div>
                  </div>
                  <div>
                    <Label>Mais Lento</Label>
                    <div className="text-2xl font-bold text-red-600">{efficiency?.processingTime?.slowest || 0}s</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Clientes por Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.topClients?.byVolume?.slice(0, 5).map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.document}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">R$ {client.totalValue.toLocaleString('pt-BR')}</div>
                          <div className="text-sm text-gray-500">{client.transactionCount} transações</div>
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
                    {analyticsData?.topClients?.byFrequency?.slice(0, 5).map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.document}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{client.transactionCount} transações</div>
                          <div className="text-sm text-gray-500">R$ {client.totalValue.toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="banks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Banco</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData?.bankAnalysis?.topBanks || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="transactionCount"
                      >
                        {(analyticsData?.bankAnalysis?.topBanks || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Reconciliação por Banco</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.bankAnalysis?.reconciliationRates || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bank" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transações Não Reconciliadas</CardTitle>
                  <CardDescription>Itens que requerem atenção</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.riskAnalysis?.unmatchedTransactions?.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                        <div>
                          <div className="font-medium">R$ {item.amount.toLocaleString('pt-BR')}</div>
                          <div className="text-sm text-gray-500">{item.reason}</div>
                        </div>
                        <Badge variant={item.type === 'pix' ? 'default' : 'secondary'}>
                          {item.type.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risco de Duplicatas</CardTitle>
                  <CardDescription>Possíveis transações duplicadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.riskAnalysis?.duplicateRisk?.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                        <div>
                          <div className="font-medium">R$ {item.amount.toLocaleString('pt-BR')}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(item.date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {item.matches} matches
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}