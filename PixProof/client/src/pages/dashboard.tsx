import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdvancedFileUpload } from "@/components/ui/advanced-file-upload";
import { ReconciliationDashboard } from "@/components/ui/reconciliation-dashboard";
import { AppHeader } from "@/components/app-header";
import { DatePickerWithRange, QuickFilters } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download, 
  Filter, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  User,
  Calendar,
  BarChart3,
  TrendingUp,
  Database,
  RotateCcw,
  Settings,
  LogOut,
  CreditCard,
  Bell,
  Shield,
  ChevronDown
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths } from "date-fns";

export default function DashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeFilter, setActiveFilter] = useState<string>('thisMonth');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      // Try to load from localStorage first
      const userData = localStorage.getItem("user");
      const companyData = localStorage.getItem("company");
      const subscriptionData = localStorage.getItem("subscription");
      
      if (userData && companyData && subscriptionData) {
        setUser(JSON.parse(userData));
        setCompany(JSON.parse(companyData));
        setSubscription(JSON.parse(subscriptionData));
      } else {
        // If not in localStorage, try to fetch from API (after payment success)
        try {
          const response = await fetch('/api/auth/user', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const authData = await response.json();
            if (authData.user) {
              setUser(authData.user);
              setCompany(authData.company);
              setSubscription(authData.subscription);
              
              // Save to localStorage for future use
              localStorage.setItem("user", JSON.stringify(authData.user));
              localStorage.setItem("company", JSON.stringify(authData.company));
              localStorage.setItem("subscription", JSON.stringify(authData.subscription));
            }
          } else {
            // If no authenticated user, create demo user
            const demoUser = {
              id: 'demo-user-2025',
              username: 'Usuario Demo',
              email: 'demo@pixconcilia.com'
            };
            const demoCompany = {
              name: 'Empresa Demo',
              cnpj: '00.000.000/0001-00'
            };
            const demoSubscription = {
              planType: 'professional',
              documentsLimit: 500,
              currentUsage: 0
            };
            
            setUser(demoUser);
            setCompany(demoCompany);
            setSubscription(demoSubscription);
            
            localStorage.setItem("user", JSON.stringify(demoUser));
            localStorage.setItem("company", JSON.stringify(demoCompany));
            localStorage.setItem("subscription", JSON.stringify(demoSubscription));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fallback to demo user
          const demoUser = {
            id: 'demo-user-2025',
            username: 'Usuario Demo',
            email: 'demo@pixconcilia.com'
          };
          const demoCompany = {
            name: 'Empresa Demo',
            cnpj: '00.000.000/0001-00'
          };
          const demoSubscription = {
            planType: 'professional',
            documentsLimit: 500,
            currentUsage: 0
          };
          
          setUser(demoUser);
          setCompany(demoCompany);
          setSubscription(demoSubscription);
          
          localStorage.setItem("user", JSON.stringify(demoUser));
          localStorage.setItem("company", JSON.stringify(demoCompany));
          localStorage.setItem("subscription", JSON.stringify(demoSubscription));
        }
      }
    };
    
    loadUserData();
    
    // Set default date range to this month
    handleQuickFilter('thisMonth');
  }, []);

  const getDateRangeFromFilter = (filter: string): DateRange => {
    const today = new Date();
    
    switch (filter) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'last7days':
        return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
      case 'last30days':
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'thisYear':
        return { from: startOfYear(today), to: endOfYear(today) };
      default:
        return { from: undefined, to: undefined };
    }
  };

  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setDateRange({ from: undefined, to: undefined });
    } else {
      setDateRange(getDateRangeFromFilter(filter));
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setActiveFilter('custom');
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'starter':
        return 'Plano 1 - Básico';
      case 'professional':
        return 'Plano 2 - Pro';
      case 'enterprise':
        return 'Plano 3 - Premium';
      default:
        return 'Plano Demo';
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/dashboard?userId=${user?.id}`, dateRange?.from, dateRange?.to],
    enabled: !!user?.id,
  });

  const { data: reconciliationData } = useQuery({
    queryKey: [`/api/reconciliation`, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let url = `/api/reconciliation`;
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('dateFrom', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('dateTo', dateRange.to.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ files, documentType }: { files: FileList; documentType: 'pix_receipt' | 'bank_statement' }) => {
      const formData = new FormData();
      formData.append("userId", user.id.toString());
      formData.append("documentType", documentType);
      
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload realizado com sucesso!",
        description: "Redirecionando para confirmação...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation"] });
      
      // Redirect to upload PIX page after successful upload
      setTimeout(() => {
        setLocation("/upload-pix");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList, documentType: 'pix_receipt' | 'bank_statement') => {
    uploadMutation.mutate({ files, documentType });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Carregando dados do usuário...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = (dashboardData as any)?.stats || { thisMonth: 0, reconciled: 0, pending: 0, accuracy: 0 };
  const files = (dashboardData as any)?.files || [];
  const processingResults = (dashboardData as any)?.processingResults || [];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (fileType.includes('image')) return <Image className="h-5 w-5 text-blue-600" />;
    if (fileType.includes('csv')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reconciled':
        return <Badge className="bg-accent text-white"><CheckCircle className="h-3 w-3 mr-1" />Conciliado</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning"><AlertTriangle className="h-3 w-3 mr-1" />Pendente Revisão</Badge>;
      case 'processing':
        return <Badge className="bg-primary"><Clock className="h-3 w-3 mr-1 animate-spin" />Processando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="text-primary h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Este Mês</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="text-accent h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conciliados</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.reconciled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="text-warning h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <AlertTriangle className="text-purple-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa de Acerto</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.accuracy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Filtros por Período</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Filtros Rápidos
                  </label>
                  <QuickFilters 
                    onFilterSelect={handleQuickFilter}
                    activeFilter={activeFilter}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Período Personalizado
                  </label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={handleDateRangeChange}
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {dateRange?.from && dateRange?.to ? (
                      <>
                        Mostrando dados de {dateRange.from.toLocaleDateString('pt-BR')} até {dateRange.to.toLocaleDateString('pt-BR')}
                      </>
                    ) : (
                      'Mostrando todos os dados'
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickFilter('all')}
                    >
                      Limpar Filtros
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/reconciliation"] });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload e Processamento
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Dashboard de Conciliação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upload Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload de Comprovantes</CardTitle>
                    <p className="text-gray-600">Envie comprovantes PIX e extratos bancários para processamento automático</p>
                  </CardHeader>
                  <CardContent>
                    <AdvancedFileUpload 
                      onFileUpload={handleFileUpload}
                      isUploading={uploadMutation.isPending}
                    />
                    
                    {/* New Simple 3-Screen Workflow */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Novo: Fluxo Simplificado de Reconciliação</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Use nosso fluxo de 3 telas para importar PIX, extratos e reconciliar automaticamente
                      </p>
                      <div className="space-y-2">
                        <Button
                          onClick={() => setLocation('/upload-pix-simple')}
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                        >
                          Iniciar Reconciliação Simplificada
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            onClick={() => setLocation('/analytics-advanced')}
                            variant="outline"
                            size="sm"
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Analytics Avançados
                          </Button>
                          
                          <Button 
                            onClick={() => setLocation('/reconciliation-advanced')}
                            variant="outline"
                            size="sm"
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Reconciliação IA
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <Button 
                            onClick={() => setLocation('/analytics')}
                            variant="outline"
                            size="sm"
                          >
                            <Database className="mr-2 h-4 w-4" />
                            Analytics Básicos
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent Uploads */}
                    {files.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium text-gray-900 mb-3">Uploads Recentes</h3>
                        <div className="space-y-3">
                          {files.slice(0, 3).map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getFileIcon(file.fileType)}
                                <div>
                                  <p className="font-medium text-gray-900">{file.originalName}</p>
                                  <p className="text-sm text-gray-600">
                                    {(file.fileSize / 1024 / 1024).toFixed(1)} MB • {file.status}
                                  </p>
                                </div>
                              </div>
                              {file.status === 'processing' && (
                                <div className="flex items-center space-x-2">
                                  <Progress value={65} className="w-32" />
                                  <span className="text-sm text-gray-600">65%</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {processingResults.slice(0, 5).map((result: any) => (
                        <div key={result.id} className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            result.reconciliationStatus === 'reconciled' ? 'bg-green-100' :
                            result.reconciliationStatus === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            {result.reconciliationStatus === 'reconciled' ? 
                              <CheckCircle className="h-4 w-4 text-accent" /> :
                              result.reconciliationStatus === 'pending' ?
                              <AlertTriangle className="h-4 w-4 text-warning" /> :
                              <Clock className="h-4 w-4 text-primary" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {result.reconciliationStatus === 'reconciled' ? 'PIX conciliado automaticamente' :
                               result.reconciliationStatus === 'pending' ? 'Revisão necessária' : 'Processamento iniciado'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {result.amount} • {result.payerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(result.processedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Processing Results Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Resultados de Processamento</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />Exportar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />Filtros
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comprovante</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Pagador</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processingResults.map((result: any) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {getFileIcon(result.file.fileType)}
                              <span className="font-medium">{result.file.originalName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{result.amount}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{result.payerName}</div>
                              <div className="text-sm text-gray-500">{result.payerDocument}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {result.transactionDate && new Date(result.transactionDate).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(result.reconciliationStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">Visualizar</Button>
                              <Button variant="ghost" size="sm">Detalhes</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation">
            {reconciliationData && (reconciliationData as any).matches?.length > 0 ? (
              <ReconciliationDashboard 
                matches={(reconciliationData as any).matches || []}
                stats={(reconciliationData as any).stats || {
                  totalTransactions: 0,
                  autoMatched: 0,
                  pendingReview: 0,
                  unmatched: 0,
                  totalAmount: 0,
                  reconciledAmount: 0
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dados de Conciliação</h3>
                  <p className="text-gray-600 mb-6">
                    Faça upload de comprovantes PIX e extratos bancários para visualizar a conciliação automática.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    {reconciliationData ? 'Nenhuma correspondência encontrada ainda.' : 'Aguardando dados de reconciliação.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
