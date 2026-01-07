import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake, ThermometerSun, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemperatureBadgeProps {
  temperature: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const temperatureConfig: Record<string, {
  label: string;
  icon: typeof Flame;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  novo: {
    label: "Novo",
    icon: Sparkles,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  quente: {
    label: "Quente",
    icon: Flame,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
    borderColor: "border-orange-300 dark:border-orange-700",
  },
  frio: {
    label: "Frio",
    icon: Snowflake,
    bgColor: "bg-slate-100 dark:bg-slate-900/30",
    textColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-300 dark:border-slate-700",
  },
  perdido: {
    label: "Perdido",
    icon: X,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-300 dark:border-red-700",
  },
};

const sizeClasses = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-sm px-2 py-1",
  lg: "text-base px-3 py-1.5",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function TemperatureBadge({ 
  temperature, 
  size = "md", 
  showLabel = true,
  className 
}: TemperatureBadgeProps) {
  const config = temperatureConfig[temperature || "novo"] || temperatureConfig.novo;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border gap-1 inline-flex items-center",
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}

export function getTemperatureColor(temperature: string | null): string {
  return temperatureConfig[temperature || "novo"]?.borderColor || temperatureConfig.novo.borderColor;
}
