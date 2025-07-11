import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertTriangle, Clock, ArrowRight, FileText, Building2, Link, Unlink, TrendingUp, DollarSign, Users, Target } from "lucide-react";

interface ReconciliationMatch {
  id: string;
  pixReceipt: {
    id: number;
    amount: string;
    payerName: string;
    payerDocument: string;
    transactionId: string;
    transactionDate: string;
    confidence: number;
  };
  bankTransaction: {
    id: number;
    amount: string;
    description: string;
    transactionDate: string;
    transactionId: string;
    confidence: number;
  };
  matchConfidence: number;
  status: 'auto_matched' | 'manual_review' | 'no_match' | 'pending';
  matchedAt?: string;
}

interface ReconciliationDashboardProps {
  matches: ReconciliationMatch[];
  stats: {
    totalTransactions: number;
    autoMatched: number;
    pendingReview: number;
    unmatched: number;
    totalAmount: number;
    reconciledAmount: number;
  };
}

export function ReconciliationDashboard({ matches, stats }: ReconciliationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'auto_matched':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'manual_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no_match':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_matched':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'manual_review':
        return <AlertTriangle className="h-4 w-4" />;
      case 'no_match':
        return <Unlink className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'auto_matched':
        return 'Conciliado Automaticamente';
      case 'manual_review':
        return 'Revisão Manual';
      case 'no_match':
        return 'Sem Correspondência';
      default:
        return 'Pendente';
    }
  };

  const reconciliationRate = stats.totalTransactions > 0 ? 
    Math.round(((stats.autoMatched + stats.pendingReview) / stats.totalTransactions) * 100) : 0;

  const amountReconciliationRate = stats.totalAmount > 0 ? 
    Math.round((stats.reconciledAmount / stats.totalAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conciliado Automaticamente</p>
                <p className="text-3xl font-bold text-green-700">{stats.autoMatched}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Conciliado</p>
                <p className="text-3xl font-bold text-blue-700">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(stats.reconciledAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Precisão</p>
                <p className="text-3xl font-bold text-purple-700">{reconciliationRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso da Conciliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Conciliação por Quantidade</span>
                <span>{reconciliationRate}% conciliado</span>
              </div>
              <Progress value={reconciliationRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Conciliação por Valor</span>
                <span>{amountReconciliationRate}% conciliado</span>
              </div>
              <Progress value={amountReconciliationRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reconciliation View */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="auto_matched">Auto Conciliado ({stats.autoMatched})</TabsTrigger>
          <TabsTrigger value="manual_review">Revisão Manual ({stats.pendingReview})</TabsTrigger>
          <TabsTrigger value="unmatched">Não Conciliado ({stats.unmatched})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo das Conciliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-green-800 mb-1">Conciliado</h3>
                  <p className="text-2xl font-bold text-green-700">{stats.autoMatched}</p>
                  <p className="text-sm text-green-600">Automaticamente</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-1">Revisão</h3>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pendingReview}</p>
                  <p className="text-sm text-yellow-600">Manual necessária</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Unlink className="h-12 w-12 text-red-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-red-800 mb-1">Pendente</h3>
                  <p className="text-2xl font-bold text-red-700">{stats.unmatched}</p>
                  <p className="text-sm text-red-600">Sem correspondência</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto_matched" className="space-y-4">
          {matches.filter(match => match.status === 'auto_matched').map((match) => (
            <Card key={match.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* PIX Receipt */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Comprovante PIX</h4>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <p className="text-lg font-bold text-blue-900">{match.pixReceipt.amount}</p>
                      <p className="text-sm text-blue-700">{match.pixReceipt.payerName}</p>
                      <p className="text-xs text-blue-600">{new Date(match.pixReceipt.transactionDate).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-blue-600">ID: {match.pixReceipt.transactionId.slice(0, 20)}...</p>
                    </div>
                  </div>

                  {/* Match Indicator */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Link className="h-6 w-6 text-green-600" />
                    </div>
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusIcon(match.status)}
                      <span className="ml-1">{getStatusText(match.status)}</span>
                    </Badge>
                    <p className="text-xs text-gray-500">{match.matchConfidence}% confiança</p>
                  </div>

                  {/* Bank Transaction */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Extrato Bancário</h4>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg space-y-2">
                      <p className="text-lg font-bold text-green-900">{match.bankTransaction.amount}</p>
                      <p className="text-sm text-green-700">{match.bankTransaction.description}</p>
                      <p className="text-xs text-green-600">{new Date(match.bankTransaction.transactionDate).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-green-600">ID: {match.bankTransaction.transactionId.slice(0, 20)}...</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="manual_review" className="space-y-4">
          {matches.filter(match => match.status === 'manual_review').map((match) => (
            <Card key={match.id} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* PIX Receipt */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Comprovante PIX</h4>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <p className="text-lg font-bold text-blue-900">{match.pixReceipt.amount}</p>
                      <p className="text-sm text-blue-700">{match.pixReceipt.payerName}</p>
                      <p className="text-xs text-blue-600">{new Date(match.pixReceipt.transactionDate).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Match Indicator */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusIcon(match.status)}
                      <span className="ml-1">{getStatusText(match.status)}</span>
                    </Badge>
                    <p className="text-xs text-gray-500">{match.matchConfidence}% confiança</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Confirmar
                      </Button>
                      <Button size="sm" variant="outline">
                        Rejeitar
                      </Button>
                    </div>
                  </div>

                  {/* Bank Transaction */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Possível Correspondência</h4>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
                      <p className="text-lg font-bold text-yellow-900">{match.bankTransaction.amount}</p>
                      <p className="text-sm text-yellow-700">{match.bankTransaction.description}</p>
                      <p className="text-xs text-yellow-600">{new Date(match.bankTransaction.transactionDate).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unmatched" className="space-y-4">
          {matches.filter(match => match.status === 'no_match').map((match) => (
            <Card key={match.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PIX Receipt */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Comprovante PIX Não Conciliado</h4>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg space-y-2">
                      <p className="text-lg font-bold text-red-900">{match.pixReceipt.amount}</p>
                      <p className="text-sm text-red-700">{match.pixReceipt.payerName}</p>
                      <p className="text-xs text-red-600">{new Date(match.pixReceipt.transactionDate).toLocaleString('pt-BR')}</p>
                    </div>
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusIcon(match.status)}
                      <span className="ml-1">{getStatusText(match.status)}</span>
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="text-center">
                      <Unlink className="h-12 w-12 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-4">
                        Nenhuma correspondência encontrada no extrato bancário
                      </p>
                      <Button variant="outline" size="sm">
                        Buscar Manualmente
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}