// EvolutionContext - provides Evolution API configuration
// Requires OrganizationProvider as a parent
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./OrganizationContext";

interface EvolutionConfig {
  evolution_base_url?: string;
  evolution_api_key?: string;
  evolution_instance?: string;
  webhook_secret?: string;
}

interface EvolutionContextType {
  config: EvolutionConfig | null;
  loading: boolean;
  isConfigured: boolean;
  refetchConfig: () => Promise<void>;
}

const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

export function EvolutionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<EvolutionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const fetchConfig = async () => {
    try {
      if (!currentOrganization?.id) {
        setConfig(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'whatsapp_evolution')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching evolution config:', error);
        return;
      }

      setConfig(data?.settings as EvolutionConfig || null);
    } catch (error) {
      console.error('Error fetching evolution config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [currentOrganization?.id]);

  const refetchConfig = async () => {
    await fetchConfig();
  };

  const isConfigured = !!config?.evolution_base_url && !!config?.evolution_api_key;

  return (
    <EvolutionContext.Provider value={{ config, loading, isConfigured, refetchConfig }}>
      {children}
    </EvolutionContext.Provider>
  );
}

export function useEvolution() {
  const context = useContext(EvolutionContext);
  if (context === undefined) {
    throw new Error("useEvolution must be used within an EvolutionProvider");
  }
  return context;
}
