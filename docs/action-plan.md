# Plano de ação por fases (CRM Odontológico + SaaS multi-organizações)

Este plano foi elaborado a partir do diagnóstico técnico e do backlog solicitado, organizando correções, melhorias e novas implementações em fases executáveis.

## Fase 1 — Correções críticas (build e estabilidade)
- Corrigir tipagem no `SearchEntityInput` (erro de type em `contacts_search`).
- Corrigir query/relacionamento de organização em `OrganizationContext`.
- Corrigir query de membros em `CRM` (relacionamento `organization_members -> profiles`).

## Fase 2 — Agenda (status, cores e visão “Hoje”)
- Renomear status **Reagendado** para **Atenção**.
- Atualizar cores dos status conforme especificação:
  - **Cancelado**: roxo
  - **Atendido**: preto
  - **Atenção**: amarelo
- Implementar visão “Hoje” detalhada por horário e por profissional (timeline/colunas).
- Adicionar botão “Abrir Paciente” no modal de agendamento.

## Fase 3 — Funis separados (Leads x Pacientes)
- Criar funil de pacientes separado (FECHOU TUDO, FECHOU PARTE, NÃO FECHOU, PÓS‑VENDA).
- Implementar status no banco + hooks + UI para o funil de pacientes.

## Fase 4 — Orçamentos e pagamentos
- Exibir data do orçamento na UI.
- Adicionar botões de status: **NÃO FECHOU**, **FECHOU PARTE**, **FECHOU TUDO**.
- Implementar seleção multi‑select de dentes por item.
- Permitir **adicionar procedimentos** a um orçamento existente.
- Implementar trava: só marcar como executado se houver pagamento.
- Adicionar campos financeiros: `fee_percent`, `fee_value`, `discount_value`, `net_value`.
- Vincular payment items a procedimentos quando aplicável.
- Relatório por procedimento (executados, pagos, pendentes).

## Fase 5 — Ajustes de paciente
- Remover campos médicos não utilizados (emergência, alergias, histórico, medicamentos).
- Adicionar origem do paciente (Indicação, Anúncios, Veio da Rua).
- Implementar notas com data/autor (CRUD).
- Renomear “Receita Total do Paciente” para “Pagamentos”.
- Substituir `active` por arquivar/desarquivar com `archived_at`.
- Separar abas “Informações Gerais” e “Métricas do Paciente”.

## Fase 6 — Conversas (Inbox)
- Implementar filtros completos: ABERTAS, PACIENTE, AGENDADO, PERDIDO, FALTOU/CANCELOU, TODAS, ALERTA.
- Restringir hard delete para admin/superadmin com confirmação forte.

## Fase 7 — Fila de atendimento
- Exibir tempo de espera/atendimento calculado visualmente.
- Destacar profissional responsável na listagem.

## Fase 8 — Chat interno
- Exibir badge de mensagens não lidas.
- Implementar salas privadas na UI.

## Fase 9 — Testes e QA
- Criar testes E2E: Agenda, CRM/Leads, Conversas, Profissionais, Pacientes, Fila, Chat Interno.
- Atualizar checklist de QA com os cenários críticos.

---

> Resultado esperado: CRM odontológico com fluxo clínico completo, funis separados, agenda operacional, finanças detalhadas e QA automatizado.
