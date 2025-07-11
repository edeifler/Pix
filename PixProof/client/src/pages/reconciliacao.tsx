import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, maskCPF } from "@/lib/utils";
import { 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  ArrowLeft,
  Calculator,
  Clock,
  FileText,
  Zap,
  Eye
} from "lucide-react";

export default function ReconciliacaoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch reconciliation data
  const { data: reconciliationData, isLoading, refetch } = useQuery({
    queryKey: ['/api/reconciliation'],
    queryFn: async () => {
      const userId = localStorage.getItem('userId') || '22'; // Updated to match current user
      const response = await fetch(`/api/reconciliation/${userId}`);
      if (!response.ok) {
        console.error('Failed to fetch reconciliation data:', response.status);
        throw new Error('Failed to fetch reconciliation data');
      }
      const data = await response.json();
      console.log('Reconciliation data:', data);
      return data;
    },
  });

  // Fetch dashboard data to get counts
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const userId = localStorage.getItem('userId') || '22';
      const response = await fetch(`/api/dashboard?userId=${userId}`);
      if (!response.ok) {
        console.error('Failed to fetch dashboard data:', response.status);
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      console.log('Dashboard data:', data);
      return data;
    },
  });

  const pixReceipts = dashboardData?.processingResults?.filter((r: any) => r.file.documentType === 'pix_receipt') || [];
  const bankStatements = dashboardData?.processingResults?.filter((r: any) => r.file.documentType === 'bank_statement') || [];

  // Process reconciliation mutation
  const processReconciliation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const userId = localStorage.getItem('userId') || '21';
      const response = await fetch(`/api/confirm-import/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to process reconciliation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reconciliação concluída",
        description: "As correspondências foram processadas com sucesso.",
      });
      refetch();
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Erro na reconciliação",
        description: "Não foi possível processar a reconciliação.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'auto_matched':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Automático</Badge>;
      case 'manual_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Revisar</Badge>;
      case 'no_match':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Sem correspondência</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reconciliacao_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Relatório exportado",
          description: `Relatório em ${format.toUpperCase()} foi baixado com sucesso.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    }
  };

  const pixReceiptsArray = Array.isArray(pixReceipts) ? pixReceipts : [];
  const bankStatementsArray = Array.isArray(bankStatements) ? bankStatements : [];
  const matches = reconciliationData?.matches || [];
  const summary = reconciliationData?.summary || {};

  const completedPixCount = pixReceiptsArray.filter((r: any) => r.status === 'completed').length;
  const completedStatementsCount = bankStatementsArray.filter((s: any) => s.status === 'completed').length;

  const autoMatched = summary.autoMatched || 0;
  const manualReview = summary.manualReview || 0;
  const unmatched = summary.unmatched || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reconciliação Inteligente</h1>
        <p className="text-gray-600 mt-2">
          Correspondências automáticas entre comprovantes PIX e extratos bancários
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Comprovantes PIX</p>
                <p className="text-2xl font-bold text-blue-900">{completedPixCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Correspondências Automáticas</p>
                <p className="text-2xl font-bold text-green-900">{autoMatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600">Revisão Manual</p>
                <p className="text-2xl font-bold text-yellow-900">{manualReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Não Reconciliados</p>
                <p className="text-2xl font-bold text-gray-900">{unmatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Button 
                onClick={() => processReconciliation.mutate()}
                disabled={isProcessing || processReconciliation.isPending}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Processar Reconciliação
                  </>
                )}
              </Button>

              <Button 
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Atualizar Dados
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => exportReport('excel')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportReport('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Reconciliação ({matches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {pixReceiptsArray.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Comprovantes PIX Processados ({pixReceiptsArray.length})</h3>
                  <div className="grid gap-4">
                    {pixReceiptsArray.map((receipt: any, index: number) => (
                      <Card key={receipt.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Valor</p>
                            <p className="font-semibold text-green-600 text-lg">
                              {receipt.extractedData?.amount || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Pagador</p>
                            <p className="font-medium">
                              {receipt.extractedData?.payerName || 'Nome não identificado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">CPF</p>
                            <p className="font-mono text-sm">
                              {receipt.extractedData?.payerDocument ? 
                                maskCPF(receipt.extractedData.payerDocument) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data</p>
                            <p className="text-sm">
                              {receipt.extractedData?.transactionDate ? 
                                formatDate(receipt.extractedData.transactionDate) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {bankStatementsArray.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Extratos Bancários Processados ({bankStatementsArray.length})</h3>
                  <div className="grid gap-4">
                    {bankStatementsArray.map((statement: any, index: number) => (
                      <Card key={statement.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Banco</p>
                            <p className="font-medium">
                              {statement.extractedData?.bankName || 'Banco não identificado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Transações</p>
                            <p className="font-semibold">
                              {statement.extractedData?.transactions?.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Período</p>
                            <p className="text-sm">
                              {statement.extractedData?.period || 'N/A'}
                            </p>
                          </div>
                        </div>
                        {statement.extractedData?.transactions && (
                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-700 mb-2">Transações encontradas:</p>
                            {statement.extractedData.transactions.slice(0, 3).map((transaction: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm py-1">
                                <span>{transaction.description || 'Sem descrição'}</span>
                                <span className="font-semibold text-green-600">{transaction.amount}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Reconciliation Results */}
              {matches.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Resultados da Reconciliação</h3>
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
                        {matches.map((match: any) => (
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
                              <Eye className="h-3 w-3 mr-1" />
                              Revisar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Help Text */}
          {matches.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Como interpretar os resultados:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Confiança Alta (70%+):</strong> Correspondência automática confirmada</li>
                <li>• <strong>Revisão Manual (15-69%):</strong> Possível correspondência que precisa de verificação</li>
                <li>• <strong>Sem Correspondência (&lt;15%):</strong> Transações não relacionadas</li>
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={() => setLocation('/upload-extrato')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar: Extratos
            </Button>

            <div className="text-sm text-gray-600">
              {matches.length > 0 ? 
                `${autoMatched} automáticas, ${manualReview} para revisar, ${unmatched} não reconciliadas` :
                'Processe a reconciliação para ver os resultados'
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}