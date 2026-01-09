import type { Json } from '@/integrations/supabase/types';

export interface Organization {
  id: string;
  name: string;
  evolution_instance: string;
  settings: Json | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  logo_url: string | null;
  trade_name: string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: Json | null;
  business_hours: Json | null;
  timezone: string | null;
  welcome_message: string | null;
  message_signature: string | null;
}

export interface OrganizationFormValues {
  name: string;
  evolution_instance?: string;
  settings?: string;
  active: boolean;
}
