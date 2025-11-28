import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function OrganizationSwitcher() {
  const { currentOrganization, availableOrganizations, isLoading, switchOrganization } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Sem organização</span>
      </div>
    );
  }

  // Se só há uma organização, mostrar sem dropdown
  if (availableOrganizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-xs font-medium">{currentOrganization.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {currentOrganization.evolution_instance}
          </span>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between gap-2 bg-muted/50 hover:bg-muted"
        >
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium">{currentOrganization.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {currentOrganization.evolution_instance}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] bg-popover z-50">
        <DropdownMenuLabel>Organizações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org.id)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              currentOrganization.id === org.id && "bg-accent"
            )}
          >
            <Check
              className={cn(
                "h-4 w-4",
                currentOrganization.id === org.id ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">
                {org.evolution_instance}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}