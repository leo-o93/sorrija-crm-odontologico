import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAssistantInsights } from "@/hooks/useAssistantInsights";

export function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const { isLoading, suggestions, highlights } = useAssistantInsights();

  const suggestionCount = suggestions.reduce((total, suggestion) => total + suggestion.count, 0);

  return (
    <>
      <Button
        type="button"
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente de IA"
      >
        <Sparkles className="h-6 w-6" />
        {suggestionCount > 0 && (
          <Badge
            className="absolute -top-2 -right-2 px-2 py-0.5 text-xs"
            variant="destructive"
          >
            {suggestionCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Assistente IA</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={`assistant-card-${index}`} className="h-20 w-full" />
                  ))
                : highlights.map((highlight) => (
                    <Card key={highlight.id} className="p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        {highlight.title}
                      </p>
                      {highlight.items.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {highlight.items.map((item) => (
                            <li key={item} className="truncate">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {highlight.emptyLabel}
                        </p>
                      )}
                    </Card>
                  ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Sugestões do dia</p>
                <p className="text-xs text-muted-foreground">
                  Insights rápidos para priorizar suas próximas ações.
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : suggestions.length > 0 ? (
                <ScrollArea className="max-h-60 pr-4">
                  <ul className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{suggestion.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.description}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link to={suggestion.href}>{suggestion.actionLabel}</Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Nenhuma sugestão crítica no momento. Ótimo trabalho!
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
