import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Procedure {
  id: string;
  name: string;
  category: string;
  default_price: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export function useProcedures() {
  return useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;

      return data as Procedure[];
    },
  });
}
