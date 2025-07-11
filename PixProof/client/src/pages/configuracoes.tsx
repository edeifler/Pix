import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Download,
  Save,
  AlertCircle,
  Users,
  Plus,
  Home,
  CreditCard,
  ExternalLink,
  Search,
  Filter,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Upload,
  BarChart3,
  Clock,
  MoreVertical,
  Crown,
  Key,
  Activity,
  CheckCircle,
  UserCheck,
  Edit,
  Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  permissions: string[];
  department: string;
  uploadCount: number;
  processedCount: number;
  createdAt?: string;
}

interface EnterpriseManagementTabProps {
  addUserMutation: any;
  newUserForm: any;
  setNewUserForm: any;
  showAddUser: boolean;
  setShowAddUser: any;
  queryClient: any;
}

function EnterpriseManagementTab({ 
  addUserMutation, 
  newUserForm, 
  setNewUserForm, 
  showAddUser, 
  setShowAddUser,
  queryClient
}: EnterpriseManagementTabProps) {
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<EnterpriseUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<EnterpriseUser | null>(null);

  // Buscar usuários da API
  const { data: enterpriseUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/enterprise/users"],
    retry: false,
  });

  useEffect(() => {
    if (enterpriseUsers && Array.isArray(enterpriseUsers)) {
      setUsers(enterpriseUsers as EnterpriseUser[]);
    }
    setLoading(usersLoading);
  }, [enterpriseUsers, usersLoading]);

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: string; data: Partial<EnterpriseUser> }) => {
      const response = await fetch(`/api/enterprise/users/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData.data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "Informações do usuário foram atualizadas com sucesso.",
      });
      setShowEditDialog(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/enterprise/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário removido",
        description: "Usuário foi removido com sucesso.",
      });
      setShowDeleteDialog(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Não foi possível remover o usuário.",
        variant: "destructive",
      });
    },
  });

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      manager: 'Gerente',
      operator: 'Operador',
      viewer: 'Visualizador'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      operator: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departamentos</p>
                <p className="text-2xl font-bold">{Array.from(new Set(users.map(u => u.department))).length}</p>
              </div>
              <Building2 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie usuários e permissões da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Add User */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha as informações para criar uma nova conta de usuário
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newUserName">Nome Completo</Label>
                    <Input
                      id="newUserName"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm((prev: any) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do usuário"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserEmail">E-mail</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm((prev: any) => ({ ...prev, email: e.target.value }))}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserRole">Cargo</Label>
                    <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm((prev: any) => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="operator">Operador</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newUserDepartment">Departamento</Label>
                    <Select value={newUserForm.department} onValueChange={(value) => setNewUserForm((prev: any) => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Contabilidade">Contabilidade</SelectItem>
                        <SelectItem value="Operações">Operações</SelectItem>
                        <SelectItem value="Geral">Geral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => addUserMutation.mutate(newUserForm)}
                    disabled={addUserMutation.isPending}
                  >
                    {addUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando usuários...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {user.uploadCount} uploads
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingUser(user);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteDialog(true);
                          }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editUserName">Nome Completo</Label>
                <Input
                  id="editUserName"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <Label htmlFor="editUserEmail">E-mail</Label>
                <Input
                  id="editUserEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="editUserRole">Cargo</Label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser(prev => prev ? ({ ...prev, role: value as any }) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editUserDepartment">Departamento</Label>
                <Select value={editingUser.department} onValueChange={(value) => setEditingUser(prev => prev ? ({ ...prev, department: value }) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Contabilidade">Contabilidade</SelectItem>
                    <SelectItem value="Operações">Operações</SelectItem>
                    <SelectItem value="Geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => updateUserMutation.mutate({ id: editingUser.id, data: editingUser })}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Dialog */}
      {userToDelete && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o usuário "{userToDelete.name}"?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {userToDelete.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{userToDelete.name}</p>
                  <p className="text-sm text-gray-600">{userToDelete.email}</p>
                  <p className="text-sm text-gray-500">{userToDelete.department} - {getRoleLabel(userToDelete.role)}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteUserMutation.mutate(userToDelete.id)}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Excluindo..." : "Excluir Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("perfil");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    role: "operator",
    department: "Geral"
  });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    companyDocument: "",
    companyAddress: ""
  });

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/company"],
    retry: false,
    enabled: !!user,
  });

  // Update form data when user/company data loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: (user as any)?.name || "",
        email: (user as any)?.email || ""
      }));
    }
    if (company) {
      setFormData(prev => ({
        ...prev,
        companyName: (company as any)?.name || "",
        companyDocument: (company as any)?.document || "",
        companyAddress: (company as any)?.address || ""
      }));
    }
  }, [user, company]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/user/update", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível atualizar as informações.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: formData.name,
      email: formData.email,
      companyName: formData.companyName,
      companyDocument: formData.companyDocument,
      companyAddress: formData.companyAddress
    });
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento.",
        variant: "destructive",
      });
    }
  };

  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      console.log("Creating user with data:", userData);
      try {
        const response = await apiRequest("POST", "/api/enterprise/add-user", userData);
        console.log("User creation response:", response);
        return response;
      } catch (error) {
        console.error("User creation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("User creation successful:", data);
      toast({
        title: "Usuário adicionado",
        description: "Novo usuário foi criado com sucesso.",
      });
      setShowAddUser(false);
      setNewUserForm({ name: "", email: "", role: "operator", department: "Geral" });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/users"] });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    },
  });

  if (userLoading || companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
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
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="empresa" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>
              <TabsTrigger value="gestao" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gestão
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="privacidade" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacidade
              </TabsTrigger>
              <TabsTrigger value="suporte" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Suporte
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="perfil">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                    <CardDescription>
                      Atualize suas informações pessoais e de contato
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Gerenciar Assinatura
                    </CardTitle>
                    <CardDescription>
                      Gerencie sua assinatura, métodos de pagamento e faturas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-900">Portal do Cliente Stripe</p>
                        <p className="text-sm text-blue-700">
                          Acesse o portal seguro para gerenciar sua assinatura, atualizar métodos de pagamento e baixar faturas
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelSubscription}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Gerenciar Assinatura
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">Cancelar Serviço</p>
                        <p className="text-sm text-red-700">
                          Você pode cancelar sua assinatura a qualquer momento através do portal do cliente
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        className="flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Cancelar Assinatura
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Company Information Tab */}
            <TabsContent value="empresa">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações da Empresa
                  </CardTitle>
                  <CardDescription>
                    Dados da sua empresa para emissão de notas fiscais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Nome da sua empresa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyDocument">CNPJ</Label>
                      <Input
                        id="companyDocument"
                        value={formData.companyDocument}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyDocument: e.target.value }))}
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="companyAddress">Endereço</Label>
                    <Textarea
                      id="companyAddress"
                      value={formData.companyAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                      placeholder="Endereço completo da empresa"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Informações da Empresa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="gestao">
              <EnterpriseManagementTab 
                addUserMutation={addUserMutation}
                newUserForm={newUserForm}
                setNewUserForm={setNewUserForm}
                showAddUser={showAddUser}
                setShowAddUser={setShowAddUser}
                queryClient={queryClient}
              />
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notificacoes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>
                    Configure como e quando você deseja receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificações por E-mail</p>
                        <p className="text-sm text-gray-600">Receber notificações importantes por e-mail</p>
                      </div>
                      <Switch
                        defaultChecked
                        onCheckedChange={(checked) => {
                          // Handle email notifications toggle
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Reconciliações Automáticas</p>
                        <p className="text-sm text-gray-600">Notificar sobre resultados de reconciliação</p>
                      </div>
                      <Switch
                        defaultChecked
                        onCheckedChange={(checked) => {
                          // Handle reconciliation notifications toggle
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Relatórios Mensais</p>
                        <p className="text-sm text-gray-600">Receber relatórios de uso mensais</p>
                      </div>
                      <Switch
                        defaultChecked
                        onCheckedChange={(checked) => {
                          // Handle monthly reports toggle
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alertas de Segurança</p>
                        <p className="text-sm text-gray-600">Notificações sobre atividades de segurança</p>
                      </div>
                      <Switch
                        defaultChecked
                        onCheckedChange={(checked) => {
                          // Handle security alerts toggle
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificações Push</p>
                        <p className="text-sm text-gray-600">Receber notificações em tempo real no navegador</p>
                      </div>
                      <Switch
                        onCheckedChange={(checked) => {
                          // Handle push notifications toggle
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacidade">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacidade e Dados
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas configurações de privacidade e dados pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Exportação de Dados</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Baixe uma cópia de todos os seus dados armazenados em nossa plataforma
                      </p>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Solicitar Exportação de Dados
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Exclusão de Dados</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Solicite a exclusão permanente de todos os seus dados. Esta ação não pode ser desfeita.
                      </p>
                      <Button variant="destructive" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Solicitar Exclusão de Dados
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="suporte">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Central de Suporte
                  </CardTitle>
                  <CardDescription>
                    Entre em contato conosco para tirar dúvidas ou solicitar ajuda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* WhatsApp Support */}
                    <Card className="border-green-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-green-100 p-3 rounded-full">
                            <MessageCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">WhatsApp</h3>
                            <p className="text-sm text-gray-600">Suporte via chat</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Receba ajuda instantânea através do nosso WhatsApp Business. 
                          Disponível de segunda a sexta, das 8h às 18h.
                        </p>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => window.open('https://wa.me/554799127962?text=Olá! Preciso de ajuda com o PixConcilia.', '_blank')}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Abrir WhatsApp
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Email Support */}
                    <Card className="border-blue-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Mail className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">E-mail</h3>
                            <p className="text-sm text-gray-600">Suporte técnico</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Envie sua dúvida por e-mail e receba uma resposta detalhada. 
                          Tempo de resposta: até 24 horas.
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => window.open('mailto:suporte@pixconcilia.com.br?subject=Solicitação de Suporte&body=Olá! Preciso de ajuda com o PixConcilia.%0A%0ADescreva sua dúvida:', '_blank')}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar E-mail
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Quick Help */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Ajuda Rápida</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                          <h4 className="font-medium mb-2">Como fazer upload</h4>
                          <p className="text-sm text-gray-600">
                            Aprenda a enviar seus comprovantes PIX e extratos
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                          <h4 className="font-medium mb-2">Reconciliação</h4>
                          <p className="text-sm text-gray-600">
                            Entenda como funciona a reconciliação automática
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 text-center">
                          <CreditCard className="h-8 w-8 mx-auto mb-3 text-green-600" />
                          <h4 className="font-medium mb-2">Planos e Cobrança</h4>
                          <p className="text-sm text-gray-600">
                            Dúvidas sobre planos, limites e faturamento
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Informações de Contato</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>Telefone: (47) 99912-7962</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>E-mail: suporte@pixconcilia.com.br</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Horário: Segunda a Sexta, 8h às 18h</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}