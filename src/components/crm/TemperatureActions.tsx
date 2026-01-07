import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Snowflake, 
  X, 
  Calendar, 
  FileText, 
  RotateCcw,
  PhoneOutgoing
} from "lucide-react";
import { useUpdateLeadTemperature } from "@/hooks/useUpdateLeadTemperature";

interface TemperatureActionsProps {
  leadId: string;
  currentTemperature: string | null;
  onActionComplete?: () => void;
}

export function TemperatureActions({ 
  leadId, 
  currentTemperature, 
  onActionComplete 
}: TemperatureActionsProps) {
  const updateTemperature = useUpdateLeadTemperature();

  const handleTemperatureChange = (temperature: string, substatus?: string) => {
    updateTemperature.mutate(
      { id: leadId, temperature, hot_substatus: substatus },
      { onSuccess: onActionComplete }
    );
  };

  const isLoading = updateTemperature.isPending;

  switch (currentTemperature) {
    case "novo":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("quente", "em_conversa")}
            disabled={isLoading}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <Flame className="h-4 w-4 mr-1" />
            Marcar Quente
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("frio")}
            disabled={isLoading}
            className="text-slate-600"
          >
            <Snowflake className="h-4 w-4 mr-1" />
            Marcar Frio
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("perdido")}
            disabled={isLoading}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
        </div>
      );

    case "quente":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            className="text-primary"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Agendar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            className="text-blue-600"
          >
            <FileText className="h-4 w-4 mr-1" />
            Enviar Orçamento
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("frio")}
            disabled={isLoading}
            className="text-slate-600"
          >
            <Snowflake className="h-4 w-4 mr-1" />
            Marcar Frio
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("perdido")}
            disabled={isLoading}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
        </div>
      );

    case "frio":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            className="text-primary"
          >
            <PhoneOutgoing className="h-4 w-4 mr-1" />
            Follow-up
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("quente", "em_conversa")}
            disabled={isLoading}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reativar como Quente
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("perdido")}
            disabled={isLoading}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
        </div>
      );

    case "perdido":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTemperatureChange("quente", "em_conversa")}
            disabled={isLoading}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reativar como Quente
          </Button>
        </div>
      );

    default:
      return null;
  }
}
