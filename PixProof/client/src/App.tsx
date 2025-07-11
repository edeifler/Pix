import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import IndexPage from "@/pages/index";
import LandingPage from "@/pages/landing";
import Home from "@/pages/home";
import SignupPage from "@/pages/signup";
import SignupSimplePage from "@/pages/signup-simple";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ImportConfirmationPage from "@/pages/import-confirmation";
import UploadPixPage from "@/pages/upload-pix";
import UploadExtratoPage from "@/pages/upload-extrato";
import ReconciliacaoPage from "@/pages/reconciliacao-simple";
import UploadPixSimplePage from "@/pages/upload-pix-simple";
import UploadExtratoSimplePage from "@/pages/upload-extrato-simple";
import ReconciliacaoSimplePage from "@/pages/reconciliacao-simple";
import AnalyticsPage from "@/pages/analytics";
import ConfiguracoesPage from "@/pages/configuracoes";
import NotificacoesPage from "@/pages/notificacoes";
import CheckoutPage from "@/pages/checkout";
import CheckoutTestPage from "@/pages/checkout-test";
import CheckoutWorkingPage from "@/pages/checkout-working";
import CheckoutSimpleWorkingPage from "@/pages/checkout-simple-working";
import CheckoutRealPage from "@/pages/checkout-real";
import CheckoutTestMode from "@/pages/checkout-test-mode";
import CheckoutSimplePage from "@/pages/checkout-simple";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import DebugCheckout from "@/pages/debug-checkout";
import CheckoutFallback from "@/pages/checkout-fallback";

import PagamentoPage from "@/pages/pagamento";
import CheckoutFinalPage from "@/pages/checkout-final";
import CheckoutFinalWorkingPage from "@/pages/checkout-final-working";
import CheckoutFixedPage from "@/pages/checkout-fixed";
import CheckoutSimpleStripePage from "@/pages/checkout-simple-stripe";
import CheckoutMinimalPage from "@/pages/checkout-minimal";
import AnalyticsAdvancedPage from "@/pages/analytics-advanced";
import ReconciliationAdvancedPage from "@/pages/reconciliation-advanced";
import SystemMonitorPage from "@/pages/system-monitor";
import ReconciliacaoUnifiedPage from "@/pages/reconciliacao-unified";
import ReconciliacaoCompletaPage from "@/pages/reconciliacao-completa";
import TesteComprovantesPage from "@/pages/teste-comprovantes";


import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes - always available */}
      <Route path="/checkout" component={CheckoutFallback} />
      <Route path="/checkout-real" component={CheckoutRealPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupSimplePage} />
      <Route path="/signup-simple" component={SignupSimplePage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/debug-checkout" component={DebugCheckout} />
      <Route path="/checkout-old" component={CheckoutFinalWorkingPage} />
      <Route path="/pagamento" component={PagamentoPage} />
      <Route path="/checkout-simple" component={CheckoutSimplePage} />
      <Route path="/checkout-working" component={CheckoutWorkingPage} />
      <Route path="/checkout-fixed" component={CheckoutFixedPage} />
      
      {/* Protected routes */}
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/upload-pix" component={UploadPixPage} />
      <Route path="/upload-extrato" component={UploadExtratoPage} />
      <Route path="/reconciliacao" component={ReconciliacaoPage} />
      <Route path="/upload-pix-simple" component={UploadPixSimplePage} />
      <Route path="/upload-extrato-simple" component={UploadExtratoSimplePage} />
      <Route path="/reconciliacao-simple" component={ReconciliacaoSimplePage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/analytics-advanced" component={AnalyticsAdvancedPage} />
      <Route path="/reconciliation-advanced" component={ReconciliationAdvancedPage} />
      <Route path="/reconciliacao-unificada" component={ReconciliacaoUnifiedPage} />
      <Route path="/reconciliacao-completa" component={ReconciliacaoCompletaPage} />
      <Route path="/system-monitor" component={SystemMonitorPage} />
      <Route path="/teste-comprovantes" component={TesteComprovantesPage} />


      <Route path="/configuracoes" component={ConfiguracoesPage} />
      <Route path="/notificacoes" component={NotificacoesPage} />
      <Route path="/import-confirmation" component={ImportConfirmationPage} />
      
      {/* Home route - authenticated users go to dashboard */}
      <Route path="/" component={IndexPage} />
      
      {/* Catch-all 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
