// Types for detailed history data from spreadsheet import

export interface AppointmentHistoryItem {
  DATA: string;
  HORÁRIO?: string;
  PROCEDIMENTO?: string;
  PROFISSIONAL?: string;
  STATUS?: string;
  OBSERVAÇÃO?: string;
}

export interface AttendanceHistoryItem {
  DATA: string;
  PROCEDIMENTO?: string;
  DENTE?: string;
  VALOR?: number;
  PROFISSIONAL?: string;
  OBSERVAÇÃO?: string;
}

export interface QuoteHistoryItem {
  DATA_CRIACAO?: string;
  STATUS?: string;
  VALOR_CONTRATADO?: number;
  VALOR_NAO_CONTRATADO?: number;
  PROCEDIMENTOS?: string;
  OBSERVAÇÃO?: string;
}

export interface SaleHistoryItem {
  DATA: string;
  VALOR: number;
  FORMA_PAGAMENTO?: string;
  PROCEDIMENTO?: string;
  OBSERVAÇÃO?: string;
}

// New type for non-contracted quote items
export interface NonContractedQuoteItem {
  DATA?: string;
  PROCEDIMENTO?: string;
  ESPECIALIDADE?: string;
  VALOR?: number;
  valor_num?: number;
  OBSERVACAO?: string;
}

export type HistoryType = 'appointments' | 'attendances' | 'quotes' | 'sales' | 'non_contracted_quotes';

export interface HistoryDialogData {
  type: HistoryType;
  title: string;
  data: (AppointmentHistoryItem | AttendanceHistoryItem | QuoteHistoryItem | SaleHistoryItem | NonContractedQuoteItem)[];
}
