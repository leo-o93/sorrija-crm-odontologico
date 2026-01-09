import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RealtimeLogsProps {
  logs: Array<{
    id: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
    timestamp: string;
  }>;
}

export function RealtimeLogs({ logs }: RealtimeLogsProps) {
  const [filter, setFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter((log) => log.level === filter);
  }, [filter, logs]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Logs em tempo real</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warn</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px]">
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum log disponível.</p>
            ) : (
              filteredLogs.slice(0, 50).map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <Badge
                    variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'default' : 'secondary'}
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.timestamp} • {log.source}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
