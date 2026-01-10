import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadTimerProps {
  lastInteractionAt?: string | null;
  createdAt: string;
  className?: string;
  showIcon?: boolean;
}

type TimerColor = 'green' | 'yellow' | 'orange' | 'red';

function getTimerColor(hours: number): TimerColor {
  if (hours < 1) return 'green';
  if (hours < 4) return 'yellow';
  if (hours < 24) return 'orange';
  return 'red';
}

function getColorClasses(color: TimerColor): string {
  switch (color) {
    case 'green':
      return 'text-green-600 bg-green-50';
    case 'yellow':
      return 'text-yellow-600 bg-yellow-50';
    case 'orange':
      return 'text-orange-600 bg-orange-50';
    case 'red':
      return 'text-red-600 bg-red-50';
  }
}

function formatElapsedTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m`;
  }
  
  return '< 1m';
}

export function LeadTimer({ lastInteractionAt, createdAt, className, showIcon = true }: LeadTimerProps) {
  const [elapsed, setElapsed] = useState<string>("");
  const [color, setColor] = useState<TimerColor>('green');

  useEffect(() => {
    const baseTime = lastInteractionAt ? new Date(lastInteractionAt) : new Date(createdAt);
    
    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - baseTime.getTime();
      
      // Don't show negative time
      if (diff < 0) {
        setElapsed('< 1m');
        setColor('green');
        return;
      }
      
      const hours = diff / (1000 * 60 * 60);
      setElapsed(formatElapsedTime(diff));
      setColor(getTimerColor(hours));
    };
    
    updateTimer();
    
    // Update every minute
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, [lastInteractionAt, createdAt]);

  if (!elapsed) return null;

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
        getColorClasses(color),
        className
      )}
      title={`Tempo desde ${lastInteractionAt ? 'última interação' : 'criação'}`}
    >
      {showIcon && <Clock className="h-3 w-3" />}
      {elapsed}
    </span>
  );
}