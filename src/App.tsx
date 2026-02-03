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
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";
import { ImportProvider } from "@/contexts/ImportContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { FloatingAIAssistant } from "@/components/ai/FloatingAIAssistant";
import { ImportProgressIndicator } from "@/components/layout/ImportProgressIndicator";
import Dashboard from "./pages/Dashboard";
import PainelSistema from "./pages/PainelSistema";
import CRM from "./pages/CRM";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import Orcamentos from "./pages/Orcamentos";
import Prontuario from "./pages/Prontuario";
import Tratamentos from "./pages/Tratamentos";
import DocumentosClinicos from "./pages/DocumentosClinicos";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Billing from "./pages/Billing";
import Relatorios from "./pages/Relatorios";
import Indicadores from "./pages/Indicadores";
import Marketing from "./pages/Marketing";
import Cadastros from "./pages/Cadastros";
import Configuracoes from "./pages/Configuracoes";
import Webhooks from "./pages/Webhooks";
import Conversas from "./pages/Conversas";
import RelatoriosIA from "./pages/RelatoriosIA";
import Admin from "./pages/Admin";
import FilaAtendimento from "./pages/FilaAtendimento";
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
      <FloatingAIAssistant />
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
        path="/painel-sistema"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PainelSistema />
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
        path="/prontuario"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Prontuario />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tratamentos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Tratamentos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documentos-clinicos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DocumentosClinicos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      {/* Financeiro - Only admin can access */}
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Financeiro />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Estoque />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Billing />
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
      {/* Cadastros - All authenticated users can access */}
      <Route
        path="/cadastros"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Cadastros />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      {/* Configurações - Only admin can access */}
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Configuracoes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      {/* Webhooks - Only admin can access */}
      <Route
        path="/webhooks"
        element={
          <ProtectedRoute requiredRole="admin">
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
        path="/fila-atendimento"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FilaAtendimento />
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
      {/* Admin - Super Admin only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute superAdminOnly>
            <AppLayout>
              <Admin />
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
          <SuperAdminProvider>
            <OrganizationProvider>
              <ImportProvider>
                <EvolutionProvider>
                  <AppRoutes />
                  <ImportProgressIndicator />
                </EvolutionProvider>
              </ImportProvider>
            </OrganizationProvider>
          </SuperAdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
