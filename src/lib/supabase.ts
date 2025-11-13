import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Helper functions
export const formatPhone = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: (31) 9 8280-8133 -> 5531982808133
  if (cleaned.length >= 10) {
    return `55${cleaned}`;
  }
  return cleaned;
};

export const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  // Try to parse DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
};

export const parseCurrency = (value: string): number | null => {
  if (!value) return null;
  
  // Remove R$, spaces, and convert , to .
  const cleaned = value
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace('.', '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};
