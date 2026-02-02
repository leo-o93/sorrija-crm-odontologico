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

const formatEntityLabel = (entity: SearchEntityResult | null) => {
  if (!entity) return "";
  const phoneLabel = entity.phone ? ` • ${entity.phone}` : "";
  return `${entity.name}${phoneLabel}`;
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

      const fetchEntity = async (table: "leads" | "patients") => {
        const { data } = await supabase
          .from(table)
          .select("id, name, phone, cpf, email")
          .eq("id", value)
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (!data) return null;

        return {
          id: data.id,
          name: data.name,
          phone: data.phone,
          cpf: "cpf" in data ? data.cpf : null,
          email: "email" in data ? data.email : null,
          type: table === "patients" ? "patient" : "lead",
        } as SearchEntityResult;
      };

      const entity =
        entityType === "all"
          ? (await fetchEntity("patients")) ?? (await fetchEntity("leads"))
          : await fetchEntity(entityType === "patient" ? "patients" : "leads");

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

    const fetchLeads = async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, phone")
        .eq("organization_id", organizationId)
        .or(buildFilter(false))
        .order("name")
        .range(offset, rangeEnd);

      return (
        data?.map((lead) => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          type: "lead" as const,
        })) ?? []
      );
    };

    const fetchPatients = async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, name, phone, cpf, email")
        .eq("organization_id", organizationId)
        .or(buildFilter(true))
        .order("name")
        .range(offset, rangeEnd);

      return (
        data?.map((patient) => ({
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          cpf: patient.cpf,
          email: patient.email,
          type: "patient" as const,
        })) ?? []
      );
    };

    let nextResults: SearchEntityResult[] = [];
    let hasMoreResults = false;

    if (entityType === "lead") {
      nextResults = await fetchLeads();
      hasMoreResults = nextResults.length === PAGE_SIZE;
    } else if (entityType === "patient") {
      nextResults = await fetchPatients();
      hasMoreResults = nextResults.length === PAGE_SIZE;
    } else {
      const [leadResults, patientResults] = await Promise.all([fetchLeads(), fetchPatients()]);
      nextResults = [...leadResults, ...patientResults].sort((a, b) => a.name.localeCompare(b.name));
      hasMoreResults = leadResults.length === PAGE_SIZE || patientResults.length === PAGE_SIZE;
    }

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
                    {groupedResults.leads.map((lead) => (
                      <CommandItem key={lead.id} onSelect={() => handleSelect(lead)}>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {highlightText(lead.name, debouncedQuery)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {highlightText(lead.phone ?? "", debouncedQuery.replace(/\D/g, ""))}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {groupedResults.patients.length > 0 && (
                  <CommandGroup heading="Pacientes">
                    {groupedResults.patients.map((patient) => (
                      <CommandItem key={patient.id} onSelect={() => handleSelect(patient)}>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {highlightText(patient.name, debouncedQuery)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {highlightText(patient.phone ?? "", debouncedQuery.replace(/\D/g, ""))}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              <CommandGroup>
                {results.map((result) => (
                  <CommandItem key={result.id} onSelect={() => handleSelect(result)}>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {highlightText(result.name, debouncedQuery)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {highlightText(result.phone ?? "", debouncedQuery.replace(/\D/g, ""))}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
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
