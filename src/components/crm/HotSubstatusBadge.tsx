import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, FileText, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotSubstatusBadgeProps {
  substatus: string | null;
  size?: "sm" | "md";
  className?: string;
}

const substatusConfig: Record<string, {
  label: string;
  icon: typeof MessageCircle;
  bgColor: string;
  textColor: string;
}> = {
  em_conversa: {
    label: "Em conversa",
    icon: MessageCircle,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
  },
  aguardando_resposta: {
    label: "Aguardando resposta",
    icon: Clock,
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-300",
  },
  em_negociacao: {
    label: "Em negociação",
    icon: FileText,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  follow_up_agendado: {
    label: "Follow-up agendado",
    icon: CalendarCheck,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-700 dark:text-purple-300",
  },
};

const sizeClasses = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-sm px-2 py-1",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
};

export function HotSubstatusBadge({ substatus, size = "sm", className }: HotSubstatusBadgeProps) {
  if (!substatus) return null;
  
  const config = substatusConfig[substatus];
  if (!config) return null;
  
  const Icon = config.icon;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-normal gap-1 inline-flex items-center",
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  );
}

export function getSubstatusLabel(substatus: string | null): string {
  return substatusConfig[substatus || ""]?.label || substatus || "";
}
