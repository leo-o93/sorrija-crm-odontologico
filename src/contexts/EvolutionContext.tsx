import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface EvolutionConfig {
  id: string;
  evolution_base_url: string;
  evolution_api_key: string;
  evolution_instance: string;
  webhook_secret?: string;
  n8n_outgoing_url?: string;
  active: boolean;
  last_sync_at?: string;
}

interface EvolutionContextType {
  config: EvolutionConfig | null;
  loading: boolean;
  isConfigured: boolean;
  saveConfig: (config: Omit<EvolutionConfig, 'id' | 'active' | 'last_sync_at'>) => Promise<void>;
  refetchConfig: () => Promise<void>;
}

const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

export function EvolutionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<EvolutionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching evolution config:', error);
        return;
      }

      setConfig(data);
    } catch (error) {
      console.error('Error fetching evolution config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveConfig = async (newConfig: Omit<EvolutionConfig, 'id' | 'active' | 'last_sync_at'>) => {
    try {
      const { data, error } = await supabase
        .from('evolution_config')
        .upsert({
          ...newConfig,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      navigate('/');
    } catch (error: any) {
      console.error('Error saving evolution config:', error);
      throw error;
    }
  };

  const refetchConfig = async () => {
    await fetchConfig();
  };

  const isConfigured = !!config && !!config.evolution_base_url && !!config.evolution_api_key;

  return (
    <EvolutionContext.Provider value={{ config, loading, isConfigured, saveConfig, refetchConfig }}>
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
