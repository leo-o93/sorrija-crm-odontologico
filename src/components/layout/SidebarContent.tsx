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
  MessagesSquare,
  Settings,
  Briefcase,
  Target,
  Webhook,
  Activity,
  Shield,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/sorri-ja-logo.jpeg";
import { useSuperAdmin } from "@/contexts/SuperAdminContext";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/roles";

// All navigation items
const allNavigation: Array<{
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  restrictedTo: AppRole[] | null;
}> = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, restrictedTo: null },
  { name: "Painel do Sistema", href: "/painel-sistema", icon: Activity, restrictedTo: null },
  { name: "CRM / Leads", href: "/crm", icon: Target, restrictedTo: null },
  { name: "Conversas WhatsApp", href: "/conversas", icon: MessageSquare, restrictedTo: null },
  { name: "Chat Interno", href: "/chat-interno", icon: MessagesSquare, restrictedTo: null },
  { name: "Fila de Atendimento", href: "/fila-atendimento", icon: ClipboardCheck, restrictedTo: null },
  { name: "Pacientes", href: "/pacientes", icon: Users, restrictedTo: null },
  { name: "Agenda", href: "/agenda", icon: Calendar, restrictedTo: null },
  { name: "Orçamentos", href: "/orcamentos", icon: FileText, restrictedTo: null },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, restrictedTo: ['admin'] },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3, restrictedTo: null },
  { name: "Indicadores", href: "/indicadores", icon: PieChart, restrictedTo: null },
  { name: "Marketing", href: "/marketing", icon: Target, restrictedTo: null },
  { name: "Webhooks", href: "/webhooks", icon: Webhook, restrictedTo: ['admin'] },
  { name: "Cadastros", href: "/cadastros", icon: Briefcase, restrictedTo: null },
  { name: "Configurações", href: "/configuracoes", icon: Settings, restrictedTo: ['admin'] },
];

const adminItem = { name: "Admin", href: "/admin", icon: Shield };

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { isSuperAdmin } = useSuperAdmin();
  const { userRole } = useAuth();

  // Get visible navigation items based on user role
  const getVisibleNavItems = () => {
    // Super Admin sees everything
    if (isSuperAdmin) {
      return allNavigation;
    }

    // Admin sees everything except /admin page (which is handled separately)
    if (userRole?.role === 'admin') {
      return allNavigation;
    }

    if (!userRole?.role) {
      return allNavigation.filter(item => item.restrictedTo === null);
    }

    return allNavigation.filter((item) => {
      if (!item.restrictedTo) return true;
      return item.restrictedTo.includes(userRole.role);
    });
  };

  const visibleNavItems = getVisibleNavItems();

  return (
    <>
      {/* Logo */}
      <div className="h-24 flex items-center justify-center px-4 border-b border-sidebar-border">
        <img src={logo} alt="Sorri Já" className="h-20 w-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {visibleNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                onClick={onNavigate}
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
                <span className="flex-1">{item.name}</span>
              </NavLink>
            </li>
          ))}
          {/* Admin item only for Super Admin */}
          {isSuperAdmin && (
            <li>
              <NavLink
                to={adminItem.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-gold shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-gold"
                  )
                }
              >
                <adminItem.icon className="h-5 w-5 flex-shrink-0" />
                <span>{adminItem.name}</span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      {/* Brand section */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/60 text-center">
          CRM Evolution WhatsApp
        </p>
      </div>
    </>
  );
}
