import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AdvancedFileUpload } from "@/components/ui/advanced-file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, maskCPF } from "@/lib/utils";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Upload
} from "lucide-react";

export default function UploadPixPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing PIX receipts from dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const params = new URLSearchParams(window.location.search);
      const userId = localStorage.getItem('userId') || '20'; // Use stored userId
      const response = await fetch(`/api/dashboard?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
  });

  // Get fresh data for PIX receipts using a separate query
  const { data: pixReceiptsData, refetch: refetchPixReceipts } = useQuery({
    queryKey: ['/api/processing-results', 'pix_receipt'],
    queryFn: async () => {
      const userId = localStorage.getItem('userId') || 'demo-user-2025';
      const response = await fetch(`/api/processing-results?type=pix_receipt&userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch PIX receipts');
      }
      return response.json();
    },
    enabled: !!dashboardData,
  });

  const pixReceipts = Array.isArray(pixReceiptsData) ? pixReceiptsData : [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files }: { files: FileList }) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('documentType', 'pix_receipt');
      
      // Add userId from localStorage
      const userId = localStorage.getItem('userId') || '20';
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload realizado com sucesso",
        description: "Seus comprovantes PIX estão sendo processados.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/processing-results', 'pix_receipt'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      refetchPixReceipts();
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

  const processedCount = pixReceipts.filter((receipt: any) => receipt.file?.status === 'completed').length;
  const canProceedToExtract = processedCount > 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Upload de Comprovantes PIX</h1>
        <p className="text-gray-600 mt-2">
          Faça upload dos seus comprovantes PIX para iniciar o processo de reconciliação
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Fazer Upload de Comprovantes PIX
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedFileUpload
            onFileUpload={(files) => handleFileUpload(files)}
            isUploading={uploadMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* PIX Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Comprovantes PIX Importados ({pixReceipts.length})</CardTitle>
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
          ) : pixReceipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum comprovante PIX</h3>
              <p className="text-gray-600 mb-4">Faça upload dos seus comprovantes PIX para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pixReceipts.map((receipt: any) => (
                <div key={receipt.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <FileText className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {receipt.file?.name || 'Arquivo PIX'}
                      </h3>
                      {getStatusBadge(receipt.file.status)}
                    </div>
                    {receipt.extractedData && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Valor:</span>
                          <span className="ml-2 text-green-600 font-semibold">
                            {receipt.extractedData.amount || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Pagador:</span>
                          <span className="ml-2">
                            {receipt.extractedData.payerName || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">CPF:</span>
                          <span className="ml-2">
                            {receipt.extractedData.payerDocument ? 
                              maskCPF(receipt.extractedData.payerDocument) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Data:</span>
                          <span className="ml-2">
                            {receipt.extractedData.transactionDate ? 
                              formatDate(receipt.extractedData.transactionDate) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ID Transação:</span>
                          <span className="ml-2 font-mono text-xs">
                            {receipt.extractedData.transactionId?.substring(0, 20) || 'N/A'}...
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Confiança:</span>
                          <span className="ml-2">
                            <Progress value={receipt.confidence || 0} className="w-16 h-2 inline-block mr-2" />
                            {receipt.confidence || 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Button */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {pixReceipts.length > 0 ? 
                `${processedCount} de ${pixReceipts.length} comprovantes processados` :
                'Nenhum comprovante importado ainda'
              }
            </div>
            <Button 
              onClick={() => setLocation('/upload-extrato')}
              disabled={!canProceedToExtract}
              className="flex items-center gap-2"
            >
              Próximo: Upload Extrato
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}