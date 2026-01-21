import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CreditCard, Receipt, Stethoscope, AlertTriangle } from "lucide-react";
import {
  HistoryType,
  AppointmentHistoryItem,
  AttendanceHistoryItem,
  QuoteHistoryItem,
  SaleHistoryItem,
  NonContractedQuoteItem,
} from "@/types/history";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Helper para acessar campos com nomes variáveis (espaços vs underscores)
const getField = (item: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) {
      return item[key];
    }
  }
  return undefined;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    // Handle various date formats
    if (dateStr.includes("/")) {
      return dateStr; // Already formatted
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
};

interface HistoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  type: HistoryType;
  data: (AppointmentHistoryItem | AttendanceHistoryItem | QuoteHistoryItem | SaleHistoryItem | NonContractedQuoteItem)[];
}

export function HistoryDetailDialog({
  open,
  onOpenChange,
  title,
  type,
  data,
}: HistoryDetailDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "appointments":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case "attendances":
        return <Stethoscope className="h-5 w-5 text-green-600" />;
      case "quotes":
        return <Receipt className="h-5 w-5 text-purple-600" />;
      case "sales":
        return <CreditCard className="h-5 w-5 text-orange-600" />;
      case "non_contracted_quotes":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    }
  };

  const renderAppointmentItem = (item: AppointmentHistoryItem, index: number) => (
    <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{item.PROCEDIMENTO || "Consulta"}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(item.DATA)} {item.HORÁRIO && `às ${item.HORÁRIO}`}
          </p>
        </div>
        {item.STATUS && (
          <Badge variant="outline" className="text-xs">
            {item.STATUS}
          </Badge>
        )}
      </div>
      {item.PROFISSIONAL && (
        <p className="text-xs text-muted-foreground">
          Profissional: {item.PROFISSIONAL}
        </p>
      )}
      {item.OBSERVAÇÃO && (
        <p className="text-xs text-muted-foreground mt-1">{item.OBSERVAÇÃO}</p>
      )}
    </div>
  );

  const renderAttendanceItem = (item: AttendanceHistoryItem, index: number) => (
    <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{item.PROCEDIMENTO || "Atendimento"}</p>
          <p className="text-xs text-muted-foreground">{formatDate(item.DATA)}</p>
        </div>
        {item.VALOR && (
          <span className="text-sm font-medium text-green-600">
            {formatCurrency(item.VALOR)}
          </span>
        )}
      </div>
      {item.DENTE && (
        <p className="text-xs text-muted-foreground">Dente: {item.DENTE}</p>
      )}
      {item.PROFISSIONAL && (
        <p className="text-xs text-muted-foreground">
          Profissional: {item.PROFISSIONAL}
        </p>
      )}
      {item.OBSERVAÇÃO && (
        <p className="text-xs text-muted-foreground mt-1">{item.OBSERVAÇÃO}</p>
      )}
    </div>
  );

  const renderQuoteItem = (item: QuoteHistoryItem, index: number) => {
    const itemData = item as unknown as Record<string, unknown>;
    
    // Aceitar ambos os formatos (espaços ou underscores)
    const dataCriacao = getField(itemData, 'DATA_CRIACAO', 'DATA CRIAÇÃO', 'DATA_CRIAÇÃO') as string;
    const status = getField(itemData, 'STATUS') as string;
    const valorContratado = getField(itemData, 'VALOR_CONTRATADO', 'VALOR CONTRATADO', 'valor_contratado_num') as number;
    const valorNaoContratado = getField(itemData, 'VALOR_NAO_CONTRATADO', 'VALOR NÃO CONTRATADO', 'VALOR NAO CONTRATADO', 'valor_nao_contratado_num') as number;
    const procedimentos = getField(itemData, 'PROCEDIMENTOS', 'PROCEDIMENTO') as string;
    const observacao = getField(itemData, 'OBSERVAÇÃO', 'OBSERVACAO') as string;
    
    return (
      <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-2">
        <div className="flex justify-between items-start">
          <p className="text-xs text-muted-foreground">
            {formatDate(dataCriacao || "")}
          </p>
          {status && (
            <Badge
              variant="outline"
              className={`text-xs ${
                status === "Aprovado" || status === "FECHADO"
                  ? "bg-green-50 text-green-700"
                  : status === "Cancelado"
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              {status}
            </Badge>
          )}
        </div>
        {procedimentos && (
          <p className="text-sm">{procedimentos}</p>
        )}
        <div className="flex gap-4 text-sm">
          {(valorContratado !== undefined && valorContratado > 0) && (
            <div>
              <span className="text-xs text-muted-foreground">Contratado: </span>
              <span className="font-medium text-green-600">
                {formatCurrency(valorContratado)}
              </span>
            </div>
          )}
          {(valorNaoContratado !== undefined && valorNaoContratado > 0) && (
            <div>
              <span className="text-xs text-muted-foreground">Não Contratado: </span>
              <span className="font-medium text-red-600">
                {formatCurrency(valorNaoContratado)}
              </span>
            </div>
          )}
        </div>
        {observacao && (
          <p className="text-xs text-muted-foreground mt-1">{observacao}</p>
        )}
      </div>
    );
  };

  const renderSaleItem = (item: SaleHistoryItem, index: number) => {
    const itemData = item as unknown as Record<string, unknown>;
    
    // Aceitar ambos os formatos
    const data = getField(itemData, 'DATA') as string;
    const valor = getField(itemData, 'VALOR') as number;
    const formaPagamento = getField(itemData, 'FORMA_PAGAMENTO', 'FORMA PAGAMENTO') as string;
    const procedimento = getField(itemData, 'PROCEDIMENTO') as string;
    const observacao = getField(itemData, 'OBSERVAÇÃO', 'OBSERVACAO') as string;
    
    return (
      <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{formatDate(data || "")}</p>
          <span className="font-bold text-green-600">{formatCurrency(valor || 0)}</span>
        </div>
        {procedimento && (
          <p className="text-sm">{procedimento}</p>
        )}
        {formaPagamento && (
          <p className="text-xs text-muted-foreground">
            Pagamento: {formaPagamento}
          </p>
        )}
        {observacao && (
          <p className="text-xs text-muted-foreground mt-1">{observacao}</p>
        )}
      </div>
    );
  };

  const renderNonContractedQuoteItem = (item: NonContractedQuoteItem, index: number) => {
    const itemData = item as unknown as Record<string, unknown>;
    
    const data = getField(itemData, 'DATA', 'data') as string;
    const procedimento = getField(itemData, 'PROCEDIMENTO', 'procedimento') as string;
    const especialidade = getField(itemData, 'ESPECIALIDADE', 'especialidade') as string;
    const valor = getField(itemData, 'VALOR', 'valor', 'valor_num') as number;
    const observacao = getField(itemData, 'OBSERVACAO', 'OBSERVAÇÃO', 'observacao') as string;
    
    return (
      <div key={index} className="p-3 border border-orange-200 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 space-y-2">
        <div className="flex justify-between items-start">
          <p className="text-xs text-muted-foreground">{formatDate(data || "")}</p>
          {valor > 0 && (
            <span className="font-medium text-orange-700">
              {formatCurrency(valor)}
            </span>
          )}
        </div>
        {procedimento && <p className="text-sm font-medium">{procedimento}</p>}
        {especialidade && (
          <Badge variant="outline" className="text-xs bg-orange-100/50 text-orange-700">
            {especialidade}
          </Badge>
        )}
        {observacao && (
          <p className="text-xs text-muted-foreground mt-1">{observacao}</p>
        )}
      </div>
    );
  };

  const renderItem = (item: unknown, index: number) => {
    switch (type) {
      case "appointments":
        return renderAppointmentItem(item as AppointmentHistoryItem, index);
      case "attendances":
        return renderAttendanceItem(item as AttendanceHistoryItem, index);
      case "quotes":
        return renderQuoteItem(item as QuoteHistoryItem, index);
      case "sales":
        return renderSaleItem(item as SaleHistoryItem, index);
      case "non_contracted_quotes":
        return renderNonContractedQuoteItem(item as NonContractedQuoteItem, index);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {data && data.length > 0 ? (
            <div className="space-y-2">
              {data.map((item, index) => renderItem(item, index))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro encontrado
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
