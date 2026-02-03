import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Snowflake, 
  X, 
  RotateCcw
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
            onClick={() => handleTemperatureChange("faltou_cancelou", "em_conversa")}
            disabled={isLoading}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
          >
            <Flame className="h-4 w-4 mr-1" />
            Marcar Faltou/Cancelou
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
    case "faltou_cancelou":
      return (
        <div className="flex flex-wrap gap-2">
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
            onClick={() => handleTemperatureChange("faltou_cancelou", "em_conversa")}
            disabled={isLoading}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reativar como Faltou/Cancelou
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
            onClick={() => handleTemperatureChange("faltou_cancelou", "em_conversa")}
            disabled={isLoading}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reativar como Faltou/Cancelou
          </Button>
        </div>
      );

    default:
      return null;
  }
}
