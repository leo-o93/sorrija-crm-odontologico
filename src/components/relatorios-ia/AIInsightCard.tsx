import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  subtitle?: string;
}

export function AIInsightCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'default',
  subtitle
}: AIInsightCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
    info: 'text-info',
  };

  const bgClasses = {
    default: 'bg-muted/50',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    destructive: 'bg-destructive/10',
    info: 'bg-info/10',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={cn("transition-all hover:shadow-md", bgClasses[color])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className={cn("text-2xl font-bold", colorClasses[color])}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-2 rounded-full", bgClasses[color])}>
            <Icon className={cn("h-5 w-5", colorClasses[color])} />
          </div>
        </div>
        
        {trend && trendValue && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendIcon className={cn(
              "h-3 w-3",
              trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            )} />
            <span className={cn(
              trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
