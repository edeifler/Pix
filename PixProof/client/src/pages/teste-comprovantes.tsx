import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { Upload, FileText, Home, Eye, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface TestResult {
  success: boolean;
  ocrText?: string;
  extractedData?: any;
  confidence?: number;
  error?: string;
  processingTime?: number;
}

export default function TesteComprovantes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<{
    pix: FileList | null;
    bank: FileList | null;
  }>({
    pix: null,
    bank: null
  });
  const [testResults, setTestResults] = useState<{
    pix: TestResult[];
    bank: TestResult[];
  }>({
    pix: [],
    bank: []
  });
  const [reconciliationResults, setReconciliationResults] = useState<any>(null);

  const processTestFiles = useMutation({
    mutationFn: async ({ files, type }: { files: FileList; type: 'pix' | 'bank' }) => {
      const results: TestResult[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('files', file);
        formData.append('documentType', type === 'pix' ? 'pix_receipt' : 'bank_statement');

        const startTime = Date.now();
        
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const processingTime = Date.now() - startTime;

          if (!response.ok) {
            throw new Error(`Failed to process ${file.name}`);
          }

          const data = await response.json();
          results.push({
            success: true,
            ocrText: data.results?.[0]?.ocrText,
            extractedData: data.results?.[0]?.extractedData,
            confidence: data.results?.[0]?.confidence || 0,
            processingTime
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: Date.now() - startTime
          });
        }
      }
      
      return { type, results };
    },
    onSuccess: ({ type, results }) => {
      setTestResults(prev => ({
        ...prev,
        [type]: results
      }));
      
      toast({
        title: "Teste concluído",
        description: `${results.length} arquivo(s) processado(s) com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao processar arquivos de teste.",
        variant: "destructive",
      });
    },
  });

  const performReconciliation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/reconciliation/perform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pixResults: testResults.pix,
          bankResults: testResults.bank
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro na reconciliação');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setReconciliationResults(data);
      toast({
        title: "Reconciliação concluída!",
        description: `${data.autoMatched} correspondências automáticas, ${data.manualReview} para revisão manual`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na reconciliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (type: 'pix' | 'bank', files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setSelectedFiles(prev => ({
      ...prev,
      [type]: files
    }));
  };

  const runTest = (type: 'pix' | 'bank') => {
    const files = selectedFiles[type];
    if (!files || files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: `Selecione arquivos ${type === 'pix' ? 'PIX' : 'de extrato bancário'} para testar.`,
        variant: "destructive",
      });
      return;
    }

    processTestFiles.mutate({ files, type });
  };

  const downloadSampleFiles = () => {
    // Create sample PIX receipt content
    const samplePixContent = `COMPROVANTE PIX

TRANSFERÊNCIA ENVIADA
Data/Hora: 15/07/2025 14:30:00
Valor: R$ 1.250,00

De: João Silva
CPF: 123.456.789-00

Para: Maria Santos  
CPF: 987.654.321-00
Banco: Banco do Brasil

ID da Transação: E1234567890123456789012345678901234
Chave PIX: maria.santos@email.com

OPERAÇÃO REALIZADA COM SUCESSO`;

    const sampleBankContent = `EXTRATO BANCÁRIO
Banco do Brasil - Agência 1234-5

Período: 15/07/2025 a 15/07/2025
Conta: 12345-6

15/07/2025 | PIX RECEBIDO | MARIA SANTOS | R$ 1.250,00 | CRÉDITO
15/07/2025 | TED ENVIADA | EMPRESA XYZ | R$ 850,00 | DÉBITO  
15/07/2025 | DEPÓSITO | JOÃO SILVA | R$ 500,00 | CRÉDITO

Saldo Final: R$ 3.125,00`;

    // Create downloadable files
    const pixBlob = new Blob([samplePixContent], { type: 'text/plain' });
    const bankBlob = new Blob([sampleBankContent], { type: 'text/plain' });

    const pixUrl = URL.createObjectURL(pixBlob);
    const bankUrl = URL.createObjectURL(bankBlob);

    // Download PIX sample
    const pixLink = document.createElement('a');
    pixLink.href = pixUrl;
    pixLink.download = 'comprovante-pix-exemplo.txt';
    pixLink.click();

    // Download Bank sample
    setTimeout(() => {
      const bankLink = document.createElement('a');
      bankLink.href = bankUrl;
      bankLink.download = 'extrato-bancario-exemplo.txt';
      bankLink.click();
      
      // Cleanup
      URL.revokeObjectURL(pixUrl);
      URL.revokeObjectURL(bankUrl);
    }, 100);

    toast({
      title: "Arquivos de exemplo baixados",
      description: "Use estes arquivos para testar o sistema.",
    });
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 80) return { color: 'text-green-600', label: 'Alta' };
    if (confidence >= 60) return { color: 'text-yellow-600', label: 'Média' };
    return { color: 'text-red-600', label: 'Baixa' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Teste de Comprovantes</h1>
          </div>

          {/* Info Section */}
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileText className="h-5 w-5" />
                Sistema de Teste com Documentos Reais
              </CardTitle>
              <CardDescription className="text-blue-700">
                Use esta ferramenta para testar a precisão do OCR e extração de dados com seus próprios comprovantes PIX e extratos bancários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={downloadSampleFiles}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Arquivos de Exemplo
                </Button>
                <div className="text-sm text-blue-700">
                  <p><strong>Formatos aceitos:</strong> PDF, PNG, JPG, TXT</p>
                  <p><strong>Tamanho máximo:</strong> 10MB por arquivo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pix" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pix">Comprovantes PIX</TabsTrigger>
              <TabsTrigger value="bank">Extratos Bancários</TabsTrigger>
            </TabsList>

            {/* PIX Testing Tab */}
            <TabsContent value="pix">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload de Comprovantes PIX
                    </CardTitle>
                    <CardDescription>
                      Selecione um ou mais comprovantes PIX para teste
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="pix-files">Arquivos PIX</Label>
                      <Input
                        id="pix-files"
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={(e) => handleFileUpload('pix', e.target.files)}
                        className="mt-2"
                      />
                    </div>
                    
                    {selectedFiles.pix && (
                      <div className="text-sm text-gray-600">
                        {selectedFiles.pix.length} arquivo(s) selecionado(s)
                      </div>
                    )}

                    <Button
                      onClick={() => runTest('pix')}
                      disabled={processTestFiles.isPending || !selectedFiles.pix}
                      className="w-full"
                    >
                      {processTestFiles.isPending ? "Processando..." : "Testar Comprovantes PIX"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Results Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Resultados do Teste PIX
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.pix.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum teste realizado ainda
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {testResults.pix.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium">Arquivo {index + 1}</span>
                              </div>
                              {result.confidence && (
                                <Badge variant="outline" className={formatConfidence(result.confidence).color}>
                                  Confiança: {formatConfidence(result.confidence).label} ({result.confidence}%)
                                </Badge>
                              )}
                            </div>
                            
                            {result.success ? (
                              <div className="space-y-2 text-sm">
                                {result.extractedData && (
                                  <div>
                                    <strong>Dados Extraídos:</strong>
                                    <div className="mt-1 bg-gray-50 p-2 rounded text-xs">
                                      <p><strong>Valor:</strong> {result.extractedData.amount || 'N/A'}</p>
                                      <p><strong>Pagador:</strong> {result.extractedData.payerName || 'N/A'}</p>
                                      <p><strong>CPF:</strong> {result.extractedData.payerDocument || 'N/A'}</p>
                                      <p><strong>Data:</strong> {result.extractedData.transactionDate || 'N/A'}</p>
                                    </div>
                                  </div>
                                )}
                                <p><strong>Tempo de processamento:</strong> {result.processingTime}ms</p>
                              </div>
                            ) : (
                              <p className="text-red-600 text-sm">{result.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bank Testing Tab */}
            <TabsContent value="bank">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload de Extratos Bancários
                    </CardTitle>
                    <CardDescription>
                      Selecione um ou mais extratos bancários para teste
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="bank-files">Arquivos de Extrato</Label>
                      <Input
                        id="bank-files"
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                        onChange={(e) => handleFileUpload('bank', e.target.files)}
                        className="mt-2"
                      />
                    </div>
                    
                    {selectedFiles.bank && (
                      <div className="text-sm text-gray-600">
                        {selectedFiles.bank.length} arquivo(s) selecionado(s)
                      </div>
                    )}

                    <Button
                      onClick={() => runTest('bank')}
                      disabled={processTestFiles.isPending || !selectedFiles.bank}
                      className="w-full"
                    >
                      {processTestFiles.isPending ? "Processando..." : "Testar Extratos Bancários"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Results Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Resultados do Teste Bancário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.bank.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum teste realizado ainda
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {testResults.bank.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium">Arquivo {index + 1}</span>
                              </div>
                              {result.confidence && (
                                <Badge variant="outline" className={formatConfidence(result.confidence).color}>
                                  Confiança: {formatConfidence(result.confidence).label} ({result.confidence}%)
                                </Badge>
                              )}
                            </div>
                            
                            {result.success ? (
                              <div className="space-y-2 text-sm">
                                {result.extractedData && (
                                  <div>
                                    <strong>Transações Encontradas:</strong>
                                    <div className="mt-1 bg-gray-50 p-2 rounded text-xs">
                                      {result.extractedData.transactions ? (
                                        <p>{result.extractedData.transactions.length} transação(ões) identificada(s)</p>
                                      ) : (
                                        <p>Dados estruturados extraídos</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <p><strong>Tempo de processamento:</strong> {result.processingTime}ms</p>
                              </div>
                            ) : (
                              <p className="text-red-600 text-sm">{result.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Test Summary */}
          {(testResults.pix.length > 0 || testResults.bank.length > 0) && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Resumo dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.pix.length + testResults.bank.length}
                    </div>
                    <div className="text-sm text-gray-600">Total de Arquivos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {[...testResults.pix, ...testResults.bank].filter(r => r.success).length}
                    </div>
                    <div className="text-sm text-gray-600">Processados com Sucesso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {[...testResults.pix, ...testResults.bank].filter(r => !r.success).length}
                    </div>
                    <div className="text-sm text-gray-600">Com Erro</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round([...testResults.pix, ...testResults.bank]
                        .filter(r => r.confidence)
                        .reduce((acc, r) => acc + (r.confidence || 0), 0) / 
                        [...testResults.pix, ...testResults.bank].filter(r => r.confidence).length) || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Confiança Média</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reconciliation Section */}
          {testResults.pix.length > 0 && testResults.bank.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Reconciliação Inteligente
                </CardTitle>
                <CardDescription>
                  Compare comprovantes PIX com extratos bancários para encontrar correspondências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {testResults.pix.length} comprovante(s) PIX • {testResults.bank.length} extrato(s) bancário(s)
                      </p>
                    </div>
                    <Button
                      onClick={() => performReconciliation.mutate()}
                      disabled={performReconciliation.isPending}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {performReconciliation.isPending ? "Conciliando..." : "Realizar Reconciliação"}
                    </Button>
                  </div>

                  {/* Reconciliation Results */}
                  {reconciliationResults && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold">Resultados da Reconciliação:</h4>
                      
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {reconciliationResults.autoMatched}
                          </div>
                          <div className="text-sm text-green-700">Correspondências Automáticas</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {reconciliationResults.manualReview}
                          </div>
                          <div className="text-sm text-yellow-700">Revisão Manual</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {reconciliationResults.unmatched}
                          </div>
                          <div className="text-sm text-red-700">Sem Correspondência</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round((reconciliationResults.autoMatched / reconciliationResults.totalPixReceipts) * 100)}%
                          </div>
                          <div className="text-sm text-blue-700">Taxa de Sucesso</div>
                        </div>
                      </div>

                      {/* Match Details */}
                      <div className="space-y-3">
                        <h5 className="font-medium">Correspondências Encontradas:</h5>
                        {reconciliationResults.matches.map((match: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={match.status === 'auto_matched' ? 'default' : 'secondary'}>
                                {match.status === 'auto_matched' ? 'Automática' : 'Revisão Manual'}
                              </Badge>
                              <div className="text-sm text-gray-600">
                                Confiança: {Math.round(match.matchConfidence)}%
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-green-600">PIX:</p>
                                <p className="text-sm">Valor: {match.pixReceipt.amount}</p>
                                <p className="text-sm">Pagador: {match.pixReceipt.payerName}</p>
                              </div>
                              <div>
                                <p className="font-medium text-blue-600">Extrato:</p>
                                <p className="text-sm">Valor: {match.bankTransaction.amount}</p>
                                <p className="text-sm">Descrição: {match.bankTransaction.description}</p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Motivos: {match.matchReasons.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}