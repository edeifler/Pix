import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  FileText, 
  ArrowLeft,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Clock
} from "lucide-react";
import { formatCurrency, formatDate, maskCPF, maskCNPJ } from "@/lib/utils";

interface ImportSummary {
  pixReceipts: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    files: Array<{
      id: number;
      name: string;
      status: string;
      extractedData: any;
    }>;
  };
  bankStatements: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    files: Array<{
      id: number;
      name: string;
      status: string;
      extractedData: any;
    }>;
  };
  reconciliations: Array<{
    id: string;
    pixReceipt: any;
    bankTransaction: any;
    matchConfidence: number;
    status: string;
  }>;
}

export default function ImportConfirmationPage() {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const { data: importSummary, isLoading } = useQuery({
    queryKey: [`/api/import-summary/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: reconciliationData } = useQuery({
    queryKey: [`/api/reconciliation/${user?.id}`],
    enabled: !!user?.id,
  });

  const confirmImportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/confirm-import/${user.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Confirm import failed: ${response.status}`, errorText);
        throw new Error(`Erro ao confirmar importação: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Expected JSON but got:', contentType, responseText.substring(0, 200));
        throw new Error('Resposta inválida do servidor');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Importação confirmada!",
        description: "Os dados foram processados e salvos com sucesso.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro na confirmação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'excel') => {
      setIsGeneratingReport(true);
      const response = await fetch(`/api/export-reconciliation/${user.id}?format=${format}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        throw new Error("Erro ao gerar relatório");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-conciliacao-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Relatório gerado!",
        description: "O download foi iniciado automaticamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGeneratingReport(false);
    },
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Carregando dados da importação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = importSummary as ImportSummary;
  const reconciliations = (reconciliationData as any)?.matches || [];

  const totalFiles = (summary?.pixReceipts?.total || 0) + (summary?.bankStatements?.total || 0);
  const successfulFiles = (summary?.pixReceipts?.successful || 0) + (summary?.bankStatements?.successful || 0);
  const failedFiles = (summary?.pixReceipts?.failed || 0) + (summary?.bankStatements?.failed || 0);
  const successRate = totalFiles > 0 ? Math.round((successfulFiles / totalFiles) * 100) : 0;

  const autoMatched = reconciliations.filter((r: any) => r.status === 'auto_matched').length;
  const needsReview = reconciliations.filter((r: any) => r.status === 'manual_review').length;
  const noMatch = reconciliations.filter((r: any) => r.status === 'no_match').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'auto_matched':
        return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Auto Conciliado</Badge>;
      case 'manual_review':
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><AlertTriangle className="h-3 w-3 mr-1" />Revisão Manual</Badge>;
      case 'no_match':
        return <Badge variant="outline" className="border-red-500 text-red-600">Sem Correspondência</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/dashboard")}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-primary">Confirmação da Importação</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate('excel')}
                disabled={isGeneratingReport || exportMutation.isPending}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate('pdf')}
                disabled={isGeneratingReport || exportMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Import Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="text-primary h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Arquivos</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Processados com Sucesso</p>
                  <p className="text-2xl font-semibold text-gray-900">{successfulFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="text-orange-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conciliações Auto</p>
                  <p className="text-2xl font-semibold text-gray-900">{autoMatched}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="text-purple-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-semibold text-gray-900">{successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progresso do Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Comprovantes PIX</span>
                  <span>{summary?.pixReceipts?.processed || 0}/{summary?.pixReceipts?.total || 0}</span>
                </div>
                <Progress 
                  value={summary?.pixReceipts?.total ? (summary.pixReceipts.processed / summary.pixReceipts.total) * 100 : 0} 
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Extratos Bancários</span>
                  <span>{summary?.bankStatements?.processed || 0}/{summary?.bankStatements?.total || 0}</span>
                </div>
                <Progress 
                  value={summary?.bankStatements?.total ? (summary.bankStatements.processed / summary.bankStatements.total) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reconciliation Dashboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Dashboard de Reconciliação Inteligente</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Correspondências automáticas encontradas entre comprovantes PIX e extratos bancários
            </p>
          </CardHeader>
          <CardContent>
            {/* Reconciliation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Correspondências Encontradas</p>
                    <p className="text-2xl font-bold text-green-900">{(reconciliationData as any)?.matches?.length || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Revisão Manual</p>
                    <p className="text-2xl font-bold text-blue-900">{(reconciliationData as any)?.summary?.manualReview || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Não Reconciliados</p>
                    <p className="text-2xl font-bold text-gray-900">{(reconciliationData as any)?.summary?.unmatched || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Detailed Matches Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Comprovante PIX</TableHead>
                    <TableHead className="font-semibold">Extrato Bancário</TableHead>
                    <TableHead className="font-semibold">Valores</TableHead>
                    <TableHead className="font-semibold">Datas</TableHead>
                    <TableHead className="font-semibold">Confiança</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reconciliationData as any)?.matches?.map((match: any) => (
                    <TableRow key={match.id} className="hover:bg-gray-50">
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-gray-900">
                            {match.pixReceipt?.payerName || 'Nome não informado'}
                          </div>
                          <div className="text-sm text-gray-600">
                            CPF: {match.pixReceipt?.payerDocument ? 
                              maskCPF(match.pixReceipt.payerDocument) : 'Não informado'}
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ID: {match.pixReceipt?.transactionId?.substring(0, 12) || 'N/A'}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          <div className="font-medium text-gray-900">
                            {match.bankTransaction?.payerName || 
                             match.bankTransaction?.description?.split(' - ')[1]?.split(' - ')[0] || 'Nome não identificado'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {match.bankTransaction?.description || 'Descrição não disponível'}
                          </div>
                          <div className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                            Banco: {match.bankTransaction?.extractedData?.bankName || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-green-600 text-lg">
                            {match.pixReceipt?.amount || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Extrato: {match.bankTransaction?.amount || 'N/A'}
                          </div>
                          {match.pixReceipt?.amount !== match.bankTransaction?.amount && (
                            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              ⚠ Valores diferentes
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            PIX: {match.pixReceipt?.transactionDate ? 
                              formatDate(match.pixReceipt.transactionDate) : 'Não informado'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Extrato: {match.bankTransaction?.transactionDate ? 
                              formatDate(match.bankTransaction.transactionDate) : 'Não informado'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col items-start space-y-2">
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={match.matchConfidence || 0} 
                              className="w-20 h-2"
                            />
                            <span className="text-sm font-bold">
                              {match.matchConfidence || 0}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {match.matchReasons?.join(', ') || 'Sem detalhes'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col space-y-2">
                          {getStatusBadge(match.status)}
                          {match.status === 'manual_review' && (
                            <Button size="sm" variant="outline" className="text-xs">
                              Revisar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhuma correspondência encontrada entre os comprovantes PIX e extratos bancários.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {(reconciliationData as any)?.matches?.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Como interpretar os resultados:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Confiança Alta (70%+):</strong> Correspondência automática confirmada</li>
                  <li>• <strong>Revisão Manual (15-69%):</strong> Possível correspondência que precisa de verificação</li>
                  <li>• <strong>Sem Correspondência (&lt;15%):</strong> Transações não relacionadas</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo da Conciliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{autoMatched}</div>
                <div className="text-sm text-gray-600">Conciliações Automáticas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{needsReview}</div>
                <div className="text-sm text-gray-600">Necessitam Revisão</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{noMatch}</div>
                <div className="text-sm text-gray-600">Sem Correspondência</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/dashboard")}
          >
            Revisar Mais Tarde
          </Button>
          <Button
            onClick={() => confirmImportMutation.mutate()}
            disabled={confirmImportMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {confirmImportMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Importação
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}