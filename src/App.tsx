import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
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
import ImportLeads from "./pages/ImportLeads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col ml-64">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/crm" element={<CRM />} />
                  <Route path="/pacientes" element={<Pacientes />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/orcamentos" element={<Orcamentos />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/indicadores" element={<Indicadores />} />
                  <Route path="/marketing" element={<Marketing />} />
                  <Route path="/cadastros" element={<Cadastros />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="/import-leads" element={<ImportLeads />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
