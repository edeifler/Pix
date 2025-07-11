import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, CreditCard, Bell, Shield, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface AppHeaderProps {
  title?: string;
  showCompanyName?: boolean;
}

export function AppHeader({ title = "Dashboard", showCompanyName = true }: AppHeaderProps) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription"],
    retry: false,
    enabled: !!user,
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/company"],
    retry: false,
    enabled: !!user,
  });

  // Use fallback data for demo users or when data is loading
  const displayUser = user || { fullName: 'Demo User', email: 'demo@pixconcilia.com' };
  const displaySubscription = subscription || { plan: 'professional', usage: 0 };
  const displayCompany = company || { name: 'Demo Company' };

  // Calculate usage percentage and limits based on plan
  const getUsageInfo = (subscription: any) => {
    if (!subscription) return { current: 0, limit: 100, percentage: 0 };
    
    const limits = {
      basic: 200,
      professional: 500,
      enterprise: 1000
    };
    
    const limit = limits[subscription.plan as keyof typeof limits] || 100;
    const current = subscription.usage || 0;
    const percentage = Math.round((current / limit) * 100);
    
    return { current, limit, percentage };
  };

  const usageInfo = getUsageInfo(displaySubscription);

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'basic':
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

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">PixConcilia</h1>
            {showCompanyName && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{(displayCompany as any)?.name || title}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="text-accent font-medium">
                {getPlanName((displaySubscription as any)?.plan || 'professional')}
              </span>
            </div>

            {/* Notification Bell */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={() => setLocation('/notificacoes')}
            >
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white">
                2
              </Badge>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={(displayUser as any)?.fullName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials((displayUser as any)?.fullName || 'Demo User')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{(displayUser as any)?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {(displayUser as any)?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/configuracoes')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}