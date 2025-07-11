import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, FileText, Calculator, Download, FileSpreadsheet, Search, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";

export default function ReconciliacaoSimplePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Export functions
  const exportToCSV = (data: any) => {
    if (!data || !data.matches || data.matches.length === 0) {
      toast({
        title: "Erro na exportação",
        description: "Nenhuma correspondência encontrada para exportar",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Status', 'PIX Valor', 'PIX Pagador', 'PIX Data', 'PIX CPF', 'Banco Valor', 'Banco Descrição', 'Banco Data', 'Confiança', 'Motivos'].join(','),
      ...data.matches.map((match: any) => [
        match.status === 'auto_matched' ? 'Encontrado' : 'Revisão Manual',
        match.pixReceipt?.extractedData?.amount || '',
        match.pixReceipt?.extractedData?.payerName || '',
        match.pixReceipt?.extractedData?.transactionDate ? new Date(match.pixReceipt.extractedData.transactionDate).toLocaleDateString('pt-BR') : '',
        match.pixReceipt?.extractedData?.payerDocument || '',
        match.bankTransaction?.extractedData?.transactions?.[0]?.amount || '',
        match.bankTransaction?.extractedData?.transactions?.[0]?.description || '',
        match.bankTransaction?.extractedData?.transactions?.[0]?.transactionDate ? new Date(match.bankTransaction.extractedData.transactions[0].transactionDate).toLocaleDateString('pt-BR') : '',
        `${Math.round(match.matchConfidence)}%`,
        match.matchReasons ? match.matchReasons.join('; ') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reconciliacao_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "Arquivo CSV baixado com sucesso",
    });
  };

  const exportToPDF = (data: any) => {
    if (!data || !data.matches || data.matches.length === 0) {
      toast({
        title: "Erro na exportação",
        description: "Nenhuma correspondência encontrada para exportar",
        variant: "destructive",
      });
      return;
    }

    // Create a simple HTML report for printing/PDF
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Reconciliação PIX</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { margin-bottom: 30px; padding: 20px; background: #f5f5f5; }
          .match { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
          .match-header { font-weight: bold; margin-bottom: 10px; }
          .pix-data, .bank-data { display: inline-block; width: 48%; vertical-align: top; }
          .pix-data { background: #e3f2fd; padding: 10px; margin-right: 2%; }
          .bank-data { background: #e8f5e8; padding: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Reconciliação PIX</h1>
          <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="summary">
          <h2>Resumo da Reconciliação</h2>
          <p><strong>Total de Comprovantes PIX:</strong> ${data.totalPixReceipts || 0}</p>
          <p><strong>Total de Transações Bancárias:</strong> ${data.totalBankTransactions || 0}</p>
          <p><strong>Encontrados Automaticamente:</strong> ${data.autoMatched || 0}</p>
          <p><strong>Necessitam Revisão Manual:</strong> ${data.manualReview || 0}</p>
          <p><strong>Não Encontrados:</strong> ${data.unmatched || 0}</p>
        </div>

        <h2>Detalhes das Correspondências</h2>
        ${data.matches.map((match: any) => `
          <div class="match">
            <div class="match-header">
              ${match.status === 'auto_matched' ? '✓ Encontrado Automaticamente' : '⚠ Necessita Revisão Manual'} 
              (Confiança: ${Math.round(match.matchConfidence)}%)
            </div>
            <div class="pix-data">
              <h4>Comprovante PIX</h4>
              <p><strong>Valor:</strong> ${match.pixReceipt?.extractedData?.amount || 'N/A'}</p>
              <p><strong>Pagador:</strong> ${match.pixReceipt?.extractedData?.payerName || 'N/A'}</p>
              <p><strong>Data:</strong> ${match.pixReceipt?.extractedData?.transactionDate ? new Date(match.pixReceipt.extractedData.transactionDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <p><strong>CPF:</strong> ${match.pixReceipt?.extractedData?.payerDocument || 'N/A'}</p>
            </div>
            <div class="bank-data">
              <h4>Transação Bancária</h4>
              <p><strong>Valor:</strong> ${match.bankTransaction?.extractedData?.transactions?.[0]?.amount || 'N/A'}</p>
              <p><strong>Descrição:</strong> ${match.bankTransaction?.extractedData?.transactions?.[0]?.description || 'N/A'}</p>
              <p><strong>Data:</strong> ${match.bankTransaction?.extractedData?.transactions?.[0]?.transactionDate ? new Date(match.bankTransaction.extractedData.transactions[0].transactionDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <p><strong>Tipo:</strong> ${match.bankTransaction?.extractedData?.transactions?.[0]?.type || 'N/A'}</p>
            </div>
            ${match.matchReasons ? `<p><strong>Motivos:</strong> ${match.matchReasons.join(', ')}</p>` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(reportHTML);
      newWindow.document.close();
      newWindow.print();
    }

    toast({
      title: "Relatório gerado",
      description: "Janela de impressão aberta para salvar como PDF",
    });
  };

  // Query for reconciliation data
  const { data: reconciliationData, isLoading } = useQuery({
    queryKey: ['/api/reconciliation', '25'],
    queryFn: async () => {
      const response = await fetch('/api/reconciliation');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reconciliação Automática</h1>
          <p className="text-gray-600">Processando reconciliação...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!reconciliationData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reconciliação Automática</h1>
          <p className="text-gray-600">Erro ao carregar dados de reconciliação</p>
        </div>
        <Button onClick={() => setLocation('/upload-extrato-simple')}>
          Voltar para Extratos Bancários
        </Button>
      </div>
    );
  }

  const {
    totalPixReceipts = 0,
    totalBankTransactions = 0,
    autoMatched = 0,
    manualReview = 0,
    unmatched = 0,
    matches = []
  } = reconciliationData.summary || {};

  // Check if we have sufficient data for reconciliation
  const hasPixReceipts = totalPixReceipts > 0;
  const hasBankTransactions = totalBankTransactions > 0;
  const hasMatches = matches && matches.length > 0;

  // Filter matches based on search term
  const filteredMatches = matches.filter((match: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const payerName = match.pixReceipt?.extractedData?.payerName?.toLowerCase() || '';
    const payerDocument = match.pixReceipt?.extractedData?.payerDocument || '';
    const bankDescription = match.bankTransaction?.extractedData?.transactions?.[0]?.description?.toLowerCase() || '';
    
    return payerName.includes(searchLower) || 
           payerDocument.includes(searchTerm) || 
           bankDescription.includes(searchLower);
  });

  const totalMatches = autoMatched + manualReview;
  const matchPercentage = totalPixReceipts > 0 ? Math.round((totalMatches / totalPixReceipts) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Reconciliação Automática" />
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reconciliação Automática</h1>
            <p className="text-gray-600">Resultado da comparação entre comprovantes PIX e extratos bancários</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => exportToCSV(reconciliationData)}
              className="flex items-center gap-2"
              disabled={!reconciliationData?.matches || reconciliationData.matches.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportToPDF(reconciliationData)}
              className="flex items-center gap-2"
              disabled={!reconciliationData?.matches || reconciliationData.matches.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalPixReceipts}</p>
                <p className="text-gray-600">Comprovantes PIX</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{autoMatched}</p>
                <p className="text-gray-600">Encontrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{manualReview}</p>
                <p className="text-gray-600">Revisão Manual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{unmatched}</p>
                <p className="text-gray-600">Não Encontrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Reconciliação</CardTitle>
          <CardDescription>
            Porcentagem de comprovantes PIX que foram encontrados no extrato bancário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Reconciliado</span>
              <span>{matchPercentage}%</span>
            </div>
            <Progress value={matchPercentage} className="w-full" />
            <p className="text-sm text-gray-600">
              {totalMatches} de {totalPixReceipts} comprovantes reconciliados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Buscar Reconciliações</CardTitle>
            <CardDescription>
              Filtre por nome do cliente ou CPF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {filteredMatches.length} de {matches.length} resultados
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Matches List */}
      {filteredMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Reconciliação</CardTitle>
            <CardDescription>
              Comparação detalhada entre comprovantes PIX e transações bancárias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMatches.map((match: any) => (
                <div key={match.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {match.status === 'auto_matched' ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Encontrado Automaticamente
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Necessita Revisão
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Confiança: {Math.round(match.matchConfidence)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PIX Receipt */}
                    <div className="p-3 bg-blue-50 rounded">
                      <h4 className="font-medium text-blue-900 mb-2">Comprovante PIX</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Valor:</span>
                          <span className="ml-2 text-green-600 font-semibold">
                            {match.pixReceipt?.extractedData?.amount || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Pagador:</span>
                          <span className="ml-2">
                            {match.pixReceipt?.extractedData?.payerName || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>
                          <span className="ml-2">
                            {match.pixReceipt?.extractedData?.transactionDate ? 
                              new Date(match.pixReceipt.extractedData.transactionDate).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">CPF:</span>
                          <span className="ml-2">
                            {match.pixReceipt?.extractedData?.payerDocument || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bank Transaction */}
                    <div className="p-3 bg-green-50 rounded">
                      <h4 className="font-medium text-green-900 mb-2">Transação Bancária</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Valor:</span>
                          <span className="ml-2 text-green-600 font-semibold">
                            {match.bankTransaction?.extractedData?.transactions?.[0]?.amount || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Descrição:</span>
                          <span className="ml-2">
                            {match.bankTransaction?.extractedData?.transactions?.[0]?.description || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>
                          <span className="ml-2">
                            {match.bankTransaction?.extractedData?.transactions?.[0]?.transactionDate ? 
                              new Date(match.bankTransaction.extractedData.transactions[0].transactionDate).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span>
                          <span className="ml-2">
                            {match.bankTransaction?.extractedData?.transactions?.[0]?.type || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  {match.matchReasons && match.matchReasons.length > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-700 mb-1">Motivos da correspondência:</div>
                      <div className="text-xs text-gray-600">
                        {match.matchReasons.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results message when filtering */}
      {searchTerm && filteredMatches.length === 0 && matches.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-600 mb-4">
              Não foram encontradas reconciliações para "{searchTerm}"
            </p>
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Limpar busca
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline"
          onClick={() => setLocation('/upload-extrato-simple')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar: Extratos Bancários
        </Button>
        
        <Button 
          onClick={() => setLocation('/dashboard')}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          Finalizar Reconciliação
        </Button>
      </div>
      </div>
    </div>
  );
}