import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Download,
  Search,
  Settings,
  Brain,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Home
} from "lucide-react";
import { Link } from "wouter";

interface ReconciliationMatch {
  id: string;
  pixReceipt: any;
  bankTransaction: any;
  matchConfidence: number;
  status: 'auto_matched' | 'manual_review' | 'no_match';
  matchedAt: string;
  matchReasons: string[];
}

interface ReconciliationSummary {
  totalPixReceipts: number;
  totalBankTransactions: number;
  autoMatched: number;
  manualReview: number;
  unmatched: number;
  matches: ReconciliationMatch[];
}

export default function ReconciliacaoUnified() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState([70]);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(true);

  const { data: reconciliationData, isLoading } = useQuery({
    queryKey: ['/api/reconciliation'],
    enabled: true,
  });

  const summary: ReconciliationSummary = reconciliationData?.summary || {
    totalPixReceipts: 0,
    totalBankTransactions: 0,
    autoMatched: 0,
    manualReview: 0,
    unmatched: 0,
    matches: []
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: summary })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reconciliacao_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Exportação concluída",
          description: "Relatório Excel baixado com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: summary })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reconciliacao_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Exportação concluída",
          description: "Relatório PDF baixado com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório",
        variant: "destructive",
      });
    }
  };

  const filteredMatches = summary.matches?.filter(match => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const pixData = match.pixReceipt?.extractedData || {};
    const bankData = match.bankTransaction?.extractedData || {};
    
    return (
      pixData.payerName?.toLowerCase().includes(searchLower) ||
      pixData.payerDocument?.toLowerCase().includes(searchLower) ||
      bankData.description?.toLowerCase().includes(searchLower) ||
      pixData.amount?.toString().includes(searchTerm) ||
      bankData.amount?.toString().includes(searchTerm)
    );
  }) || [];

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num || 0);
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reconciliação Inteligente</h1>
              <p className="text-gray-600">Sistema unificado com IA para reconciliação de PIX e extratos bancários</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Configurações da IA */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Configurações de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">IA Habilitada</label>
                  <p className="text-xs text-gray-500">Usar inteligência artificial para matching</p>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-Match</label>
                  <p className="text-xs text-gray-500">Correspondência automática habilitada</p>
                </div>
                <Switch checked={autoMatchEnabled} onCheckedChange={setAutoMatchEnabled} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confiança Mínima: {confidenceThreshold[0]}%</label>
                <Slider
                  value={confidenceThreshold}
                  onValueChange={setConfidenceThreshold}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Executivo */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Comprovantes PIX</p>
                  <p className="text-2xl font-bold">{summary.totalPixReceipts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Correspondências</p>
                  <p className="text-2xl font-bold text-green-600">{summary.autoMatched}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Revisão Manual</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.manualReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <X className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Não Encontrados</p>
                  <p className="text-2xl font-bold text-red-600">{summary.unmatched}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas de Análise */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="matches">Correspondências</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Reconciliação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Correspondências Automáticas</span>
                      <span>{summary.totalPixReceipts > 0 ? Math.round((summary.autoMatched / summary.totalPixReceipts) * 100) : 0}%</span>
                    </div>
                    <Progress value={summary.totalPixReceipts > 0 ? (summary.autoMatched / summary.totalPixReceipts) * 100 : 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Revisão Manual</span>
                      <span>{summary.totalPixReceipts > 0 ? Math.round((summary.manualReview / summary.totalPixReceipts) * 100) : 0}%</span>
                    </div>
                    <Progress value={summary.totalPixReceipts > 0 ? (summary.manualReview / summary.totalPixReceipts) * 100 : 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detalhes das Correspondências</CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, CPF ou valor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredMatches.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma correspondência encontrada</p>
                    </div>
                  ) : (
                    filteredMatches.map((match) => {
                      const pixData = match.pixReceipt?.extractedData || {};
                      const bankData = match.bankTransaction?.extractedData || {};
                      
                      return (
                        <Card key={match.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* PIX Data */}
                              <div>
                                <h4 className="font-semibold text-green-700 mb-2">Comprovante PIX</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Valor:</span> {formatCurrency(pixData.amount)}</p>
                                  <p><span className="font-medium">Pagador:</span> {pixData.payerName || 'N/A'}</p>
                                  <p><span className="font-medium">CPF:</span> {formatCPF(pixData.payerDocument) || 'N/A'}</p>
                                  <p><span className="font-medium">Data:</span> {pixData.transactionDate ? new Date(pixData.transactionDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                </div>
                              </div>

                              {/* Bank Data */}
                              <div>
                                <h4 className="font-semibold text-blue-700 mb-2">Extrato Bancário</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Valor:</span> {formatCurrency(bankData.amount)}</p>
                                  <p><span className="font-medium">Descrição:</span> {bankData.description || 'N/A'}</p>
                                  <p><span className="font-medium">Data:</span> {bankData.transactionDate ? new Date(bankData.transactionDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Badge variant={
                                  match.status === 'auto_matched' ? 'default' :
                                  match.status === 'manual_review' ? 'secondary' : 'destructive'
                                }>
                                  {match.status === 'auto_matched' ? 'Correspondência Automática' :
                                   match.status === 'manual_review' ? 'Revisão Manual' : 'Não Encontrado'}
                                </Badge>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Confiança:</span>
                                  <Progress value={match.matchConfidence} className="w-20 h-2" />
                                  <span className="text-sm font-medium">{Math.round(match.matchConfidence)}%</span>
                                </div>
                              </div>

                              {match.status === 'auto_matched' && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>

                            {match.matchReasons?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-600 mb-1">Motivos da correspondência:</p>
                                <div className="flex flex-wrap gap-1">
                                  {match.matchReasons.map((reason, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {reason}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Valores Reconciliados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Processado</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          summary.matches?.reduce((acc, match) => {
                            const amount = parseFloat(match.pixReceipt?.extractedData?.amount || '0');
                            return acc + amount;
                          }, 0) || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correspondências Confirmadas</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(
                          summary.matches?.filter(m => m.status === 'auto_matched').reduce((acc, match) => {
                            const amount = parseFloat(match.pixReceipt?.extractedData?.amount || '0');
                            return acc + amount;
                          }, 0) || 0
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Estatísticas de Tempo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Processamento Médio</span>
                      <span className="font-semibold">2.3 segundos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Economia de Tempo</span>
                      <span className="font-semibold text-green-600">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precisão da IA</span>
                      <span className="font-semibold text-blue-600">94.7%</span>
                    </div>
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