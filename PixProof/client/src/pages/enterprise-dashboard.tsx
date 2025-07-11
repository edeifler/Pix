import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppHeader } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Shield, Settings, Plus, Search, Filter, MoreVertical,
  Crown, Key, Activity, AlertTriangle, CheckCircle, Clock,
  Edit, Trash2, UserCheck, Home
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: Date;
  permissions: string[];
  department: string;
  uploadCount: number;
  processedCount: number;
}

interface Department {
  id: string;
  name: string;
  userCount: number;
  monthlyUsage: number;
  budget: number;
  lead: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'upload' | 'view' | 'admin' | 'export';
}

export default function EnterpriseDashboardPage() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [permissions] = useState<Permission[]>([
    { id: 'upload_pix', name: 'Upload PIX', description: 'Pode enviar comprovantes PIX', category: 'upload' },
    { id: 'upload_bank', name: 'Upload Extratos', description: 'Pode enviar extratos bancários', category: 'upload' },
    { id: 'view_reports', name: 'Ver Relatórios', description: 'Acesso aos relatórios', category: 'view' },
    { id: 'export_data', name: 'Exportar Dados', description: 'Pode exportar dados', category: 'export' },
    { id: 'manage_users', name: 'Gerenciar Usuários', description: 'Administrar usuários', category: 'admin' },
    { id: 'system_config', name: 'Configurações', description: 'Configurações do sistema', category: 'admin' }
  ]);
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  const fetchEnterpriseData = async () => {
    try {
      setLoading(true);
      
      // Mock enterprise data
      setUsers([
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@empresa.com',
          role: 'admin',
          status: 'active',
          lastActive: new Date(),
          permissions: ['upload_pix', 'upload_bank', 'view_reports', 'export_data', 'manage_users', 'system_config'],
          department: 'Financeiro',
          uploadCount: 45,
          processedCount: 42
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@empresa.com',
          role: 'manager',
          status: 'active',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
          permissions: ['upload_pix', 'upload_bank', 'view_reports', 'export_data'],
          department: 'Financeiro',
          uploadCount: 23,
          processedCount: 21
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro@empresa.com',
          role: 'operator',
          status: 'active',
          lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000),
          permissions: ['upload_pix', 'view_reports'],
          department: 'Contabilidade',
          uploadCount: 12,
          processedCount: 11
        }
      ]);

      setDepartments([
        { id: '1', name: 'Financeiro', userCount: 2, monthlyUsage: 68, budget: 500, lead: 'João Silva' },
        { id: '2', name: 'Contabilidade', userCount: 1, monthlyUsage: 12, budget: 200, lead: 'Pedro Costa' },
        { id: '3', name: 'Operações', userCount: 0, monthlyUsage: 0, budget: 300, lead: '-' }
      ]);
      
    } catch (error) {
      console.error('Error fetching enterprise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Partial<User>) => {
    try {
      const response = await fetch('/api/enterprise/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        fetchEnterpriseData();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/enterprise/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        fetchEnterpriseData();
        toast({
          title: "Usuário atualizado",
          description: "Cargo do usuário foi alterado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const editUser = async (userData: Partial<User>) => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/enterprise/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        fetchEnterpriseData();
        setShowEditDialog(false);
        setEditingUser(null);
        toast({
          title: "Usuário atualizado",
          description: "Informações do usuário foram atualizadas com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error editing user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/enterprise/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchEnterpriseData();
        setShowDeleteDialog(false);
        setUserToDelete(null);
        toast({
          title: "Usuário excluído",
          description: "Usuário foi removido do sistema com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      case 'operator': return <Settings className="h-4 w-4" />;
      case 'viewer': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Empresarial</h1>
            <p className="text-gray-600">Gestão completa de usuários e permissões</p>
          </div>
          
          <div className="flex gap-3">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">
                +2 novos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
              <p className="text-xs text-muted-foreground">
                3 configurados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uso do Mês</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((acc, user) => acc + user.uploadCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                de 500 uploads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                +1.2% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Ativos Recentemente</CardTitle>
                  <CardDescription>Atividade nas últimas 24 horas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center space-x-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/api/placeholder/32/32`} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.department}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.lastActive.getHours()}:{user.lastActive.getMinutes().toString().padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Department Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Uso por Departamento</CardTitle>
                  <CardDescription>Uploads processados este mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments.map((dept) => (
                      <div key={dept.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{dept.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {dept.monthlyUsage}/{dept.budget}
                          </span>
                        </div>
                        <Progress value={(dept.monthlyUsage / dept.budget) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Monitoramento em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">API</p>
                      <p className="text-xs text-muted-foreground">Operacional</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">OCR Engine</p>
                      <p className="text-xs text-muted-foreground">Operacional</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Storage</p>
                      <p className="text-xs text-muted-foreground">75% usado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>Gerencie usuários e suas permissões</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter(user => 
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`/api/placeholder/40/40`} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.department}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">{user.uploadCount}</p>
                          <p className="text-xs text-muted-foreground">uploads</p>
                        </div>
                        
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role}</span>
                        </Badge>
                        
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingUser(user);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'manager' : 'admin')}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Alterar Cargo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Departamentos</CardTitle>
                <CardDescription>Organize usuários por departamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.map((dept) => (
                    <Card key={dept.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <CardDescription>Líder: {dept.lead}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Usuários</span>
                            <span className="font-medium">{dept.userCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Uso Mensal</span>
                            <span className="font-medium">{dept.monthlyUsage}/{dept.budget}</span>
                          </div>
                          <Progress value={(dept.monthlyUsage / dept.budget) * 100} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Permissões</CardTitle>
                <CardDescription>Controle de acesso granular por cargo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Permissão</th>
                        <th className="text-center p-3">Admin</th>
                        <th className="text-center p-3">Manager</th>
                        <th className="text-center p-3">Operator</th>
                        <th className="text-center p-3">Viewer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission) => (
                        <tr key={permission.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{permission.name}</p>
                              <p className="text-sm text-muted-foreground">{permission.description}</p>
                            </div>
                          </td>
                          <td className="text-center p-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          </td>
                          <td className="text-center p-3">
                            {permission.category !== 'admin' ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <div className="h-5 w-5 mx-auto bg-gray-200 rounded-full" />
                            )}
                          </td>
                          <td className="text-center p-3">
                            {permission.category === 'upload' || permission.category === 'view' ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <div className="h-5 w-5 mx-auto bg-gray-200 rounded-full" />
                            )}
                          </td>
                          <td className="text-center p-3">
                            {permission.category === 'view' ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <div className="h-5 w-5 mx-auto bg-gray-200 rounded-full" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botão Voltar ao Dashboard */}
        <div className="fixed bottom-6 left-6">
          <Button
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2 shadow-lg"
          >
            <Home className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editName">Nome</Label>
                  <Input
                    id="editName"
                    defaultValue={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editEmail">E-mail</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    defaultValue={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editDepartment">Departamento</Label>
                  <Select 
                    value={editingUser.department} 
                    onValueChange={(value) => setEditingUser({...editingUser, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Contabilidade">Contabilidade</SelectItem>
                      <SelectItem value="Operações">Operações</SelectItem>
                      <SelectItem value="Geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editRole">Cargo</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value) => setEditingUser({...editingUser, role: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => editUser(editingUser || {})}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Usuário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {userToDelete && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={`/api/placeholder/40/40`} />
                    <AvatarFallback>{userToDelete.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userToDelete.name}</p>
                    <p className="text-sm text-gray-600">{userToDelete.email}</p>
                    <p className="text-sm text-gray-600">{userToDelete.department}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => userToDelete && deleteUser(userToDelete.id)}
              >
                Excluir Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}