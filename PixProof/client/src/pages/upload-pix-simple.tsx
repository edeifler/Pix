import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, ArrowRight, CheckCircle, AlertCircle, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AppHeader } from "@/components/app-header";
import { ClearDataButton } from "@/components/clear-data-button";
import { useLocation } from "wouter";

export default function UploadPixSimplePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for PIX receipts
  const { data: pixReceipts, isLoading } = useQuery({
    queryKey: ['processing-results', 'pix_receipt'],
    queryFn: async () => {
      const response = await fetch('/api/processing-results?type=pix_receipt');
      if (!response.ok) {
        throw new Error('Failed to fetch PIX receipts');
      }
      return response.json();
    },
    refetchInterval: 2000,
  });

  // Show current session uploads (last 10 minutes to give more time to see results)
  const recentUploads = Array.isArray(pixReceipts) ? pixReceipts.filter((receipt: any) => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return new Date(receipt.processedAt) > tenMinutesAgo;
  }) : [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      console.log('Upload iniciado com arquivos:', Array.from(files).map(f => f.name));
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        console.log('Adicionando arquivo:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);
        formData.append('files', file);
      });
      formData.append('documentType', 'pix_receipt');

      console.log('Enviando requisição para /api/upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro no upload:', error);
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload bem-sucedido:', result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload realizado com sucesso",
        description: `${data.files?.length || 1} arquivo(s) enviado(s) e sendo processado(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ['processing-results', 'pix_receipt'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload dos arquivos.",
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

  const completedPixCount = pixReceipts?.filter((r: any) => r.file?.status === 'completed').length;
  const hasCompletedPix = completedPixCount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Upload de Comprovantes PIX" />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Importar Comprovantes PIX</h1>
          <p className="text-gray-600">Faça upload dos seus comprovantes PIX para reconciliação</p>
        </div>
        <div className="flex gap-2">
          <ClearDataButton />
          <Button 
            onClick={() => setLocation('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Comprovantes PIX</CardTitle>
          <CardDescription>
            Aceita arquivos PDF, JPG, PNG de comprovantes PIX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-gray-50 transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="pix-upload"
              disabled={uploadMutation.isPending}
            />
            <label htmlFor="pix-upload" className="cursor-pointer block">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Arraste comprovantes PIX ou clique para selecionar
              </p>
              <p className="text-gray-600 mb-4">PDF, JPG, PNG - Até 10MB por arquivo</p>
            </label>
            <Button 
              type="button" 
              variant="outline" 
              disabled={uploadMutation.isPending}
              onClick={() => document.getElementById('pix-upload')?.click()}
            >
              {uploadMutation.isPending ? 'Enviando...' : 'Selecionar Comprovantes PIX'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PIX Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Comprovantes PIX Importados ({recentUploads?.length || 0})</CardTitle>
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
          ) : recentUploads?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum comprovante PIX</h3>
              <p className="text-gray-600 mb-4">Faça upload dos seus comprovantes PIX para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUploads?.map((receipt: any) => (
                <div key={receipt.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <FileText className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {receipt.file?.originalName || 'Comprovante PIX'}
                      </h3>
                      {getStatusBadge(receipt.file?.status)}
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Valor:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {receipt.amount || receipt.extractedData?.amount || 'Processando...'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Pagador:</span>
                        <span className="ml-2">
                          {receipt.payerName || receipt.extractedData?.payerName || 'Processando...'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">CPF:</span>
                        <span className="ml-2 font-mono text-xs">
                          {receipt.payerDocument || receipt.extractedData?.payerDocument || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Data:</span>
                        <span className="ml-2">
                          {receipt.transactionDate ? 
                            new Date(receipt.transactionDate).toLocaleDateString('pt-BR') :
                            receipt.extractedData?.transactionDate ? 
                            new Date(receipt.extractedData.transactionDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Banco:</span>
                        <span className="ml-2">
                          {receipt.extractedData?.bankName || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Confiança:</span>
                        <span className="ml-2">
                          <Badge variant={
                            (Number(receipt.confidence) || receipt.extractedData?.confidence || 0) > 80 ? "default" :
                            (Number(receipt.confidence) || receipt.extractedData?.confidence || 0) > 50 ? "secondary" : "destructive"
                          }>
                            {Math.round(Number(receipt.confidence) || receipt.extractedData?.confidence || 0)}%
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={() => setLocation('/dashboard')}
            >
              Voltar ao Dashboard
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                {recentUploads?.length > 0 ? 
                  `${recentUploads?.length} comprovantes processados nesta sessão` :
                  'Nenhum comprovante importado ainda'
                }
              </div>
              <Button 
                onClick={() => setLocation('/upload-extrato-simple')}
                disabled={!hasCompletedPix}
                className="flex items-center gap-2"
              >
                Próximo: Importar Extratos Bancários
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