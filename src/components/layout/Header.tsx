import { Search, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvolutionAPI } from "@/hooks/useEvolutionAPI";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  const { connectionState } = useEvolutionAPI();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar paciente, telefone..."
              className="pl-10 bg-background"
            />
          </div>
        </div>

        {/* Organization Switcher */}
        <OrganizationSwitcher />

        {/* WhatsApp Status */}
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <Badge
            variant={connectionState?.instance?.state === 'open' ? 'default' : 'destructive'}
            className="gap-1"
          >
            <span className={`h-2 w-2 rounded-full ${connectionState?.instance?.state === 'open' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            {connectionState?.instance?.state === 'open' ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
