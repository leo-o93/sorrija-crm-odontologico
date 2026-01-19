import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, Settings, MessageSquare, X, User, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvolutionAPI } from "@/hooks/useEvolutionAPI";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { NotificationBell } from "./NotificationBell";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchResult {
  type: 'lead' | 'patient' | 'conversation';
  id: string;
  name: string;
  phone: string;
  extra?: string;
}

export function Header() {
  const navigate = useNavigate();
  const { connectionState } = useEvolutionAPI();
  const { currentOrganization } = useOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Global search query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["global-search", debouncedQuery, currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || debouncedQuery.length < 2) return [];

      const results: SearchResult[] = [];
      const query = debouncedQuery.toLowerCase();
      const phoneQuery = debouncedQuery.replace(/\D/g, '');

      // Build search filter dynamically - only include phone if it has digits
      const buildSearchFilter = () => {
        if (phoneQuery.length > 0) {
          return `name.ilike.%${query}%,phone.ilike.%${phoneQuery}%`;
        }
        return `name.ilike.%${query}%`;
      };
      const searchFilter = buildSearchFilter();

      // Search leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name, phone, procedures(name)")
        .eq("organization_id", currentOrganization.id)
        .or(searchFilter)
        .limit(5);

      leads?.forEach((lead) => {
        results.push({
          type: 'lead',
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          extra: (lead.procedures as any)?.name,
        });
      });

      // Search patients
      const { data: patients } = await supabase
        .from("patients")
        .select("id, name, phone, email")
        .eq("organization_id", currentOrganization.id)
        .or(searchFilter)
        .limit(5);

      patients?.forEach((patient) => {
        results.push({
          type: 'patient',
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          extra: patient.email || undefined,
        });
      });

      // Search conversations - also search by linked lead/patient name
      let conversationsQuery = supabase
        .from("conversations")
        .select("id, phone, leads(name), patients(name)")
        .eq("organization_id", currentOrganization.id);
      
      if (phoneQuery.length > 0) {
        conversationsQuery = conversationsQuery.ilike("phone", `%${phoneQuery}%`);
      } else {
        // When searching by name, we need to filter in JS as Supabase doesn't support filtering on joined table fields
        conversationsQuery = conversationsQuery.limit(50);
      }
      
      const { data: conversations } = await conversationsQuery.limit(phoneQuery.length > 0 ? 5 : 50);

      // Filter conversations by name if searching by name (not phone)
      const filteredConversations = phoneQuery.length > 0 
        ? conversations 
        : conversations?.filter(conv => {
            const leadName = (conv.leads as any)?.name?.toLowerCase() || '';
            const patientName = (conv.patients as any)?.name?.toLowerCase() || '';
            return leadName.includes(query) || patientName.includes(query);
          }).slice(0, 5);

      filteredConversations?.forEach((conv) => {
        const leadName = (conv.leads as any)?.name;
        const patientName = (conv.patients as any)?.name;
        results.push({
          type: 'conversation',
          id: conv.id,
          name: leadName || patientName || 'Conversa',
          phone: conv.phone,
        });
      });

      return results;
    },
    enabled: debouncedQuery.length >= 2 && !!currentOrganization?.id,
  });

  const handleResultClick = useCallback((result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    
    switch (result.type) {
      case 'lead':
        navigate(`/crm?search=${encodeURIComponent(result.name)}`);
        break;
      case 'patient':
        navigate(`/pacientes?search=${encodeURIComponent(result.name)}`);
        break;
      case 'conversation':
        navigate(`/conversas?phone=${encodeURIComponent(result.phone)}`);
        break;
    }
  }, [navigate]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length >= 2 && !isSearchOpen) {
      setIsSearchOpen(true);
    }
  };

  const handleSearchInputFocus = () => {
    if (searchQuery.length >= 2) {
      setIsSearchOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'lead':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'patient':
        return <User className="h-4 w-4 text-green-500" />;
      case 'conversation':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
    }
  };

  const getResultLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'lead':
        return 'Lead';
      case 'patient':
        return 'Paciente';
      case 'conversation':
        return 'Conversa';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Buscar paciente, lead, telefone..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={handleSearchInputFocus}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {isSearchOpen && debouncedQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
              <ScrollArea className="max-h-80">
                {isSearching ? (
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent text-left transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        {getResultIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{result.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getResultLabel(result.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{result.phone}</span>
                            {result.extra && <span>• {result.extra}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Nenhum resultado encontrado para "{debouncedQuery}"
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
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

          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/configuracoes')}
            title="Configurações"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <UserMenu />
        </div>
      </div>
      
      {/* Click outside to close search */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsSearchOpen(false)}
        />
      )}
    </header>
  );
}