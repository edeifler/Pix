import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AdvancedFileUpload } from "@/components/ui/advanced-file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  FileSpreadsheet, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Calculator
} from "lucide-react";

export default function UploadExtratoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing bank statements
  const { data: bankStatements = [], isLoading, refetch: refetchBankStatements } = useQuery({
    queryKey: ['/api/processing-results', 'bank_statement'],
    queryFn: async () => {
      try {
        const userId = localStorage.getItem('userId') || 'demo-user-2025';
        const response = await fetch(`/api/processing-results?type=bank_statement&userId=${userId}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching bank statements:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch PIX receipts count
  const { data: pixReceipts = [] } = useQuery({
    queryKey: ['/api/processing-results', 'pix_receipt'],
    queryFn: async () => {
      try {
        const userId = localStorage.getItem('userId') || 'demo-user-2025';
        const response = await fetch(`/api/processing-results?type=pix_receipt&userId=${userId}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching PIX receipts:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files }: { files: FileList }) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('documentType', 'bank_statement');

      return fetch('/api/upload', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Upload realizado com sucesso",
        description: "Seus extratos bancários estão sendo processados.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/processing-results', 'bank_statement'] });
      queryClient.invalidateQueries({ queryKey: ['/api/processing-results', 'pix_receipt'] });
      refetchBankStatements();
    },
    onError: (error) => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload dos arquivos.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList) => {
    uploadMutation.mutate({ files });
  };

  // Auto-navigate to reconciliation when bank statements are processed
  const processedStatements = Array.isArray(bankStatements) ? bankStatements.filter((s: any) => s.file?.status === 'completed') : [];
  const processedPixCount = Array.isArray(pixReceipts) ? pixReceipts.filter((p: any) => p.file?.status === 'completed').length : 0;
  
  useEffect(() => {
    // Redirect to reconciliation if we have both PIX receipts and bank statements processed
    if (processedStatements.length > 0 && processedPixCount > 0) {
      const timer = setTimeout(() => {
        setLocation('/reconciliacao');
      }, 2000); // Wait 2 seconds to show the processed results
      
      return () => clearTimeout(timer);
    }
  }, [processedStatements.length, processedPixCount, setLocation]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Processado</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processando</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canProceedToReconciliation = 
    Array.isArray(pixReceipts) && pixReceipts.length > 0 && 
    Array.isArray(bankStatements) && bankStatements.length > 0 && 
    bankStatements.some((statement: any) => statement.file?.status === 'completed');

  const completedPixCount = Array.isArray(pixReceipts) ? pixReceipts.filter((r: any) => r.file?.status === 'completed').length : 0;
  const completedStatementsCount = Array.isArray(bankStatements) ? bankStatements.filter((s: any) => s.file?.status === 'completed').length : 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Upload de Extratos Bancários</h1>
        <p className="text-gray-600 mt-2">
          Faça upload dos seus extratos bancários para comparar com os comprovantes PIX
        </p>
      </div>

      {/* Progress Summary */}
      <Card className="mb-8 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Comprovantes PIX processados</p>
                <p className="text-2xl font-bold text-green-700">{completedPixCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Extratos bancários processados</p>
                <p className="text-2xl font-bold text-blue-700">{completedStatementsCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Fazer Upload de Extratos Bancários
          </CardTitle>
          <p className="text-sm text-gray-600">
            Aceita arquivos CSV, PDF ou imagens de extratos bancários
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.csv,.xls,.xlsx"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="bank-statement-upload"
              disabled={uploadMutation.isPending}
            />
            <label htmlFor="bank-statement-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Arraste extratos bancários ou clique para selecionar
                </p>
                <p className="text-gray-600 mb-4">PDF, CSV, XLS, XLSX - Até 50MB por arquivo</p>
                <Button type="button" variant="outline" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Enviando...' : 'Selecionar Extratos Bancários'}
                </Button>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Bank Statements List */}
      <Card>
        <CardHeader>
          <CardTitle>Extratos Bancários Importados ({bankStatements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : bankStatements.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum extrato bancário</h3>
              <p className="text-gray-600 mb-4">Faça upload dos seus extratos bancários para continuar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bankStatements.map((statement: any) => (
                <div key={statement.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <FileSpreadsheet className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {statement.file?.originalName || 'Extrato Bancário'}
                      </h3>
                      {getStatusBadge(statement.file?.status)}
                    </div>
                    {statement.extractedData && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Banco:</span>
                          <span className="ml-2">
                            {statement.extractedData.bankName || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Transações:</span>
                          <span className="ml-2 font-semibold">
                            {statement.extractedData.transactions?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Período:</span>
                          <span className="ml-2">
                            {statement.extractedData.period || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Conta:</span>
                          <span className="ml-2">
                            {statement.extractedData.accountNumber || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Confiança:</span>
                          <span className="ml-2">
                            <Progress value={statement.confidence || 0} className="w-16 h-2 inline-block mr-2" />
                            {statement.confidence || 0}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Show some transactions if available */}
                    {statement.extractedData?.transactions && statement.extractedData.transactions.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Primeiras Transações:
                        </h4>
                        <div className="space-y-1">
                          {statement.extractedData.transactions.slice(0, 3).map((transaction: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <span className="truncate flex-1 mr-2">
                                {transaction.description || 'Sem descrição'}
                              </span>
                              <span className="font-semibold text-green-600">
                                {transaction.amount}
                              </span>
                            </div>
                          ))}
                          {statement.extractedData.transactions.length > 3 && (
                            <div className="text-xs text-gray-500 text-center pt-1">
                              +{statement.extractedData.transactions.length - 3} mais transações...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={() => setLocation('/upload-pix')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar: Comprovantes PIX
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                {Array.isArray(bankStatements) && bankStatements.length > 0 ? 
                  `${completedStatementsCount} de ${bankStatements.length} extratos processados` :
                  'Nenhum extrato importado ainda'
                }
              </div>
              <Button 
                onClick={() => setLocation('/reconciliacao')}
                disabled={!canProceedToReconciliation}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Iniciar Reconciliação
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}