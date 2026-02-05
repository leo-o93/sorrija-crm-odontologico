import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, Loader2, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export type SearchEntityType = "lead" | "patient" | "all";

export interface SearchEntityResult {
  id: string;
  name: string;
  phone: string;
  type: "lead" | "patient";
  cpf?: string | null;
  email?: string | null;
}

interface SearchEntityInputProps {
  value?: string;
  entityType: SearchEntityType;
  placeholder?: string;
  onSelect: (entity: SearchEntityResult | null) => void;
  disabled?: boolean;
}

const MIN_QUERY_LENGTH = 2;
const PAGE_SIZE = 10;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, "ig");
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={index} className="font-semibold text-foreground">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

const coerceEntityType = (value: string | null): SearchEntityResult["type"] | null => {
  if (value === "lead" || value === "patient") {
    return value;
  }
  return null;
};

const formatEntityLabel = (entity: SearchEntityResult | null) => {
  if (!entity) return "";
  const phoneLabel = entity.phone ? ` • ${entity.phone}` : "";
  return `${entity.name}${phoneLabel}`;
};

const formatSecondaryInfo = (entity: SearchEntityResult) => {
  const details = [];
  if (entity.phone) {
    details.push(entity.phone);
  }
  if (entity.cpf) {
    details.push(`CPF: ${entity.cpf}`);
  }
  return details.join(" • ");
};

export function SearchEntityInput({
  value,
  entityType,
  placeholder = "Buscar contato",
  onSelect,
  disabled,
}: SearchEntityInputProps) {
  const { currentOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchEntityResult[]>([]);
  const [selected, setSelected] = useState<SearchEntityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const organizationId = currentOrganization?.id;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, entityType, organizationId]);

  useEffect(() => {
    let isActive = true;

    const fetchById = async () => {
      if (!value || !organizationId) {
        setSelected(null);
        return;
      }

      if (selected?.id === value) return;

      // Use rpc or raw query since contacts_search may be a view not in generated types
      const baseQuery = supabase
        .from("contacts_search" as any)
        .select("id, name, phone, cpf, email, type")
        .eq("id", value)
        .eq("organization_id", organizationId);

      const { data } =
        entityType === "all"
          ? await baseQuery.maybeSingle()
          : await baseQuery.eq("type", entityType).maybeSingle();

      const parsedType = data ? coerceEntityType((data as any).type) : null;
      const entity = data && parsedType
        ? ({
            id: (data as any).id,
            name: (data as any).name,
            phone: (data as any).phone,
            cpf: (data as any).cpf,
            email: (data as any).email,
            type: parsedType,
          } as SearchEntityResult)
        : null;

      if (!isActive) return;

      if (entity) {
        setSelected(entity);
      }
    };

    fetchById();

    return () => {
      isActive = false;
    };
  }, [entityType, organizationId, selected?.id, value]);

  const fetchResults = async (currentPage: number, append: boolean) => {
    if (!organizationId || debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setHasMore(false);
      return;
    }

    setIsLoading(true);

    const searchText = debouncedQuery.toLowerCase();
    const phoneQuery = debouncedQuery.replace(/\D/g, "");
    const cpfQuery = phoneQuery;

    const buildFilter = (includeCpf: boolean) => {
      const filters = [`name.ilike.%${searchText}%`];
      if (phoneQuery.length > 0) {
        filters.push(`phone.ilike.%${phoneQuery}%`);
      }
      if (includeCpf && cpfQuery.length > 0) {
        filters.push(`cpf.ilike.%${cpfQuery}%`);
      }
      return filters.join(",");
    };

    const offset = currentPage * PAGE_SIZE;
    const rangeEnd = offset + PAGE_SIZE - 1;

    let query = supabase
      .from("contacts_search" as any)
      .select("id, name, phone, cpf, email, type")
      .eq("organization_id", organizationId)
      .or(buildFilter(true))
      .order("name")
      .range(offset, rangeEnd);

    if (entityType !== "all") {
      query = query.eq("type", entityType);
    }

    const { data } = await query;

    const nextResults =
      (data as any[] | null)?.flatMap((entity: any) => {
        const parsedType = coerceEntityType(entity.type);
        if (!parsedType) return [];
        return [{
          id: entity.id,
          name: entity.name,
          phone: entity.phone,
          cpf: entity.cpf,
          email: entity.email,
          type: parsedType,
        }];
      }) ?? [];

    const hasMoreResults = nextResults.length === PAGE_SIZE;

    setResults((prev) => (append ? [...prev, ...nextResults] : nextResults));
    setHasMore(hasMoreResults);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    fetchResults(page, page > 0);
  }, [debouncedQuery, entityType, open, organizationId, page]);

  const groupedResults = useMemo(() => {
    if (entityType !== "all") return { leads: [], patients: results };
    return {
      leads: results.filter((result) => result.type === "lead"),
      patients: results.filter((result) => result.type === "patient"),
    };
  }, [entityType, results]);

  const selectedLabel = selected ? formatEntityLabel(selected) : "";

  const handleSelect = (entity: SearchEntityResult | null) => {
    setSelected(entity);
    onSelect(entity);
    setOpen(false);
  };

  const isDisabled = disabled || !organizationId;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", !selected && "text-muted-foreground")}
          disabled={isDisabled}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Digite nome, celular ou CPF"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            )}
            {!isLoading && debouncedQuery.length < MIN_QUERY_LENGTH && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Digite pelo menos {MIN_QUERY_LENGTH} caracteres para buscar.
              </div>
            )}
            {!isLoading && results.length === 0 && debouncedQuery.length >= MIN_QUERY_LENGTH && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            {selected && (
              <CommandItem onSelect={() => handleSelect(null)} className="text-sm text-muted-foreground">
                Limpar seleção
              </CommandItem>
            )}
            {entityType === "all" ? (
              <>
                {groupedResults.leads.length > 0 && (
                  <CommandGroup heading="Leads">
                    {groupedResults.leads.map((lead) => {
                      const secondaryInfo = formatSecondaryInfo(lead);
                      return (
                        <CommandItem key={lead.id} onSelect={() => handleSelect(lead)}>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {highlightText(lead.name, debouncedQuery)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {secondaryInfo
                                ? highlightText(secondaryInfo, debouncedQuery.replace(/\D/g, ""))
                                : "Sem contato"}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {groupedResults.patients.length > 0 && (
                  <CommandGroup heading="Pacientes">
                    {groupedResults.patients.map((patient) => {
                      const secondaryInfo = formatSecondaryInfo(patient);
                      return (
                        <CommandItem key={patient.id} onSelect={() => handleSelect(patient)}>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {highlightText(patient.name, debouncedQuery)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {secondaryInfo
                                ? highlightText(secondaryInfo, debouncedQuery.replace(/\D/g, ""))
                                : "Sem contato"}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </>
            ) : (
              <CommandGroup>
                {results.map((result) => {
                  const secondaryInfo = formatSecondaryInfo(result);
                  return (
                    <CommandItem key={result.id} onSelect={() => handleSelect(result)}>
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {highlightText(result.name, debouncedQuery)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {secondaryInfo
                              ? highlightText(secondaryInfo, debouncedQuery.replace(/\D/g, ""))
                              : "Sem contato"}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {hasMore && !isLoading && (
              <CommandItem
                onSelect={() => setPage((prev) => prev + 1)}
                className="justify-center text-sm text-muted-foreground"
              >
                <Search className="mr-2 h-4 w-4" />
                Carregar mais resultados
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
