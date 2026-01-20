import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CreditCard, Receipt, Stethoscope } from "lucide-react";
import {
  HistoryType,
  AppointmentHistoryItem,
  AttendanceHistoryItem,
  QuoteHistoryItem,
  SaleHistoryItem,
} from "@/types/history";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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
  data: (AppointmentHistoryItem | AttendanceHistoryItem | QuoteHistoryItem | SaleHistoryItem)[];
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

  const renderQuoteItem = (item: QuoteHistoryItem, index: number) => (
    <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-2">
      <div className="flex justify-between items-start">
        <p className="text-xs text-muted-foreground">
          {formatDate(item.DATA_CRIACAO || "")}
        </p>
        {item.STATUS && (
          <Badge
            variant="outline"
            className={`text-xs ${
              item.STATUS === "Aprovado" || item.STATUS === "FECHADO"
                ? "bg-green-50 text-green-700"
                : item.STATUS === "Cancelado"
                ? "bg-red-50 text-red-700"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            {item.STATUS}
          </Badge>
        )}
      </div>
      {item.PROCEDIMENTOS && (
        <p className="text-sm">{item.PROCEDIMENTOS}</p>
      )}
      <div className="flex gap-4 text-sm">
        {(item.VALOR_CONTRATADO !== undefined && item.VALOR_CONTRATADO > 0) && (
          <div>
            <span className="text-xs text-muted-foreground">Contratado: </span>
            <span className="font-medium text-green-600">
              {formatCurrency(item.VALOR_CONTRATADO)}
            </span>
          </div>
        )}
        {(item.VALOR_NAO_CONTRATADO !== undefined && item.VALOR_NAO_CONTRATADO > 0) && (
          <div>
            <span className="text-xs text-muted-foreground">Não Contratado: </span>
            <span className="font-medium text-red-600">
              {formatCurrency(item.VALOR_NAO_CONTRATADO)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderSaleItem = (item: SaleHistoryItem, index: number) => (
    <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-1">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{formatDate(item.DATA)}</p>
        <span className="font-bold text-green-600">{formatCurrency(item.VALOR)}</span>
      </div>
      {item.PROCEDIMENTO && (
        <p className="text-sm">{item.PROCEDIMENTO}</p>
      )}
      {item.FORMA_PAGAMENTO && (
        <p className="text-xs text-muted-foreground">
          Pagamento: {item.FORMA_PAGAMENTO}
        </p>
      )}
      {item.OBSERVAÇÃO && (
        <p className="text-xs text-muted-foreground mt-1">{item.OBSERVAÇÃO}</p>
      )}
    </div>
  );

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
