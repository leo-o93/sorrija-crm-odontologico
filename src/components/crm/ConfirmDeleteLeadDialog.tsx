import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2, MessageSquare, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConfirmDeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  leadId: string;
  leadName: string;
  isDeleting?: boolean;
}

interface RelatedDataCount {
  messages: number;
  conversations: number;
  appointments: number;
  quotes: number;
}

export function ConfirmDeleteLeadDialog({
  open,
  onOpenChange,
  onConfirm,
  leadId,
  leadName,
  isDeleting = false,
}: ConfirmDeleteLeadDialogProps) {
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [confirmText, setConfirmText] = useState("");
  const [relatedData, setRelatedData] = useState<RelatedDataCount | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (open && leadId) {
      fetchRelatedData();
    } else {
      setStep("warning");
      setConfirmText("");
      setRelatedData(null);
    }
  }, [open, leadId]);

  const fetchRelatedData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch conversations linked to this lead
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("lead_id", leadId);

      const conversationIds = conversations?.map((c) => c.id) || [];

      // Count messages
      let messagesCount = 0;
      if (conversationIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds);
        messagesCount = count || 0;
      }

      // Count appointments
      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", leadId);

      // Count quotes
      const { count: quotesCount } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", leadId);

      setRelatedData({
        messages: messagesCount,
        conversations: conversationIds.length,
        appointments: appointmentsCount || 0,
        quotes: quotesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching related data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleClose = () => {
    setStep("warning");
    setConfirmText("");
    onOpenChange(false);
  };

  const handleContinue = () => {
    setStep("confirm");
  };

  const handleBack = () => {
    setStep("warning");
    setConfirmText("");
  };

  const handleConfirm = () => {
    if (confirmText === "EXCLUIR") {
      onConfirm();
    }
  };

  const hasRelatedData =
    relatedData &&
    (relatedData.messages > 0 ||
      relatedData.conversations > 0 ||
      relatedData.appointments > 0 ||
      relatedData.quotes > 0);

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        {step === "warning" ? (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-4 pt-2">
                  <p>
                    Você está prestes a excluir o lead <strong>"{leadName}"</strong> e{" "}
                    <strong>TODOS</strong> os dados relacionados:
                  </p>

                  {isLoadingData ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : relatedData ? (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{relatedData.messages} mensagens</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{relatedData.conversations} conversas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{relatedData.appointments} agendamentos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{relatedData.quotes} orçamentos</span>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-destructive font-medium">
                    Esta ação não pode ser desfeita!
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleContinue}
                disabled={isLoadingData}
              >
                Continuar para confirmar
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <AlertDialogTitle>Confirmar Exclusão Permanente</AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-4 pt-2">
                  <p>
                    Para confirmar a exclusão permanente, digite{" "}
                    <strong className="text-destructive">EXCLUIR</strong> abaixo:
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete">Confirmação</Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                      placeholder="Digite EXCLUIR"
                      className="font-mono"
                      disabled={isDeleting}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleBack} disabled={isDeleting}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={confirmText !== "EXCLUIR" || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Permanentemente
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
