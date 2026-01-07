import { Button } from "@/components/ui/button";
import { Flame, Snowflake, Sparkles, X, ThermometerSun, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemperatureFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const filters = [
  { value: null, label: "Todos", icon: ThermometerSun },
  { value: "novo", label: "Novos", icon: Sparkles, color: "text-blue-600" },
  { value: "quente", label: "Quentes", icon: Flame, color: "text-orange-600" },
  { value: "em_conversa", label: "Em Conversa", icon: MessageCircle, color: "text-green-600" },
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
