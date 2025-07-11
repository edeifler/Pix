import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  FileText, 
  TrendingUp,
  Filter,
  Trash2,
  ArrowLeft,
  Home
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: string;
  type: 'reconciliation' | 'report' | 'system' | 'warning';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  relatedEntityId?: string;
  actionUrl?: string;
}

export default function NotificacoesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todas");
  const [filterType, setFilterType] = useState<string>("all");

  // Mock data - In real app, this would come from API
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "reconciliation",
      title: "Nova reconciliação concluída",
      message: "5 comprovantes PIX foram reconciliados com sucesso. 4 correspondências automáticas encontradas.",
      isRead: false,
      priority: "medium",
      createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      relatedEntityId: "recon_123",
      actionUrl: "/reconciliacao-simple"
    },
    {
      id: "2",
      type: "warning",
      title: "Transações não reconciliadas",
      message: "3 transações PIX não puderam ser reconciliadas automaticamente. Revisão manual necessária.",
      isRead: false,
      priority: "high",
      createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      relatedEntityId: "recon_124",
      actionUrl: "/reconciliacao-simple"
    },
    {
      id: "3",
      type: "report",
      title: "Relatório mensal pronto",
      message: "Seu relatório de reconciliação de dezembro está disponível para download.",
      isRead: true,
      priority: "low",
      createdAt: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
      relatedEntityId: "report_dec",
      actionUrl: "/analytics"
    },
    {
      id: "4",
      type: "system",
      title: "Upgrade do plano disponível",
      message: "Você usou 180 de 200 consultas. Considere fazer upgrade para o Plano 2 Pro.",
      isRead: true,
      priority: "medium",
      createdAt: new Date(Date.now() - 24 * 60 * 60000), // 1 day ago
      actionUrl: "/signup-simple"
    },
    {
      id: "5",
      type: "reconciliation",
      title: "Processamento em lote concluído",
      message: "Lote de 15 extratos bancários processado. 12 correspondências automáticas, 3 para revisão.",
      isRead: true,
      priority: "medium",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000), // 3 days ago
      relatedEntityId: "batch_456",
      actionUrl: "/reconciliacao-simple"
    }
  ];

  const { data: notifications = mockNotifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  // Filter notifications based on active tab and filter
  const filteredNotifications = (notifications as Notification[])
    .filter((notification: Notification) => {
      if (activeTab === "nao-lidas") return !notification.isRead;
      if (activeTab === "lidas") return notification.isRead;
      return true; // "todas"
    })
    .filter((notification: Notification) => {
      if (filterType === "all") return true;
      return notification.type === filterType;
    })
    .sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = (notifications as Notification[]).filter((n: Notification) => !n.isRead).length;

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificação marcada como lida",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Todas as notificações marcadas como lidas",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificação removida",
      });
    },
  });

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reconciliation':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'report':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const variants = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-red-100 text-red-800"
    };
    
    const labels = {
      low: "Baixa",
      medium: "Média", 
      high: "Alta"
    };

    return (
      <Badge className={variants[priority]}>
        {labels[priority]}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Data inválida";
    }
    
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else if (diffInHours < 48) {
      return "Ontem";
    } else {
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Notificações" showCompanyName={false} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Notificações" showCompanyName={false} />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.history.back()}
                  className="p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="h-8 w-8" />
                  Notificações
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
              </div>
              <p className="text-gray-600 ml-12">
                Mantenha-se atualizado sobre reconciliações, relatórios e atualizações do sistema.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
              >
                Voltar ao Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos os tipos</option>
              <option value="reconciliation">Reconciliação</option>
              <option value="report">Relatórios</option>
              <option value="warning">Avisos</option>
              <option value="system">Sistema</option>
            </select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="todas">
              Todas ({(notifications as Notification[]).length})
            </TabsTrigger>
            <TabsTrigger value="nao-lidas">
              Não lidas ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="lidas">
              Lidas ({(notifications as Notification[]).length - unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    <Bell className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma notificação encontrada
                    </h3>
                    <p className="text-gray-600 text-center">
                      {activeTab === "nao-lidas" 
                        ? "Você não tem notificações não lidas no momento."
                        : "Não há notificações para exibir com os filtros selecionados."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-md ${
                      !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              {getPriorityBadge(notification.priority)}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(notification.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {notification.actionUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={notification.actionUrl}>
                                Ver detalhes
                              </a>
                            </Button>
                          )}
                          
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            disabled={deleteNotificationMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}