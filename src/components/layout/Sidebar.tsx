import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  MessageSquare, 
  Settings,
  User,
  Briefcase,
  Target,
  Webhook
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/sorri-ja-logo.jpeg";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "CRM / Leads", href: "/crm", icon: Target },
  { name: "Conversas WhatsApp", href: "/conversas", icon: MessageSquare },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Orçamentos", href: "/orcamentos", icon: FileText },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Indicadores", href: "/indicadores", icon: PieChart },
  { name: "Marketing", href: "/marketing", icon: Target },
  { name: "Webhooks", href: "/webhooks", icon: Webhook },
  { name: "Cadastros", href: "/cadastros", icon: Briefcase },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-primary shadow-lg flex flex-col">
      {/* Logo */}
      <div className="h-24 flex items-center justify-center px-4 border-b border-sidebar-border">
        <img src={logo} alt="Sorri Já" className="h-20 w-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-gold shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-gold"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center">
            <User className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || "Usuário"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
