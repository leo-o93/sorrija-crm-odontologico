import { useMemo } from "react";
import { addDays, differenceInDays, isAfter, isBefore } from "date-fns";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useAppointments, Appointment } from "@/hooks/useAppointments";
import { useConversations, Conversation } from "@/hooks/useConversations";
import {
  useFinancialTransactions,
  FinancialTransaction,
} from "@/hooks/useFinancialTransactions";

const STALE_LEAD_DAYS = 3;
const UPCOMING_APPOINTMENT_DAYS = 7;

export interface AssistantSuggestion {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  count: number;
}

export interface AssistantHighlights {
  id: string;
  title: string;
  items: string[];
  emptyLabel: string;
}

export interface AssistantInsightsData {
  hotLeadsWithoutContact: Lead[];
  upcomingAppointments: Appointment[];
  pendingConversations: Conversation[];
  overdueReceivables: FinancialTransaction[];
}

export function useAssistantInsights() {
  const { data: leads, isLoading: isLoadingLeads } = useLeads();
  const { data: appointments, isLoading: isLoadingAppointments } = useAppointments();
  const { conversations, isLoading: isLoadingConversations } = useConversations("all");
  const { data: transactions, isLoading: isLoadingTransactions } =
    useFinancialTransactions({ status: "all" });

  const insights = useMemo<AssistantInsightsData>(() => {
    const now = new Date();
    const staleThreshold = addDays(now, -STALE_LEAD_DAYS);
    const upcomingThreshold = addDays(now, UPCOMING_APPOINTMENT_DAYS);

    const hotLeadsWithoutContact = (leads || []).filter((lead) => {
      if (lead.temperature !== "quente") return false;
      if (!lead.last_interaction_at) return true;
      return isBefore(new Date(lead.last_interaction_at), staleThreshold);
    });

    const upcomingAppointments = (appointments || []).filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      const isUpcoming =
        (isAfter(appointmentDate, now) ||
          differenceInDays(appointmentDate, now) === 0) &&
        isBefore(appointmentDate, upcomingThreshold);
      const isActiveStatus =
        appointment.status === "scheduled" || appointment.status === "confirmed";
      return isUpcoming && isActiveStatus;
    });

    const pendingConversations = (conversations || []).filter((conversation) => {
      if (conversation.status === "pending") return true;
      return conversation.status === "open" && conversation.unread_count > 0;
    });

    const overdueReceivables = (transactions || []).filter((transaction) => {
      if (transaction.type !== "receita") return false;
      if (transaction.status === "overdue") return true;
      if (transaction.status !== "pending" || !transaction.due_date) return false;
      return isBefore(new Date(transaction.due_date), now);
    });

    return {
      hotLeadsWithoutContact,
      upcomingAppointments,
      pendingConversations,
      overdueReceivables,
    };
  }, [appointments, conversations, leads, transactions]);

  const suggestions = useMemo<AssistantSuggestion[]>(() => {
    const nextSuggestions: AssistantSuggestion[] = [];

    if (insights.hotLeadsWithoutContact.length > 0) {
      nextSuggestions.push({
        id: "hot-leads",
        title: "Leads quentes sem contato recente",
        description: `${insights.hotLeadsWithoutContact.length} lead(s) quente(s) sem interação há ${STALE_LEAD_DAYS} dias ou mais.`,
        actionLabel: "Abrir CRM",
        href: "/crm",
        count: insights.hotLeadsWithoutContact.length,
      });
    }

    if (insights.upcomingAppointments.length > 0) {
      nextSuggestions.push({
        id: "upcoming-appointments",
        title: "Agenda próxima",
        description: `${insights.upcomingAppointments.length} agendamento(s) confirmados nos próximos ${UPCOMING_APPOINTMENT_DAYS} dias.`,
        actionLabel: "Ver agenda",
        href: "/agenda",
        count: insights.upcomingAppointments.length,
      });
    }

    if (insights.pendingConversations.length > 0) {
      nextSuggestions.push({
        id: "pending-conversations",
        title: "Conversas aguardando resposta",
        description: `${insights.pendingConversations.length} conversa(s) abertas ou pendentes com mensagens não lidas.`,
        actionLabel: "Abrir conversas",
        href: "/conversas",
        count: insights.pendingConversations.length,
      });
    }

    if (insights.overdueReceivables.length > 0) {
      nextSuggestions.push({
        id: "overdue-receivables",
        title: "Recebimentos em atraso",
        description: `${insights.overdueReceivables.length} recebimento(s) vencidos precisam de atenção.`,
        actionLabel: "Abrir financeiro",
        href: "/financeiro",
        count: insights.overdueReceivables.length,
      });
    }

    return nextSuggestions;
  }, [insights]);

  const highlights = useMemo<AssistantHighlights[]>(() => {
    return [
      {
        id: "hot-leads",
        title: "Leads quentes sem contato",
        items: insights.hotLeadsWithoutContact.slice(0, 3).map((lead) => lead.name),
        emptyLabel: "Nenhum lead quente sem contato recente.",
      },
      {
        id: "appointments",
        title: "Agenda próxima",
        items: insights.upcomingAppointments
          .slice(0, 3)
          .map((appointment) => appointment.lead?.name || appointment.patient?.name || "Sem nome"),
        emptyLabel: "Nenhum agendamento próximo nos próximos dias.",
      },
      {
        id: "conversations",
        title: "Conversas sem resposta",
        items: insights.pendingConversations
          .slice(0, 3)
          .map((conversation) => conversation.leads?.name || conversation.patients?.name || conversation.phone),
        emptyLabel: "Nenhuma conversa aguardando resposta.",
      },
      {
        id: "finance",
        title: "Recebimentos em atraso",
        items: insights.overdueReceivables
          .slice(0, 3)
          .map((transaction) => transaction.description || "Recebimento sem descrição"),
        emptyLabel: "Nenhum recebimento vencido no momento.",
      },
    ];
  }, [insights]);

  const isLoading =
    isLoadingLeads ||
    isLoadingAppointments ||
    isLoadingConversations ||
    isLoadingTransactions;

  return {
    isLoading,
    insights,
    suggestions,
    highlights,
  };
}
