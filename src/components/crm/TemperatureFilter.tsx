import { Button } from "@/components/ui/button";
import { AlertTriangle, Snowflake, Sparkles, X, ThermometerSun, MessageCircle, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemperatureFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const filters = [
  { value: null, label: "Todos", icon: ThermometerSun },
  { value: "novo", label: "Novos", icon: Sparkles, color: "text-blue-600" },
  { value: "faltou_cancelou", label: "Faltou/Cancelou", icon: AlertTriangle, color: "text-yellow-600" },
  { value: "em_conversa", label: "Em Conversa", icon: MessageCircle, color: "text-green-600" },
  { value: "agendado", label: "Agendados", icon: CalendarCheck, color: "text-emerald-600" },
  { value: "frio", label: "Frios", icon: Snowflake, color: "text-slate-500" },
  { value: "perdido", label: "Perdidos", icon: X, color: "text-red-600" },
];

export function TemperatureFilter({ value, onChange }: TemperatureFilterProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = value === filter.value;
        
        return (
          <Button
            key={filter.value || "all"}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(filter.value)}
            className={cn(
              "gap-1",
              !isActive && filter.color
            )}
          >
            <Icon className="h-4 w-4" />
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
