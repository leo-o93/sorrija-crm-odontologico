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

export const parseDate = (dateStr: string | number): string | null => {
  if (!dateStr && dateStr !== 0) return null;
  
  // If it's a number (Excel serial date), convert it
  if (typeof dateStr === 'number' || (!isNaN(Number(dateStr)) && String(dateStr).match(/^\d+(\.\d+)?$/))) {
    const excelSerial = Number(dateStr);
    // Excel serial date: days since 1900-01-01 (with leap year bug adjustment)
    // Valid range check: reasonable dates between 1900 and 2100
    if (excelSerial > 1 && excelSerial < 73051) { // 73051 = 2100-01-01
      // Excel epoch is 1899-12-30 (accounting for the 1900 leap year bug)
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const excelEpoch = new Date(1899, 11, 30).getTime();
      const date = new Date(excelEpoch + excelSerial * millisecondsPerDay);
      return date.toISOString().split('T')[0];
    }
  }
  
  const strValue = String(dateStr).trim();
  
  // Try to parse DD/MM/YYYY format
  const parts = strValue.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If it's already in ISO format or similar, return as is
  if (strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return strValue.split('T')[0];
  }
  
  return null;
};

// Parse timestamp with time zone (for Excel and various formats)
export const parseDateTime = (dateStr: string | number): string | null => {
  if (!dateStr && dateStr !== 0) return null;
  
  // If it's a number (Excel serial date with possible time fraction), convert it
  if (typeof dateStr === 'number' || (!isNaN(Number(dateStr)) && String(dateStr).match(/^\d+(\.\d+)?$/))) {
    const excelSerial = Number(dateStr);
    if (excelSerial > 1 && excelSerial < 73051) {
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const excelEpoch = new Date(1899, 11, 30).getTime();
      const date = new Date(excelEpoch + excelSerial * millisecondsPerDay);
      return date.toISOString();
    }
  }
  
  const strValue = String(dateStr).trim();
  
  // Try to parse DD/MM/YYYY HH:MM:SS format
  const dateTimeParts = strValue.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?$/);
  if (dateTimeParts) {
    const [, day, month, year, hours, minutes, seconds] = dateTimeParts;
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds || '00'}`;
  }
  
  // Try to parse DD/MM/YYYY format (add midnight time)
  const dateParts = strValue.split('/');
  if (dateParts.length === 3) {
    const [day, month, year] = dateParts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
  }
  
  // If it's already in ISO format, return as is
  if (strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return strValue.includes('T') ? strValue : `${strValue}T00:00:00`;
  }
  
  return null;
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
