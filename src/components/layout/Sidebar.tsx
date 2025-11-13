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
  UserPlus,
  Briefcase,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/sorri-ja-logo.jpeg";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "CRM / Leads", href: "/crm", icon: Target },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Orçamentos", href: "/orcamentos", icon: FileText },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Indicadores", href: "/indicadores", icon: PieChart },
  { name: "Marketing", href: "/marketing", icon: MessageSquare },
  { name: "Cadastros", href: "/cadastros", icon: Briefcase },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
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
            <UserPlus className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Usuário Admin</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">admin@sorrija.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
