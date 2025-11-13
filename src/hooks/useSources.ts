import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Source {
  id: string;
  name: string;
  channel: string;
  active: boolean;
  created_at: string;
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;

      return data as Source[];
    },
  });
}
