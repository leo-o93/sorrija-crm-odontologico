import { Bell, Search, Settings, MessageSquare, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvolutionAPI } from "@/hooks/useEvolutionAPI";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Skeleton } from "@/components/ui/skeleton";

export function Header() {
  const { connectionState } = useEvolutionAPI();
  const { currentOrganization, isLoading } = useOrganization();

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

        {/* Organization Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : currentOrganization ? (
            <div className="flex flex-col">
              <span className="text-xs font-medium">{currentOrganization.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {currentOrganization.evolution_instance}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sem organização</span>
          )}
        </div>

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
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
