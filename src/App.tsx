import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/crm"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <CRM />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacientes"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Pacientes />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agenda"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Agenda />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orcamentos"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Orcamentos />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/financeiro"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Financeiro />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Relatorios />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/indicadores"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Indicadores />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Marketing />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cadastros"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Cadastros />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Configuracoes />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/webhooks"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Webhooks />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversas"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Conversas />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
