import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  RefreshCw,
  BarChart3,
  Home
} from "lucide-react";
import { Link } from "wouter";

interface FileUploadState {
  pixFiles: File[];
  bankFiles: File[];
  pixProcessing: boolean;
  bankProcessing: boolean;
  pixResults: any[];
  bankResults: any[];
  reconciliationData: any;
  showResults: boolean;
}

export default function ReconciliacaoCompleta() {
  const { toast } = useToast();
  const [state, setState] = useState<FileUploadState>({
    pixFiles: [],
    bankFiles: [],
    pixProcessing: false,
    bankProcessing: false,
    pixResults: [],
    bankResults: [],
    reconciliationData: null,
    showResults: false
  });
  const [activeTab, setActiveTab] = useState("upload");

  const handlePixUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setState(prev => ({ ...prev, pixFiles: files, pixProcessing: true }));

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('documentType', 'pix_receipt');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Erro no upload');

      const results = await response.json();
      setState(prev => ({ 
        ...prev, 
        pixResults: results.results,
        pixProcessing: false 
      }));

      toast({
        title: "Comprovantes PIX processados",
        description: `${files.length} arquivo(s) processado(s) com sucesso`,
      });

      // Auto-avançar para próxima etapa
      setActiveTab("extrato");
    } catch (error) {
      setState(prev => ({ ...prev, pixProcessing: false }));
      toast({
        title: "Erro no upload",
        description: "Não foi possível processar os comprovantes PIX",
        variant: "destructive",
      });
    }
  };

  const handleBankUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setState(prev => ({ ...prev, bankFiles: files, bankProcessing: true }));

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('documentType', 'bank_statement');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Erro no upload');

      const results = await response.json();
      setState(prev => ({ 
        ...prev, 
        bankResults: results.results,
        bankProcessing: false 
      }));

      toast({
        title: "Extratos bancários processados",
        description: `${files.length} arquivo(s) processado(s) com sucesso`,
      });

      // Auto-executar reconciliação
      await performReconciliation();
    } catch (error) {
      setState(prev => ({ ...prev, bankProcessing: false }));
      toast({
        title: "Erro no upload",
        description: "Não foi possível processar os extratos bancários",
        variant: "destructive",
      });
    }
  };

  const performReconciliation = async () => {
    try {
      const response = await apiRequest("GET", "/api/reconciliation");
      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        reconciliationData: data,
        showResults: true 
      }));
      
      setActiveTab("resultados");
      
      toast({
        title: "Reconciliação concluída",
        description: `${data.summary.autoMatched} correspondências automáticas encontradas`,
      });
    } catch (error) {
      toast({
        title: "Erro na reconciliação",
        description: "Não foi possível executar a reconciliação",
        variant: "destructive",
      });
    }
  };

  const exportData = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reconciliationData: state.reconciliationData })
      });
      
      if (!response.ok) throw new Error('Erro na exportação');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliacao-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      
      toast({
        title: "Exportação concluída",
        description: `Arquivo ${format.toUpperCase()} baixado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reconciliação Completa</h1>
            <p className="text-gray-600 mt-2">
              Processo unificado: Upload PIX → Extratos → Reconciliação Automática
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">1. Upload PIX</TabsTrigger>
            <TabsTrigger value="extrato">2. Extratos</TabsTrigger>
            <TabsTrigger value="resultados">3. Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload dos Comprovantes PIX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                    onChange={handlePixUpload}
                    className="hidden"
                    id="pix-upload"
                    disabled={state.pixProcessing}
                  />
                  <label htmlFor="pix-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      Clique para selecionar comprovantes PIX
                    </p>
                    <p className="text-sm text-gray-500">
                      Suporte a PDF, JPG, PNG e TXT
                    </p>
                  </label>
                </div>

                {state.pixProcessing && (
                  <div className="mt-4">
                    <Progress value={undefined} className="w-full" />
                    <p className="text-sm text-gray-500 mt-2">Processando comprovantes PIX...</p>
                  </div>
                )}

                {state.pixResults.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {state.pixResults.length} comprovante(s) processado(s)
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extrato" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload dos Extratos Bancários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.csv,.txt"
                    onChange={handleBankUpload}
                    className="hidden"
                    id="bank-upload"
                    disabled={state.bankProcessing}
                  />
                  <label htmlFor="bank-upload" className="cursor-pointer">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      Clique para selecionar extratos bancários
                    </p>
                    <p className="text-sm text-gray-500">
                      Suporte a PDF, CSV e TXT
                    </p>
                  </label>
                </div>

                {state.bankProcessing && (
                  <div className="mt-4">
                    <Progress value={undefined} className="w-full" />
                    <p className="text-sm text-gray-500 mt-2">Processando extratos bancários...</p>
                  </div>
                )}

                {state.bankResults.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {state.bankResults.length} extrato(s) processado(s)
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-6">
            {state.reconciliationData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total PIX</p>
                          <p className="text-2xl font-bold">{state.reconciliationData.summary.totalPixReceipts}</p>
                        </div>
                        <Upload className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Extratos</p>
                          <p className="text-2xl font-bold">{state.reconciliationData.summary.totalBankTransactions}</p>
                        </div>
                        <FileText className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Correspondências</p>
                          <p className="text-2xl font-bold text-green-600">{state.reconciliationData.summary.autoMatched}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Não Conciliados</p>
                          <p className="text-2xl font-bold text-orange-600">{state.reconciliationData.summary.unmatched}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => exportData('excel')} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                  <Button onClick={() => exportData('pdf')} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button onClick={performReconciliation} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Correspondências Encontradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {state.reconciliationData.summary.matches.slice(0, 10).map((match: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">{match.pixReceipt.extractedData?.payerName || 'Nome não identificado'}</p>
                                <p className="text-sm text-gray-500">
                                  PIX: R$ {match.pixReceipt.extractedData?.amount || '0,00'}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium">↔</p>
                                <Progress value={match.matchConfidence} className="w-16 h-2" />
                                <p className="text-xs">{match.matchConfidence}%</p>
                              </div>
                              <div>
                                <p className="font-medium">{match.bankTransaction.extractedData?.description || 'Descrição não identificada'}</p>
                                <p className="text-sm text-gray-500">
                                  Banco: R$ {match.bankTransaction.extractedData?.amount || '0,00'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge variant={match.status === 'auto_matched' ? 'default' : 'secondary'}>
                            {match.status === 'auto_matched' ? 'Automático' : 'Revisão'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Aguardando processamento</p>
                  <p className="text-sm text-gray-500">
                    Faça o upload dos comprovantes PIX e extratos bancários para ver os resultados
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}