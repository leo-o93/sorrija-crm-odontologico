import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { EvolutionProvider } from "@/contexts/EvolutionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
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
import RelatoriosIA from "./pages/RelatoriosIA";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

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
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CRM />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Pacientes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agenda"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Agenda />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamentos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Orcamentos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute requiredRole={["admin", "gerente"]}>
            <AppLayout>
              <Financeiro />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Relatorios />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/indicadores"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Indicadores />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Marketing />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cadastros"
        element={
          <ProtectedRoute requiredRole={["admin", "gerente"]}>
            <AppLayout>
              <Cadastros />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute requiredRole={["admin", "gerente"]}>
            <AppLayout>
              <Configuracoes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/webhooks"
        element={
          <ProtectedRoute requiredRole={["admin", "gerente"]}>
            <AppLayout>
              <Webhooks />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Conversas />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios-ia"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RelatoriosIA />
            </AppLayout>
          </ProtectedRoute>
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
        <AuthProvider>
          <OrganizationProvider>
            <EvolutionProvider>
              <AppRoutes />
            </EvolutionProvider>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
