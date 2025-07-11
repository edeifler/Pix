import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  FileText, 
  Database,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Users
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface BatchSettings {
  autoMatchThreshold: number;
  manualReviewThreshold: number;
  enableLearning: boolean;
  strictMode: boolean;
  rules: {
    amount_exact: boolean;
    amount_tolerance: boolean;
    date_exact: boolean;
    date_tolerance: boolean;
    name_exact: boolean;
    name_similarity: boolean;
    document_exact: boolean;
  };
}

export default function BatchReconciliationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPixFiles, setSelectedPixFiles] = useState<number[]>([]);
  const [selectedBankFiles, setSelectedBankFiles] = useState<number[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [settings, setSettings] = useState<BatchSettings>({
    autoMatchThreshold: 70,
    manualReviewThreshold: 15,
    enableLearning: true,
    strictMode: false,
    rules: {
      amount_exact: true,
      amount_tolerance: true,
      date_exact: true,
      date_tolerance: true,
      name_exact: true,
      name_similarity: true,
      document_exact: true
    }
  });

  // Query for available files
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard');
      return response.json();
    },
  });

  // Query for batch statistics
  const { data: batchStats } = useQuery({
    queryKey: ['/api/reconciliation/batch-stats'],
    queryFn: async () => {
      const response = await fetch('/api/reconciliation/batch-stats');
      return response.json();
    },
  });

  // Query for current job status
  const { data: currentJob, refetch: refetchJob } = useQuery({
    queryKey: ['/api/reconciliation/batch', currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null;
      const response = await fetch(`/api/reconciliation/batch/${currentJobId}`);
      return response.json();
    },
    enabled: !!currentJobId,
    refetchInterval: currentJobId ? 2000 : false, // Poll every 2 seconds when job is active
  });

  // Mutation for creating batch job
  const createBatchJob = useMutation({
    mutationFn: async ({ pixFileIds, bankFileIds, settings }: any) => {
      const response = await fetch('/api/reconciliation/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixFileIds, bankFileIds, settings }),
      });
      if (!response.ok) throw new Error('Erro ao criar job em lote');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      toast({
        title: "Job criado",
        description: "Reconciliação em lote iniciada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar job de reconciliação em lote",
        variant: "destructive",
      });
    },
  });

  const pixFiles = dashboardData?.processingResults?.filter((r: any) => r.documentType === 'pix_receipt') || [];
  const bankFiles = dashboardData?.processingResults?.filter((r: any) => r.documentType === 'bank_statement') || [];

  const handleStartBatchJob = () => {
    if (selectedPixFiles.length === 0 || selectedBankFiles.length === 0) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione pelo menos um arquivo PIX e um extrato bancário",
        variant: "destructive",
      });
      return;
    }

    createBatchJob.mutate({
      pixFileIds: selectedPixFiles,
      bankFileIds: selectedBankFiles,
      settings
    });
  };

  const togglePixFile = (fileId: number) => {
    setSelectedPixFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleBankFile = (fileId: number) => {
    setSelectedBankFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllPixFiles = () => {
    setSelectedPixFiles(pixFiles.map((f: any) => f.fileId));
  };

  const selectAllBankFiles = () => {
    setSelectedBankFiles(bankFiles.map((f: any) => f.fileId));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reconciliação em Lote</h1>
          <p className="text-gray-600">Processe múltiplos arquivos simultaneamente com regras personalizadas</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setLocation('/analytics')} variant="outline">
            Ver Analytics
          </Button>
          <Button onClick={() => setLocation('/dashboard')} variant="outline">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>

      {/* Batch Statistics */}
      {batchStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Jobs Totais</p>
                  <p className="text-2xl font-bold">{batchStats.totalJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold">{batchStats.completedJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa Média</p>
                  <p className="text-2xl font-bold">{batchStats.averageMatchRate?.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold">{((batchStats.averageProcessingTime || 0) / 1000).toFixed(1)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Configuração</TabsTrigger>
          <TabsTrigger value="files">Seleção de Arquivos</TabsTrigger>
          <TabsTrigger value="settings">Regras Avançadas</TabsTrigger>
          <TabsTrigger value="monitor">Monitoramento</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Job Atual</CardTitle>
                <CardDescription>
                  {currentJob ? `Job ID: ${currentJob.id}` : 'Nenhum job em execução'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentJob ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge variant={
                        currentJob.status === 'completed' ? 'default' :
                        currentJob.status === 'failed' ? 'destructive' :
                        'secondary'
                      }>
                        {currentJob.status === 'completed' ? 'Concluído' :
                         currentJob.status === 'failed' ? 'Falhou' :
                         currentJob.status === 'processing' ? 'Processando' : 'Pendente'}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso</span>
                        <span>{currentJob.progress?.current || 0}/{currentJob.progress?.total || 0}</span>
                      </div>
                      <Progress 
                        value={((currentJob.progress?.current || 0) / (currentJob.progress?.total || 1)) * 100} 
                        className="w-full" 
                      />
                      <p className="text-sm text-gray-600 mt-1">{currentJob.progress?.stage}</p>
                    </div>

                    {currentJob.results && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">PIX Processados</p>
                          <p className="text-lg font-bold">{currentJob.results.totalPixReceipts}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Reconciliados</p>
                          <p className="text-lg font-bold text-green-600">
                            {currentJob.results.autoMatched + currentJob.results.manualReview}
                          </p>
                        </div>
                      </div>
                    )}

                    {currentJob.errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-600">{currentJob.errorMessage}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum job em execução</p>
                    <p className="text-sm text-gray-500 mt-1">Configure e inicie um novo job de reconciliação</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controles de Execução</CardTitle>
                <CardDescription>
                  Iniciar e monitorar jobs de reconciliação em lote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={handleStartBatchJob}
                    disabled={createBatchJob.isPending || (currentJob && currentJob.status === 'processing')}
                    className="w-full flex items-center gap-2"
                    size="lg"
                  >
                    {createBatchJob.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {createBatchJob.isPending ? 'Criando Job...' : 'Iniciar Reconciliação em Lote'}
                  </Button>

                  {currentJob && (
                    <Button 
                      onClick={() => refetchJob()}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Atualizar Status
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>PIX selecionados: {selectedPixFiles.length}</div>
                    <div>Extratos selecionados: {selectedBankFiles.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Comprovantes PIX</span>
                  <Button onClick={selectAllPixFiles} variant="outline" size="sm">
                    Selecionar Todos
                  </Button>
                </CardTitle>
                <CardDescription>
                  Selecione os comprovantes PIX para reconciliação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pixFiles.map((file: any) => (
                    <div key={file.fileId} className="flex items-center space-x-3 p-3 border rounded">
                      <Checkbox
                        checked={selectedPixFiles.includes(file.fileId)}
                        onCheckedChange={() => togglePixFile(file.fileId)}
                      />
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">{file.file?.filename || `Arquivo ${file.fileId}`}</p>
                        <p className="text-sm text-gray-600">
                          Processado: {new Date(file.processedAt).toLocaleDateString('pt-BR')}
                        </p>
                        {file.amount && (
                          <p className="text-sm text-green-600">Valor: R$ {file.amount}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{file.confidence || 0}% confiança</Badge>
                    </div>
                  ))}
                  {pixFiles.length === 0 && (
                    <p className="text-gray-600 text-center py-8">Nenhum comprovante PIX encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Extratos Bancários</span>
                  <Button onClick={selectAllBankFiles} variant="outline" size="sm">
                    Selecionar Todos
                  </Button>
                </CardTitle>
                <CardDescription>
                  Selecione os extratos bancários para reconciliação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bankFiles.map((file: any) => (
                    <div key={file.fileId} className="flex items-center space-x-3 p-3 border rounded">
                      <Checkbox
                        checked={selectedBankFiles.includes(file.fileId)}
                        onCheckedChange={() => toggleBankFile(file.fileId)}
                      />
                      <Database className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">{file.file?.filename || `Arquivo ${file.fileId}`}</p>
                        <p className="text-sm text-gray-600">
                          Processado: {new Date(file.processedAt).toLocaleDateString('pt-BR')}
                        </p>
                        {file.extractedData?.transactions && (
                          <p className="text-sm text-blue-600">
                            {file.extractedData.transactions.length} transações
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">{file.confidence || 0}% confiança</Badge>
                    </div>
                  ))}
                  {bankFiles.length === 0 && (
                    <p className="text-gray-600 text-center py-8">Nenhum extrato bancário encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Matching</CardTitle>
                <CardDescription>
                  Ajuste os thresholds para reconciliação automática
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Threshold para Matching Automático: {settings.autoMatchThreshold}%</Label>
                  <Slider
                    value={[settings.autoMatchThreshold]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, autoMatchThreshold: value[0] }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Matches com confiança acima deste valor são aprovados automaticamente
                  </p>
                </div>

                <div>
                  <Label>Threshold para Revisão Manual: {settings.manualReviewThreshold}%</Label>
                  <Slider
                    value={[settings.manualReviewThreshold]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, manualReviewThreshold: value[0] }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Matches com confiança acima deste valor requerem revisão manual
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={settings.enableLearning}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableLearning: !!checked }))}
                    />
                    <Label>Habilitar Aprendizado</Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    O sistema aprende com confirmações de matches para melhorar a precisão
                  </p>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={settings.strictMode}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, strictMode: !!checked }))}
                    />
                    <Label>Modo Rigoroso</Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Aplica critérios mais rígidos para matching automático
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regras de Matching</CardTitle>
                <CardDescription>
                  Selecione as regras a serem aplicadas na reconciliação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.rules).map(([ruleKey, enabled]) => (
                    <div key={ruleKey} className="flex items-center space-x-2">
                      <Checkbox
                        checked={enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({
                            ...prev,
                            rules: { ...prev.rules, [ruleKey]: !!checked }
                          }))
                        }
                      />
                      <Label className="flex-1">
                        {ruleKey === 'amount_exact' && 'Valor Exato'}
                        {ruleKey === 'amount_tolerance' && 'Valor com Tolerância'}
                        {ruleKey === 'date_exact' && 'Data/Hora Exata'}
                        {ruleKey === 'date_tolerance' && 'Data com Tolerância'}
                        {ruleKey === 'name_exact' && 'Nome Exato'}
                        {ruleKey === 'name_similarity' && 'Nome Similar'}
                        {ruleKey === 'document_exact' && 'CPF/CNPJ Exato'}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          {batchStats?.topMatchingRules && batchStats.topMatchingRules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Regras Mais Utilizadas</CardTitle>
                <CardDescription>
                  Análise de quais regras são mais efetivas na reconciliação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batchStats.topMatchingRules.map((rule: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{rule.ruleName}</span>
                      </div>
                      <Badge variant="secondary">{rule.usage} usos</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Performance</CardTitle>
              <CardDescription>
                Métricas de desempenho dos jobs de reconciliação em lote
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Total PIX Processados</p>
                  <p className="text-2xl font-bold">{batchStats?.totalPixReceipts || 0}</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Total Matches</p>
                  <p className="text-2xl font-bold">{batchStats?.totalMatches || 0}</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded">
                  <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Eficiência Geral</p>
                  <p className="text-2xl font-bold">
                    {batchStats?.totalPixReceipts > 0 
                      ? ((batchStats.totalMatches / batchStats.totalPixReceipts) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}