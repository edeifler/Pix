import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Database, 
  BarChart, 
  Target,
  HelpCircle,
  BookOpen,
  Video,
  Award
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  route?: string;
}

export default function TutorialGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'upload-pix',
      title: 'Upload de Comprovantes PIX',
      description: 'Aprenda a enviar seus comprovantes PIX para o sistema',
      action: 'Fazer upload de um comprovante PIX',
      completed: completedSteps.includes('upload-pix'),
      route: '/upload-pix-simple'
    },
    {
      id: 'upload-extrato',
      title: 'Upload de Extratos Bancários',
      description: 'Envie seus extratos bancários para reconciliação',
      action: 'Fazer upload de um extrato bancário',
      completed: completedSteps.includes('upload-extrato'),
      route: '/upload-extrato-simple'
    },
    {
      id: 'reconciliacao',
      title: 'Reconciliação Automática',
      description: 'Veja como o sistema encontra correspondências automaticamente',
      action: 'Executar reconciliação',
      completed: completedSteps.includes('reconciliacao'),
      route: '/reconciliacao-simple'
    },
    {
      id: 'analytics',
      title: 'Analytics Avançados',
      description: 'Explore métricas detalhadas e insights financeiros',
      action: 'Visualizar analytics',
      completed: completedSteps.includes('analytics'),
      route: '/analytics'
    },
    {
      id: 'batch',
      title: 'Reconciliação em Lote',
      description: 'Processe múltiplos arquivos simultaneamente',
      action: 'Configurar job em lote',
      completed: completedSteps.includes('batch'),
      route: '/batch-reconciliation'
    }
  ];

  const progressPercentage = (completedSteps.length / tutorialSteps.length) * 100;

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const navigateToStep = (route: string) => {
    window.location.href = route;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Tutorial Interativo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guia Completo do PixConcilia
          </DialogTitle>
          <DialogDescription>
            Tutorial passo a passo para dominar todas as funcionalidades da plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Progresso do Tutorial</span>
                <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
                  {completedSteps.length}/{tutorialSteps.length} concluídos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completado</span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>
              
              {progressPercentage === 100 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Parabéns! Você completou todo o tutorial do PixConcilia!
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tutorial Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Etapas do Tutorial</h3>
            
            {tutorialSteps.map((step, index) => (
              <Card key={step.id} className={`transition-all ${step.completed ? 'border-green-200 bg-green-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : index === currentStep 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {step.completed ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Concluído
                        </Badge>
                      ) : (
                        <>
                          <Button
                            onClick={() => markStepCompleted(step.id)}
                            variant="outline"
                            size="sm"
                          >
                            Marcar como Concluído
                          </Button>
                          {step.route && (
                            <Button
                              onClick={() => navigateToStep(step.route!)}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              {step.action}
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigateToStep('/upload-pix-simple')}
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Início Rápido
                </Button>
                
                <Button 
                  onClick={() => navigateToStep('/analytics')}
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <BarChart className="h-4 w-4" />
                  Ver Analytics
                </Button>
                
                <Button 
                  onClick={() => navigateToStep('/batch-reconciliation')}
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Lote Avançado
                </Button>
                
                <Button 
                  onClick={() => navigateToStep('/reconciliacao-simple')}
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Reconciliação
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos de Ajuda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Vídeos Tutoriais</p>
                      <p className="text-sm text-gray-600">Assista aos vídeos explicativos detalhados</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Assistir</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">FAQ</p>
                      <p className="text-sm text-gray-600">Perguntas frequentes e respostas</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Ver FAQ</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Documentação</p>
                      <p className="text-sm text-gray-600">Guia completo de todas as funcionalidades</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Ler Docs</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Dicas e Melhores Práticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Dica:</strong> Para melhores resultados, use arquivos com boa qualidade de imagem e texto legível.
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Otimização:</strong> Use a reconciliação em lote para processar múltiplos arquivos mais eficientemente.
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Analytics:</strong> Monitore as métricas de reconciliação para identificar padrões e melhorar a precisão.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}