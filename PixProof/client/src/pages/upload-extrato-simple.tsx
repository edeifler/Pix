import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AppHeader } from "@/components/app-header";
import { useLocation } from "wouter";

export default function UploadExtratoSimplePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for bank statements - only recent ones
  const { data: allBankStatements = [], isLoading } = useQuery({
    queryKey: ['/api/processing-results', 'bank_statement'],
    queryFn: async () => {
      const response = await fetch('/api/processing-results?type=bank_statement');
      return response.json();
    },
  });

  // Show only current session uploads (last 5 minutes)
  const bankStatements = allBankStatements.filter((statement: any) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(statement.processedAt) > fiveMinutesAgo;
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('documentType', 'bank_statement');
      // Let server handle demo user creation automatically

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha no upload');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload realizado com sucesso",
        description: "Seus extratos bancários estão sendo processados.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/processing-results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao enviar arquivos",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList) => {
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Processado</Badge>;
      case 'processing':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Processando...</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const completedStatementsCount = bankStatements.filter((s: any) => s.file?.status === 'completed').length;
  const hasCompletedStatements = completedStatementsCount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Upload de Extratos Bancários" />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Importar Extratos Bancários</h1>
          <p className="text-gray-600">Faça upload dos seus extratos bancários para reconciliação</p>
        </div>
        <Button 
          onClick={() => setLocation('/')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Extratos Bancários</CardTitle>
          <CardDescription>
            Aceita arquivos CSV, PDF ou XLS de extratos bancários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 hover:bg-gray-50 transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf,.csv,.xls,.xlsx"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="extrato-upload"
              disabled={uploadMutation.isPending}
            />
            <label htmlFor="extrato-upload" className="cursor-pointer block">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Arraste extratos bancários ou clique para selecionar
              </p>
              <p className="text-gray-600 mb-4">PDF, CSV, XLS, XLSX - Até 10MB por arquivo</p>
            </label>
            <Button 
              type="button" 
              variant="outline" 
              disabled={uploadMutation.isPending}
              onClick={() => document.getElementById('extrato-upload')?.click()}
            >
              {uploadMutation.isPending ? 'Enviando...' : 'Selecionar Extratos Bancários'}
            </Button>
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
                      </div>
                    )}
                    
                    {/* Show first few transactions */}
                    {statement.extractedData?.transactions && statement.extractedData.transactions.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <div className="text-xs font-medium text-gray-700 mb-2">Primeiras transações:</div>
                        <div className="space-y-1">
                          {statement.extractedData.transactions.slice(0, 3).map((transaction: any, index: number) => (
                            <div key={index} className="flex justify-between text-xs">
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

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={() => setLocation('/upload-pix-simple')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar: Comprovantes PIX
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                {bankStatements.length > 0 ? 
                  `${completedStatementsCount} de ${bankStatements.length} extratos processados` :
                  'Nenhum extrato importado ainda'
                }
              </div>
              <Button 
                onClick={() => setLocation('/reconciliacao-simple')}
                disabled={!hasCompletedStatements}
                className="flex items-center gap-2"
              >
                Iniciar Reconciliação
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}