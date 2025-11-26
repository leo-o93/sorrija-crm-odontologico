import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { EvolutionProvider, useEvolution } from "@/contexts/EvolutionContext";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import Orcamentos from "./pages/Orcamentos";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Indicadores from "./pages/Indicadores";
import Marketing from "./pages/Marketing";
import Cadastros from "./pages/Cadastros";
import Configuracoes from "./pages/Configuracoes";
import Webhooks from "./pages/Webhooks";
import Conversas from "./pages/Conversas";
import EvolutionSetup from "./pages/EvolutionSetup";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isConfigured, loading } = useEvolution();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isConfigured && window.location.pathname !== '/setup') {
      navigate('/setup');
    }
  }, [isConfigured, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/setup" element={<EvolutionSetup />} />
      <Route
        path="/"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      <Route
        path="/crm"
        element={
          <AppLayout>
            <CRM />
          </AppLayout>
        }
      />
      <Route
        path="/pacientes"
        element={
          <AppLayout>
            <Pacientes />
          </AppLayout>
        }
      />
      <Route
        path="/agenda"
        element={
          <AppLayout>
            <Agenda />
          </AppLayout>
        }
      />
      <Route
        path="/orcamentos"
        element={
          <AppLayout>
            <Orcamentos />
          </AppLayout>
        }
      />
      <Route
        path="/financeiro"
        element={
          <AppLayout>
            <Financeiro />
          </AppLayout>
        }
      />
      <Route
        path="/relatorios"
        element={
          <AppLayout>
            <Relatorios />
          </AppLayout>
        }
      />
      <Route
        path="/indicadores"
        element={
          <AppLayout>
            <Indicadores />
          </AppLayout>
        }
      />
      <Route
        path="/marketing"
        element={
          <AppLayout>
            <Marketing />
          </AppLayout>
        }
      />
      <Route
        path="/cadastros"
        element={
          <AppLayout>
            <Cadastros />
          </AppLayout>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <AppLayout>
            <Configuracoes />
          </AppLayout>
        }
      />
      <Route
        path="/webhooks"
        element={
          <AppLayout>
            <Webhooks />
          </AppLayout>
        }
      />
      <Route
        path="/conversas"
        element={
          <AppLayout>
            <Conversas />
          </AppLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <EvolutionProvider>
          <AppRoutes />
        </EvolutionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
